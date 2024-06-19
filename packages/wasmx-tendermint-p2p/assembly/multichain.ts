import { JSON } from "json-as/assembly";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import * as roles from "wasmx-env/assembly/roles";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxt from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as stakingtypes from "wasmx-stake/assembly/types";
import { ActionParam, EventObject } from "xstate-fsm-as/assembly/types";
import { actionParamsToMap, getParamsOrEventParams } from "xstate-fsm-as/assembly/utils";
import { revert } from "./utils";
import { getValidatorNodesInfo } from "./storage";
import { ChainConfig } from "wasmx-consensus/assembly/types_multichain";
import { callContract } from "wasmx-tendermint/assembly/actions";
import { BaseAccount, QueryAccountResponse } from "wasmx-auth/assembly/types";
import { NodeInfo } from "wasmx-raft/assembly/types_raft";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { QuerySubChainIdsResponse } from "wasmx-multichain-registry-local/assembly/types";
import { LoggerError, LoggerInfo } from "./utils";
import { InitSubChainDeterministicRequest, StartSubChainMsg } from "wasmx-consensus/assembly/types_multichain";
import { QueryBuildGenTxRequest } from "./types";
import { getSelfNodeInfo } from "./action_utils";


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

export function buildGenTx(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("message")) {
        revert("no message found");
    }
    const msgstr = ctx.get("message") // stringified message
    const req = JSON.parse<QueryBuildGenTxRequest>(msgstr);

    const chainConfig = getSubChainConfig(req.chainId)
    if (chainConfig == null) {
        revert(`subchain config is null: ${req.chainId}`)
        return;
    }
    const nodeInfo = getSelfNodeInfo()
    const genTx = createGenTx(nodeInfo, chainConfig.Bech32PrefixAccAddr, chainConfig.BondBaseDenom, req.msg)
    if (genTx == null) {
        revert(`genTx is null`)
        return;
    }
    const resp = String.UTF8.encode(JSON.stringify<wasmxt.SignedTransaction>(genTx))
    wasmx.setFinishData(resp)
}

export function createGenTx(
    node: NodeInfo,
    accprefix: string,
    bondBaseDenom: string,
    input: stakingtypes.MsgCreateValidator,
): wasmxt.SignedTransaction | null {
    const accresp = getAccountInfo(node.address)
    const acc = accresp.account
    if (!acc) {
        revert(`account not found: ${node.address}`)
        return null
    }
    const baseacc = JSON.parse<BaseAccount>(base64ToString(acc.value))

    const val = getValidator(node.address)
    if (!val) {
        revert(`validator not found: ${node.address}`)
        return null
    }
    const addrbz = wasmxw.addr_canonicalize(node.address)
    const validatorOperator = wasmxw.addr_humanize_mc(addrbz, accprefix)

    const valmsg = new stakingtypes.MsgCreateValidator(
        input.description,
        input.commission,
        input.min_self_delegation,
        validatorOperator,
        val.consensus_pubkey,
        new wasmxt.Coin(bondBaseDenom, input.value.amount),
    )
    const valmsgstr = JSON.stringify<stakingtypes.MsgCreateValidator>(valmsg)
    const txmsg = new wasmxt.TxMessage(stakingtypes.TypeUrl_MsgCreateValidator, stringToBase64(valmsgstr))

    const memo = `${validatorOperator}@/ip4/${node.node.host}/tcp/${node.node.port}/p2p/${node.node.id}`

    const txbody = new wasmxt.TxBody([txmsg], memo, 0, [], [])

    const authinfo = new wasmxt.AuthInfo(
        [new wasmxt.SignerInfo(baseacc.pub_key, new wasmxt.ModeInfo(new wasmxt.ModeInfoSingle(wasmxt.SIGN_MODE_DIRECT), null), 0)],
        new wasmxt.Fee([], 5000000, "", ""),
        null,
    )
    return new wasmxt.SignedTransaction(txbody, authinfo, [])
}

export function getSubChainConfig(chainId: string): ChainConfig | null {
    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetSubChainConfigById":{"chainId":"${chainId}"}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true);
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        return null
    }
    if (resp.data == "") return null;
    return JSON.parse<ChainConfig>(resp.data);
}

export function getAccountInfo(addr: wasmxt.Bech32String): QueryAccountResponse {
    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetAccount":{"address":"${addr}"}}`;
    const resp = callContract(roles.ROLE_AUTH, calldatastr, true);
    if (resp.success > 0) {
        return new QueryAccountResponse(null);
    }
    return JSON.parse<QueryAccountResponse>(resp.data);
}

export function getValidator(addr: wasmxt.Bech32String): stakingtypes.Validator | null {
    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetValidator":{"validator_addr":"${addr}"}}`;
    const resp = callContract(roles.ROLE_STAKING, calldatastr, true);
    if (resp.success > 0) {
        return null
    }
    const valresp = JSON.parse<stakingtypes.QueryValidatorResponse>(resp.data);
    return valresp.validator
}
