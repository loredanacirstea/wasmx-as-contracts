import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import * as tnd from "wasmx-tendermint/assembly/actions";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as roles from 'wasmx-env/assembly/roles';
import { Base64String, CallRequest } from "wasmx-env/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import * as consutil from "wasmx-consensus/assembly/utils";
import * as timetypes from "wasmx-time/assembly/types";
import * as wblocks from "wasmx-blocks/assembly/types";
import { Block, CurrentState, Header } from "./types";
import { getTimeChainLastBlock, setTimeChainEntropy } from "./time";
import { getCurrentState, getLastBlock, getLastBlockByIndex, setBlock, setCurrentState } from "./storage";
import { getLastLogIndex } from "wasmx-tendermint/assembly/action_utils";
import { getLogEntryAggregate, getSelfNodeInfo, setFinalizedBlock } from "wasmx-tendermint-p2p/assembly/action_utils";
import { getLastBlockIndex } from "wasmx-blocks/assembly/storage";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { LogEntryAggregate } from "wasmx-tendermint-p2p/assembly/types";
import { extractIndexedTopics, getCommitHash, getResultsHash } from "wasmx-consensus-utils/assembly/utils";
import { base64ToHex } from "wasmx-utils/assembly/utils";
import { removeLogEntry } from "wasmx-tendermint-p2p/assembly/storage";
import { BigInt } from "wasmx-env/assembly/bn";
import * as cfg from "./config";

export function getLastBlockCommit(height: i64, state: CurrentState): typestnd.BlockCommit {
    // const bcommit = new typestnd.BlockCommit(height, state.last_round, state.last_block_id, state.last_block_signatures)
    const bcommit = new typestnd.BlockCommit(height, 0, state.last_block_id, [])
    return bcommit
}

// TODO include time block in this block
// TODO introduce a metadata field in blocks & metadatahash in headers
export function proposeBlock(): void {
    const height = getLastLogIndex();
    let state = getCurrentState()
    // we propose a new block or overwrite any other past proposal
    // we take the last block signed precommits from the current state
    const lastBlockCommit = getLastBlockCommit(height, state);
    const result = tnd.proposeBlockInternalAndStore(lastBlockCommit)
    if (result == null) return;

    state = getCurrentState()
    state.nextHash = result.proposal.hash;
    setCurrentState(state);
}

export function commitBlock(): void {
    const state = getCurrentState();
    const lastFinalizedIndex = getLastBlockIndex();
    if (state.nextHeight > lastFinalizedIndex) {
        const state = getCurrentState();
        // state.last_round = getTermId();
        setCurrentState(state);
        startBlockFinalizationFollower(state.nextHeight);
    }
}

export function startBlockFinalizationFollower(index: i64): boolean {
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    return startBlockFinalizationFollowerInternal(entryobj)
}

export function startBlockFinalizationFollowerInternal(entryobj: LogEntryAggregate): boolean {
    LoggerInfo("start block finalization", ["height", entryobj.index.toString()])
    LoggerDebug("start block finalization", ["height", entryobj.index.toString(), "proposerId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
}


// TODO CommitInfo saved in block! from voting process
function startBlockFinalizationInternal(entryobj: LogEntryAggregate, retry: boolean): boolean {
    const processReqStr = String.UTF8.decode(base64.decode(entryobj.data.data).buffer);
    const processReq = JSON.parse<typestnd.RequestProcessProposal>(processReqStr);
    const finalizeReq = new typestnd.RequestFinalizeBlock(
        processReq.txs,
        processReq.proposed_last_commit, // TODO we retrieve the signatures
        processReq.misbehavior,
        processReq.hash,
        processReq.height,
        processReq.time,
        processReq.next_validators_hash,
        processReq.proposer_address,
    )

    // const blockDataBeginBlock = JSON.stringify<typestnd.RequestFinalizeBlock>(finalizeReq)
    // callHookContract("BeginBlock", blockDataBeginBlock);
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
    }

    let respWrap = consensuswrap.FinalizeBlock(finalizeReq);
    if (respWrap.error.length > 0 && !retry) {
        // ERR invalid height: 3232; expected: 3233
        const mismatchErr = `expected: ${(finalizeReq.height + 1).toString()}`
        if (respWrap.error.includes("invalid height") && respWrap.error.includes(mismatchErr)) {
            const rollbackHeight = finalizeReq.height - 1;
            LoggerInfo(`trying to rollback`, ["height", rollbackHeight.toString()])
            const err = consensuswrap.RollbackToVersion(rollbackHeight);
            if (err.length > 0) {
                revert(`consensus break: ${respWrap.error}; ${err}`);
                return false;
            }
            // repeat FinalizeBlock
            return startBlockFinalizationInternal(entryobj, true);
        } else {
            revert(respWrap.error)
            return false;
        }
    }
    const finalizeResp = respWrap.data;
    if (finalizeResp == null) {
        revert("FinalizeBlock response is null");
        return false;
    }

    const resultstr = JSON.stringify<typestnd.ResponseFinalizeBlock>(finalizeResp);
    const resultBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(resultstr)));

    entryobj.data.result = resultBase64;

    const commitBz = String.UTF8.decode(base64.decode(entryobj.data.last_commit).buffer);
    const commit = JSON.parse<typestnd.BlockCommit>(commitBz);

    const last_commit_hash = getCommitHash(commit);
    const last_results_hash = getResultsHash(finalizeResp.tx_results);

    // update current state
    LoggerDebug("updating current state...", [])
    const state = getCurrentState();
    state.app_hash = finalizeResp.app_hash;
    state.last_block_id = new typestnd.BlockID(
        base64ToHex(finalizeReq.hash),
        new typestnd.PartSetHeader(0, base64ToHex(finalizeReq.hash.slice(0, 8)))
    );
    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    state.nextHeight = finalizeReq.height + 1
    // we move precommit votes for this block to current state, so it is included in the next block proposal
    // state.last_block_signatures = getCommitSigsFromPrecommitArray();
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    // updateConsensusParams(finalizeResp.consensus_param_updates);
    // update validator info
    LoggerDebug("updating validator info...", [])
    // updateValidators(finalizeResp.validator_updates);

    // ! make all state changes before the commit

    // save final block
    const txhashes: string[] = [];
    for (let i = 0; i < finalizeReq.txs.length; i++) {
        const hash = wasmxw.sha256(finalizeReq.txs[i]);
        txhashes.push(hash);
    }

    const blockData = JSON.stringify<wblocks.BlockEntry>(entryobj.data)
    // also indexes transactions
    // index events: eventTopic => txhash[]
    const indexedTopics = extractIndexedTopics(finalizeResp, txhashes)
    setFinalizedBlock(blockData, finalizeReq.hash, txhashes, indexedTopics);

    // remove temporary block data
    removeLogEntry(entryobj.index);

    // before commiting, we check if consensus contract was changed
    let evs = finalizeResp.events
    for (let i = 0; i < finalizeResp.tx_results.length; i++) {
        evs = evs.concat(finalizeResp.tx_results[i].events)
    }
    const info = consutil.defaultFinalizeResponseEventsParse(evs)

    const resend = consensuswrap.EndBlock(blockData);
    if (resend.error.length > 0) {
        revert(`${resend.error}`);
    }

    if (info.createdValidators.length > 0) {
        for (let i = 0; i < info.createdValidators.length; i++) {
            // move node info to validator info if it exists
            LoggerInfo("new validator", ["height", entryobj.index.toString(), "address", info.createdValidators[i]])
            tnd.callHookContract("CreatedValidator", info.createdValidators[i]);
        }
    }

    if (info.initChainRequests.length > 0) {
        for (let i = 0; i < info.initChainRequests.length; i++) {
            initSubChain(info.initChainRequests[i], state);
        }
    }

    // we have finalized and saved the new block
    // so we can execute setup on the new contract
    // this way, the delay of the timed action that starts the new consensus fsm is minimal.
    let newContractSetup = false;
    if (info.consensusContract !== "") {
        const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
        LoggerInfo("setting up next consensus contract", ["new contract", info.consensusContract, "previous contract", myaddress])
        let calldata = `{"run":{"event":{"type":"setup","params":[{"key":"address","value":"${myaddress}"}]}}}`
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", info.consensusContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, cfg.MODULE_NAME);
            if (resp.success > 0) {
                LoggerError("cannot stop previous consensus contract", ["err", resp.data]);
                // TODO what now?
            } else {
                LoggerInfo("stopped current consensus contract", [])
            }
        }
    }

    const commitResponse = consensuswrap.Commit();
    // TODO commitResponse.retainHeight
    // Tendermint removes all data for heights lower than `retain_height`
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString()])

    if (info.createdValidators.length > 0) {
        const ouraddr = getSelfNodeInfo().address
        for (let i = 0; i < info.createdValidators.length; i++) {
            if (info.createdValidators[i] == ouraddr) {
                LoggerInfo("node is validator", ["height", entryobj.index.toString(), "address", ouraddr])

                // call consensus contract with "becomeValidator" transition
                const calldatastr = `{"run":{"event": {"type": "becomeValidator", "params": []}}}`;
                tnd.callContract(wasmxw.getAddress(), calldatastr, false);
            }
        }
    }

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role

    // if consensus changed, start the new contract
    if (info.consensusContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", info.consensusContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError
            ("cannot start next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, cfg.MODULE_NAME);
            if (resp.success > 0) {
                LoggerError("cannot restart previous consensus contract", ["err", resp.data]);
            } else {
                LoggerInfo("restarted current consensus contract", [])
            }
        } else {
            LoggerInfo("next consensus contract is started", ["new contract", info.consensusContract])
            // consensus changed
            return true;
        }
    }
    return false;
}

// TODO remove these functions
export function buildNewBlock(transactions: Base64String[], chain_id: string): Block {
    const lastBlock = getLastBlock();

    const txhashes = new Array<Base64String>(transactions.length)
    const datahashdata = new Uint8Array(32 * transactions.length);
    for (let i = 0; i < transactions.length; i++) {
        const txhashbz = sha256.digestWrap(base64.decode(transactions[i]).buffer)
        const txhash = base64.encode(Uint8Array.wrap(txhashbz))
        txhashes[i] = txhash;
        datahashdata.set(Uint8Array.wrap(txhashbz), i*32)
    }
    const datahash = sha256.digestWrap(datahashdata.buffer);
    const datahashstr = base64.encode(Uint8Array.wrap(datahash))

    setTimeChainEntropy(datahashstr);
    const timeblock = getTimeChainLastBlock(datahashstr);

    const block = getNewBlock(timeblock, lastBlock, chain_id, transactions, txhashes, datahashstr)
    return block;
}

export function getNewBlock(timeblock: timetypes.Block, prevBlock: Block, chain_id: string, transactions: Base64String[], txhashes: Base64String[], datahashstr: Base64String): Block {
    const newindex = prevBlock.header.index + 1
    const header = new Header(
        newindex,
        timeblock.header.time,
        prevBlock.hash,
        chain_id,
        datahashstr,
    )
    const hash = getHeaderHash(header);
    const block = new Block(transactions, header, hash, txhashes)
    return block;
}

export function getHeaderHash(header: Header): Base64String {
    const part1 = Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))
    const part2 = base64.decode(header.lastBlockHash)
    const part3 = base64.decode(header.dataHash)
    const data = new Uint8Array(part1.length + part2.length + part3.length)
    data.set(part1)
    data.set(part2, part1.length)
    data.set(part3, part2.length)

    const hash = sha256.digestWrap(data.buffer)
    return base64.encode(Uint8Array.wrap(hash))
}

export function getEmtpyBlock(): Block {
    const header = new Header(
        1,
        new Date(Date.now()),
        "",
        "",
        "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA==", // zeroed out entropy
    )
    const hash = getHeaderHash(header);
    const block = new Block([], header, hash, [])
    return block;
}

export function initSubChain(encodedData: Base64String, state: CurrentState): typestnd.ResponseInitChain {
    const data = String.UTF8.decode(base64.decode(encodedData).buffer)
    const req = JSON.parse<mctypes.InitSubChainDeterministicRequest>(data);
    LoggerInfo("new subchain", ["subchain_id", req.init_chain_request.chain_id])
    const msg = new mctypes.InitSubChainMsg(
        req.init_chain_request,
        req.chain_config,
        state.validator_address,
        state.validator_privkey,
        state.validator_pubkey,
        req.peers,
    )
    return mcwrap.InitSubChain(msg);
}
