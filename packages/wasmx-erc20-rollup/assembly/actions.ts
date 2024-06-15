import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as wasmxt from "wasmx-env/assembly/types";
import * as crossw from "wasmx-env/assembly/crosschain_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as consensust from "wasmx-consensus/assembly/types_multichain";
import * as erc20s from "wasmx-erc20/assembly/storage";
import * as erc20t from "wasmx-erc20/assembly/types";
import * as base64 from "as-base64/assembly";
import { CallDataInstantiate, CoinPerChain, MODULE_NAME, MsgBalanceOfCrossChain, MsgBalanceOfCrossChainResponse, MsgTotalSupplyCrossChain, MsgTotalSupplyCrossChainResponse, MsgTransferCrossChain, MsgTransferFromCrossChain } from "./types";
import { LoggerDebug, LoggerError, revert } from "./utils";
import { getSubChains, setSubChains } from "./storage";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";

export function instantiateToken(): void {
    const calldraw = wasmx.getCallData();
    const calldrawstr = String.UTF8.decode(calldraw);
    LoggerDebug("instantiate token", ["args", calldrawstr])
    const calld = JSON.parse<CallDataInstantiate>(calldrawstr);
    erc20s.setAdmins(calld.admins)
    let minters = calld.minters
    if (minters.length == 0) {
      minters = [wasmxw.getCaller()]
    }
    erc20s.setMinters(minters);
    erc20s.setInfo(new erc20t.TokenInfo(calld.name, calld.symbol, calld.decimals));
    setSubChains(calld.sub_chain_ids)
}

export function totalSupplyCrossChain(req: MsgTotalSupplyCrossChain): ArrayBuffer {
    return totalSupplyCrossChainInternal(req, true)
}

export function totalSupplyCrossChainNonDeterministic(req: MsgTotalSupplyCrossChain): ArrayBuffer {
    return totalSupplyCrossChainInternal(req, false)
}

export function balanceOfCrossChain(req: MsgBalanceOfCrossChain): ArrayBuffer {
    return balanceCrossChainInternal(req, true)
}

export function balanceOfCrossChainNonDeterministic(req: MsgBalanceOfCrossChain): ArrayBuffer {
    return balanceCrossChainInternal(req, false)
}

export function transferCrossChain(req: MsgTransferCrossChain): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function transferFromCrossChain(req: MsgTransferFromCrossChain): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function totalSupplyCrossChainInternal(req: MsgTotalSupplyCrossChain, deterministic: bool): ArrayBuffer {
    const subchains = getSubChains()
    let totalsupply = erc20s.getTotalSupply()
    const info = erc20s.getInfo()
    const coinsPerChain = new Array<CoinPerChain>(subchains.length + 1)
    const chainId = wasmxw.getChainId()
    coinsPerChain[0] = new CoinPerChain(chainId, totalsupply)

    // create multichain query
    const addr = wasmx.getAddress()
    const addrbech32 = wasmxw.addr_humanize(addr)
    const qreq = new wasmxt.MsgCrossChainCallRequest(
        // we use the same contract address, it will be correctly converted by the multichain registry contract
        addrbech32,
        stringToBase64(`{"data":"${stringToBase64(`{"totalSupply":{}}`)}"}`),
        [],
        [],
        "",
    )

    for (let i = 0; i < subchains.length; i++) {
        const subchainId = subchains[i]

        qreq.to_chain_id = subchainId
        let resp: wasmxt.MsgCrossChainCallResponse
        if (deterministic) {
            resp = crossChainQuery(qreq)
        } else {
            qreq.msg = stringToBase64(`{"data":"${stringToBase64(`{"totalSupplyCrossChainNonDeterministic":{}}`)}"}`),
            resp = crossChainQueryNonDeterministic(qreq)
        }

        if (resp.error != "") {
            continue;
        }
        const data = base64ToString(resp.data)
        // add to totalsupply
        const response = JSON.parse<erc20t.MsgTotalSupplyResponse>(data)
        // @ts-ignore
        totalsupply = totalsupply + response.supply.amount
        coinsPerChain[i + 1] = new CoinPerChain(subchainId, response.supply.amount)
    }

    const response = new MsgTotalSupplyCrossChainResponse(new wasmxt.Coin(info.symbol, totalsupply), coinsPerChain)
    return String.UTF8.encode(JSON.stringify<MsgTotalSupplyCrossChainResponse>(response))
}

export function balanceCrossChainInternal(req: MsgBalanceOfCrossChain, deterministic: bool): ArrayBuffer {
    const subchains = getSubChains()
    let balance = erc20s.getBalance(req.owner)
    const info = erc20s.getInfo()
    const coinsPerChain = new Array<CoinPerChain>(subchains.length + 1)
    const chainId = wasmxw.getChainId()
    coinsPerChain[0] = new CoinPerChain(chainId, balance)

    // create multichain query
    const addr = wasmx.getAddress()
    const addrbech32 = wasmxw.addr_humanize(addr)
    const qreq = new wasmxt.MsgCrossChainCallRequest(
        // we use the same contract address, it will be correctly converted by the multichain registry contract
        addrbech32,
        "",
        [],
        [],
        "",
    )

    for (let i = 0; i < subchains.length; i++) {
        const subchainId = subchains[i]
        // const subchainconfig = getChainConfig(subchainId)

        const newowneraddr = convertAddress(req.owner, subchainId)
        qreq.to_chain_id = subchainId
        let resp: wasmxt.MsgCrossChainCallResponse
        if (deterministic) { // we dont go nested TODO change?
            qreq.msg = stringToBase64(`{"data":"${stringToBase64(`{"balanceOf":{"owner":"${newowneraddr}"}}`)}"}`)
            resp = crossChainQuery(qreq)
        } else {
            qreq.msg = stringToBase64(`{"data":"${stringToBase64(`{"balanceOfCrossChainNonDeterministic":{"owner":"${newowneraddr}"}}`)}"}`)
            resp = crossChainQueryNonDeterministic(qreq)
        }

        if (resp.error != "") {
            continue;
        }
        const data = base64ToString(resp.data)
        // add to balance
        const response = JSON.parse<erc20t.MsgBalanceOfResponse>(data)
        // @ts-ignore
        balance = balance + response.balance.amount
        coinsPerChain[i + 1] = new CoinPerChain(subchainId, response.balance.amount)
    }

    const response = new MsgBalanceOfCrossChainResponse(new wasmxt.Coin(info.symbol, balance), coinsPerChain)
    return String.UTF8.encode(JSON.stringify<MsgBalanceOfCrossChainResponse>(response))
}

export function crossChainTx(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
    const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
    const calldatastr = `{"CrossChainTx":${reqstr}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, false)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        revert(`multichain crosschain tx failed: ${resp.data}`)
    }
    return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}

export function crossChainQuery(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
    const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
    const calldatastr = `{"CrossChainQuery":${reqstr}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        revert(`multichain crosschain query failed: ${resp.data}`)
    }
    return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}

export function crossChainQueryNonDeterministic(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
    const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
    const calldatastr = `{"CrossChainQueryNonDeterministic":${reqstr}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        revert(`multichain crosschain query non deterministic failed: ${resp.data}`)
    }
    return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}

export function getChainConfig(chainId: string): consensust.ChainConfig {
    const calldatastr = `{"GetSubChainConfigById":{"chainId":"${chainId}"}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`multichain call failed`, ["error", resp.data])
    }
    return JSON.parse<consensust.ChainConfig>(resp.data)
}

export function convertAddress(addr: string, chainId: string): string {
    const calldatastr = `{"ConvertAddressByChainId":{"chainId":"${chainId}","prefix":"","address":"${addr}","type":"acc"}}`
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`multichain convert address call failed`, ["error", resp.data])
        return addr;
    }
    return resp.data
}

export function callContract(addr: wasmxt.Bech32String, calldata: string, isQuery: boolean): wasmxt.CallResponse {
    const req = new wasmxt.CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(base64.decode(resp.data).buffer);
    return resp;
}
