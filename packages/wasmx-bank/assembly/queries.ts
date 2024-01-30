import { JSON } from "json-as/assembly";
import * as erc20 from "wasmx-erc20/assembly/types";
import { Coin, MsgInitGenesis, PageResponse, QueryAllBalancesRequest, QueryAllBalancesResponse, QueryBalanceRequest, QueryBalanceResponse, QueryDenomMetadataByQueryStringRequest, QueryDenomMetadataRequest, QueryDenomOwnersRequest, QueryDenomsMetadataRequest, QueryParamsRequest, QuerySendEnabledRequest, QuerySpendableBalanceByDenomRequest, QuerySpendableBalancesRequest, QuerySupplyOfRequest, QueryTotalSupplyRequest, QueryTotalSupplyResponse } from './types';
import { revert } from './utils';
import { getBaseDenoms, getDenomInfoByAnyDenom } from "./storage";
import { callToken } from "./actions";
import { Bech32String } from "wasmx-env/assembly/types";

export function Balance(req: QueryBalanceRequest): ArrayBuffer {
    const balance = balanceInternal(req.address, req.denom)
    const response = new QueryBalanceResponse(balance)
    return String.UTF8.encode(JSON.stringify<QueryBalanceResponse>(response))
}

export function AllBalances(req: QueryAllBalancesRequest): ArrayBuffer {
    const denoms = getBaseDenoms()
    const balances = new Array<Coin>(0)
    for (let i = 0; i < denoms.length; i++) {
        const balance = balanceInternal(req.address, denoms[i])
        if (balance.amount > 0) {
            balances.push(balance);
        }
    }
    const response = new QueryAllBalancesResponse(balances, new PageResponse(0, balances.length))
    return String.UTF8.encode(JSON.stringify<QueryAllBalancesResponse>(response))
}

export function SpendableBalances(req: QuerySpendableBalancesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function SpendableBalanceByDenom(req: QuerySpendableBalanceByDenomRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function TotalSupply(req: QueryTotalSupplyRequest): ArrayBuffer {
    const denoms = getBaseDenoms()
    const supply = new Array<Coin>(0)
    for (let i = 0; i < denoms.length; i++) {
        const value = totalSupplyInternal(denoms[i])
        if (value.amount > 0) {
            supply.push(value);
        }
    }
    const response = new QueryTotalSupplyResponse(supply, new PageResponse(0, supply.length))
    return String.UTF8.encode(JSON.stringify<QueryTotalSupplyResponse>(response))
}

export function SupplyOf(req: QuerySupplyOfRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Params(req: QueryParamsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DenomMetadata(req: QueryDenomMetadataRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DenomsMetadata(req: QueryDenomsMetadataRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DenomMetadataByQueryString(req: QueryDenomMetadataByQueryStringRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DenomOwners(req: QueryDenomOwnersRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function SendEnabled(req: QuerySendEnabledRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function balanceInternal(address: Bech32String, denom: string): Coin {
    const denomInfo = getDenomInfoByAnyDenom(denom);
    if (denomInfo.contract == "") {
        revert(`denom ${denom} does not have registered metadata`);
    }
    const calldata = new erc20.MsgBalanceOf(address);
    const calldatastr = `{"balanceOf":${JSON.stringify<erc20.MsgBalanceOf>(calldata)}}`;
    const resp = callToken(denomInfo.contract, calldatastr, true)
    if (resp.success > 0) {
        // TODO? this may be used in other functions
        // revert(`could not get balanceOf ${denomInfo.denom}; err: ${resp.data}`)
        return new Coin(denom, 0)
    }
    const data = JSON.parse<erc20.MsgBalanceOfResponse>(resp.data)
    return new Coin(denomInfo.denom, data.balance)
}

export function totalSupplyInternal(denom: string): Coin {
    const denomInfo = getDenomInfoByAnyDenom(denom);
    if (denomInfo.contract == "") {
        revert(`denom ${denom} does not have registered metadata`);
    }
    const calldata = new erc20.MsgTotalSupply();
    const calldatastr = `{"totalSupply":${JSON.stringify<erc20.MsgTotalSupply>(calldata)}}`;
    const resp = callToken(denomInfo.contract, calldatastr, true)
    if (resp.success > 0) {
        // TODO? this may be used in other functions
        // revert(`could not get balanceOf ${denomInfo.denom}; err: ${resp.data}`)
        return new Coin(denom, 0)
    }
    const data = JSON.parse<erc20.MsgTotalSupplyResponse>(resp.data)
    return new Coin(denomInfo.denom, data.totalSupply)
}
