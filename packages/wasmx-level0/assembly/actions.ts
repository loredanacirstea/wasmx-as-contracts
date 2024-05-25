import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as roles from "wasmx-env/assembly/roles";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { base64ToHex } from "wasmx-utils/assembly/utils";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import { StartSubChainMsg } from "wasmx-consensus/assembly/types_multichain";
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import { Block, CurrentState } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { commitBlock, proposeBlock } from "./block";
import { setCurrentState, getCurrentState } from "./storage";
import { LOG_START } from "./config";
import { callStorage, isValidatorSimpleActive } from "wasmx-tendermint-p2p/assembly/action_utils";
import { callContract, callStaking } from "wasmx-tendermint/assembly/actions";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { QuerySubChainIdsResponse } from "wasmx-multichain-registry-local/assembly/types";
import { getCurrentNodeId, getTermId, setValidatorNodesInfo } from "wasmx-tendermint-p2p/assembly/storage";
import { NodeInfo } from "wasmx-raft/assembly/types_raft"
import { getCurrentProposer, isPrecommitAcceptThreshold, isPrecommitAnyThreshold } from "./action_utils";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const validators = getAllValidators();
    if (validators.length == 1) {
        const nodes = getValidatorNodesInfo();
        if (nodes.length > validators.length) {
            LoggerInfo("cannot propose block, state is not synced", ["validators", validators.length.toString(), "nodes", nodes.length.toString()])
            return false;
        }
    }
    const proposerIndex = getCurrentProposer();
    const currentNode = getCurrentNodeId();
    return proposerIndex == currentNode;
}

export function ifPrecommitAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return isPrecommitAnyThreshold();
}

export function ifPrecommitAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAcceptThreshold(state.nextHash);
}

export function signMessageExternal(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("message")) {
        revert("no message found");
    }
    const msgstr = ctx.get("message") // stringified message

    const currentState = getCurrentState();
    const msgBase64 = Uint8Array.wrap(String.UTF8.encode(msgstr));
    const privKey = base64.decode(currentState.validator_privkey);
    const signature = wasmx.ed25519Sign(privKey.buffer, msgBase64.buffer);
    const signatureBase64 = base64.encode(Uint8Array.wrap(signature));
    LoggerDebug("ed25519Sign", ["signature", signatureBase64])
    wasmx.setFinishData(signature)
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("initChainSetup")) {
        revert("no initChainSetup found");
    }
    const initChainSetup = ctx.get("initChainSetup") // base64
    const datajson = String.UTF8.decode(base64.decode(initChainSetup).buffer);

    LoggerDebug("setupNode", ["initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);

    const peers = new Array<NodeInfo>(data.peers.length);
    for (let i = 0; i < data.peers.length; i++) {
        const parts1 = data.peers[i].split("@");
        if (parts1.length != 2) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        // <address>@/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWMWpac4Qp74N2SNkcYfbZf2AWHz7cjv69EM5kejbXwBZF
        const addr = parts1[0]
        const parts2 = parts1[1].split("/")
        if (parts2.length != 7) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        const host = parts2[2]
        const port = parts2[4]
        const p2pid = parts2[6]
        peers[i] = new NodeInfo(addr, new p2ptypes.NetworkNode(p2pid, host, port, parts1[1]), false);
    }
    setValidatorNodesInfo(peers);

    initChain(data);
}

export function setup(
    params: ActionParam[],
    event: EventObject,
): void {
    LoggerInfo("setting up new level0 consensus contract", ["error", "not implemented"])
}

export function newBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    // const block = buildNewBlock();
    // setBlock(block);
    // finalizeBlock(block);
    proposeBlock();
    commitBlock();
}

export function StartNode(): void {
    // get chain ids from our local registry
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, `{"GetSubChainIds":{}}`, true)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call failed: could not start subchains`, ["error", resp.data, "contract", roles.ROLE_MULTICHAIN_REGISTRY_LOCAL])
        return;
    }
    const idresp = JSON.parse<QuerySubChainIdsResponse>(resp.data);
    if (idresp.ids.length == 0) return;

    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetSubChainsByIds":${resp.data}}`;
    const resp2 = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true);
    if (resp2.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call failed: could not start subchains`, ["contract", roles.ROLE_MULTICHAIN_REGISTRY, "error", resp2.data])
        return
    }
    const chains = JSON.parse<InitSubChainDeterministicRequest[]>(resp.data);
    LoggerInfo("starting subchains", ["count", chains.length.toString()])
    for (let i = 0; i < chains.length; i++) {
        const chain = chains[i];
        LoggerInfo("starting subchain", ["subchain_id", chain.init_chain_request.chain_id])
        const resp = mcwrap.StartSubChain(new StartSubChainMsg(chain.init_chain_request.chain_id, chain.chain_config))
        if (resp.error.length > 0) {
            LoggerError("could not start subchain", ["subchain_id", chain.init_chain_request.chain_id])
        }
    }
}

function finalizeBlock(block: Block): void {
    const lastCommit = new typestnd.CommitInfo(0, []);
    const processReq = new typestnd.RequestProcessProposal(
        [],
        lastCommit,
        [],
        block.hash,
        block.header.index,
        block.header.time.toISOString(),
        "",
        "",
    )
    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and the transactions
        LoggerError("new block rejected", ["height", processReq.height.toString()])
    }
    const finalizeReq = new typestnd.RequestFinalizeBlock(
        [],
        lastCommit,
        [],
        block.hash,
        block.header.index,
        block.header.time.toISOString(),
        "",
        "",
    )
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
    }
    let respWrap = consensuswrap.FinalizeBlock(finalizeReq);
    if (respWrap.error.length > 0) {
        revert(`consensus break: ${respWrap.error}`);
    }
    const blockData = JSON.stringify<Block>(block)
    const resend = consensuswrap.EndBlock(blockData);
    if (resend.error.length > 0) {
        revert(`${resend.error}`);
    }
    const commitResponse = consensuswrap.Commit();
    LoggerInfo("block finalized", ["height", block.header.index.toString()])
}

export function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    // we need a non-empty string value, because we use this to compute next proposer
    const emptyBlockId = new typestnd.BlockID(base64ToHex(req.app_hash), new typestnd.PartSetHeader(0, ""))
    const last_commit_hash = ""
    const currentState = new CurrentState(
        req.chain_id,
        // req.version,
        req.app_hash,
        emptyBlockId,
        last_commit_hash,
        req.last_results_hash,
        // 0, [],
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        LOG_START + 1, "",
        // 0, 0, 0, 0,
        // [], 0, 0,
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(req.consensus_params);
    LoggerDebug("current state set", [])
}

export function setConsensusParams(value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const calldata = `{"setConsensusParams":{"params":"${base64.encode(Uint8Array.wrap(String.UTF8.encode(valuestr)))}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const currentState = getCurrentState();
    const validators = getAllValidators()
    let validcount = 0;
    for (let i = 0; i < validators.length; i++) {
        if (isValidatorSimpleActive(validators[i])) {
            validcount += 1;
        }
    }
    const proposerIndex = termId % validcount;
    currentState.proposerIndex = proposerIndex;
    setCurrentState(currentState);
    LoggerDebug("new proposer set", ["validator_index", proposerIndex.toString(), "termId", termId.toString()])
}

export function getAllValidators(): staking.ValidatorSimple[] {
    const calldata = `{"GetAllValidatorInfos":{}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebug("GetAllValidatorInfos", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorInfosResponse>(resp.data);
    return result.validators;
}
