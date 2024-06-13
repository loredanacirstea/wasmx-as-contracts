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
import { CallDataInstantiate, CoinPerChain, MODULE_NAME, MsgBalanceOfCrossChain, MsgTotalSupplyCrossChain, MsgTotalSupplyCrossChainResponse, MsgTransferCrossChain, MsgTransferFromCrossChain } from "./types";
import { LoggerDebug, LoggerError } from "./utils";
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
    const subchains = getSubChains()
    let totalsupply = erc20s.getTotalSupply()
    const info = erc20s.getInfo()
    const coinsPerChain = new Array<CoinPerChain>(subchains.length + 1)
    const chainId = wasmxw.getChainId()
    coinsPerChain[0] = new CoinPerChain(chainId, totalsupply)

    // create multichain query
    const addr = wasmx.getAddress()
    const qreq = new wasmxt.QueryCrossChainRequest(
        "",
        stringToBase64(`{"data":"${stringToBase64(`{"totalSupply":{}}`)}"}`),
        [],
        [],
        "",
    )
    const subchainsLeft: string[] = []

    for (let i = 0; i < subchains.length; i++) {
        const subchainId = subchains[i]
        const chainConfig = getChainConfig(subchainId)
        const addrstr = wasmxw.addr_humanize_mc(addr, chainConfig.Bech32PrefixAccAddr)
        qreq.to_address_or_role = addrstr
        qreq.to_chain_id = subchainId
        // TODO URGENT interchain addresses
        qreq.from = qreq.to_address_or_role
        const resp = crossw.executeCrossChainQuery(qreq)
        if (resp.error != "") {
            subchainsLeft.push(subchainId)
            continue;
        }
        const data = base64ToString(resp.data)
        // add to totalsupply
        const response = JSON.parse<erc20t.MsgTotalSupplyResponse>(data)
        // @ts-ignore
        totalsupply = totalsupply + response.supply.amount
        coinsPerChain[i + 1] = new CoinPerChain(subchainId, response.supply.amount)
    }
    // TODO subchainsLeft

    const response = new MsgTotalSupplyCrossChainResponse(new wasmxt.Coin(info.symbol, totalsupply), coinsPerChain)
    return String.UTF8.encode(JSON.stringify<MsgTotalSupplyCrossChainResponse>(response))
}

export function balanceOfCrossChain(req: MsgBalanceOfCrossChain): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function transferCrossChain(req: MsgTransferCrossChain): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function transferFromCrossChain(req: MsgTransferFromCrossChain): ArrayBuffer {
    return new ArrayBuffer(0)
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

export function callContract(addr: wasmxt.Bech32String, calldata: string, isQuery: boolean): wasmxt.CallResponse {
    const req = new wasmxt.CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(base64.decode(resp.data).buffer);
    return resp;
}
