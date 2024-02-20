import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { isAuthorized } from "wasmx-env/assembly/utils";
import { Bech32String, parseInt64 } from "wasmx-utils/assembly/utils";
import { CallRequest, CallResponse, CreateAccountRequest, Coin } from 'wasmx-env/assembly/types';
import * as erc20 from "wasmx-erc20/assembly/types";
import * as authtypes from "wasmx-auth/assembly/types";
import {
    MsgInitGenesis, MsgSend, MsgMultiSend, MsgSetSendEnabled, MsgUpdateParams, MsgRegisterDenom, Metadata, Balance, CoinMap,
    PageResponse, QueryAllBalancesRequest, QueryAllBalancesResponse, QueryBalanceRequest, QueryBalanceResponse, QueryDenomMetadataByQueryStringRequest, QueryDenomMetadataRequest, QueryDenomOwnersRequest, QueryDenomsMetadataRequest, QueryParamsRequest, QuerySendEnabledRequest, QuerySpendableBalanceByDenomRequest, QuerySpendableBalancesRequest, QuerySupplyOfRequest, QueryTotalSupplyRequest, QueryTotalSupplyResponse,
    QueryAddressByDenom,
    QueryAddressByDenomResponse,
    MODULE_NAME,
    MsgMintCoins
} from './types';
import { LoggerDebug, LoggerInfo, revert } from './utils';
import { getParamsInternal, setParams, getParams, getDenomInfoByAnyDenom, getAuthorities, getBaseDenoms, setBaseDenoms, registerDenomContract, getAddressByDenom, getDenomByAddress } from './storage';
import { BigInt } from "wasmx-env/assembly/bn";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    const genesis = req;
    setParams(genesis.params)
    LoggerInfo(`init genesis`, ["balances_count", req.balances.length.toString(), "denom_info_count", req.denom_info.length.toString()])
    for (let i = 0; i < genesis.denom_info.length; i++) {
        const info = genesis.denom_info[i]
        LoggerDebug(`init denom`, ["base_denom", info.metadata.base, "code_id", info.code_id.toString(), "contract", info.contract])
        // we do not give supply, because we mint below
        if (info.contract == "") {
            info.contract = deployDenom(info.code_id, info.metadata, info.admins, info.minters)
            LoggerInfo(`deployed denom`, ["address", info.contract, "denom", info.metadata.base, "code_id", info.code_id.toString()])
        }
        registerDenomContract(info.contract, info.metadata.base, info.metadata.denom_units)
    }
    for (let i = 0; i < genesis.balances.length; i++) {
        mint(genesis.balances[i]);
    }
    // TODO do a check that supply == minted amounts; now we just discard supply
    // TODO send_enabled - should be set on each token contract
    return new ArrayBuffer(0)
}

// TODO
export function RegisterDenom(msg: MsgRegisterDenom): ArrayBuffer {
    // check denom contract has bank as owner?
    // check auth
    return new ArrayBuffer(0)
}

export function MintCoins(req: MsgMintCoins): ArrayBuffer {
    LoggerDebug(`mint coins`, ["address", req.address, "coins", JSON.stringify<Coin[]>(req.coins)])
    mint(new Balance(req.address, req.coins))
    return new ArrayBuffer(0)
}

export function Send(req: MsgSend): ArrayBuffer {
    requireOwnerOrAuthorization(req.from_address, "SendCoins")
    LoggerDebug(`send coins`, ["from_address", req.from_address, "to_address", req.to_address, "amount", JSON.stringify<Coin[]>(req.amount)])
    sendCoins(req.from_address, req.to_address, req.amount)
    return new ArrayBuffer(0)
}

export function SendCoinsFromModuleToAccount(req: MsgSend): ArrayBuffer {
    LoggerDebug(`send coins from module to account`, ["from_address", req.from_address, "to_address", req.to_address])
    req.from_address = wasmxw.getAddressByRole(req.from_address)
    return Send(req);
}

export function SendCoinsFromModuleToModule(req: MsgSend): ArrayBuffer {
    LoggerDebug(`send coins from module to module`, ["from_address", req.from_address, "to_address", req.to_address])
    req.from_address = wasmxw.getAddressByRole(req.from_address)
    req.to_address = wasmxw.getAddressByRole(req.to_address)
    return Send(req);
}

export function SendCoinsFromAccountToModule(req: MsgSend): ArrayBuffer {
    LoggerDebug(`send coins from account to module`, ["from_address", req.from_address, "to_address", req.to_address])
    req.to_address = wasmxw.getAddressByRole(req.to_address)
    return Send(req);
}

// one to many transfer of coins
export function MultiSend(req: MsgMultiSend): ArrayBuffer {
    if (req.inputs.length != 1) {
        revert("multisend must have 1 input");
    }
    LoggerDebug(`multisend`, ["from_address", req.inputs[0].address, "outputs", req.outputs.length.toString()])
    const input = req.inputs[0];
    const coinMap = new Map<string,BigInt>()
    for (let i = 0; i < req.outputs.length; i++) {
        const output = req.outputs[i]
        const coinMap_ = sendCoins(input.address, output.address, output.coins)
        const keys = coinMap_.keys()
        for (let j = 0; j < keys.length; j++) {
            if (!coinMap.has(keys[j])) {
                coinMap.set(keys[j], BigInt.zero())
            }
            // @ts-ignore
            const value = coinMap.get(keys[j]) + coinMap_.get(keys[j])
            coinMap.set(keys[j], value)
        }
    }
    // check that inputs are == sum of outputs
    for (let i = 0; i < input.coins.length; i++) {
        const coin = input.coins[i];
        if (!coinMap.has(coin.denom)) {
            revert(`multisend input contains too many coins: ${coin.denom}`)
        }
        if (coinMap.get(coin.denom) != coin.amount) {
            revert(`multisend input coin amount mismatch for ${coin.denom}: expected ${coin.amount}, got ${coinMap.get(coin.denom)}`)
        }
    }
    // or just remove input coins
    return new ArrayBuffer(0)
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    const auth = getAuthorities();
    if (!auth.includes(req.authority)) {
        revert(`unautorized: expected ${auth.join(",")}, got ${req.authority}`)
    }
    LoggerDebug(`update params`, ["authority", req.authority])
    setParams(req.params)
    return new ArrayBuffer(0)
}

// TODO
export function SetSendEnabled(req: MsgSetSendEnabled): ArrayBuffer {
    return new ArrayBuffer(0)
}


export function GetBalance(req: QueryBalanceRequest): ArrayBuffer {
    const balance = balanceInternal(req.address, req.denom)
    const response = new QueryBalanceResponse(balance)
    return String.UTF8.encode(JSON.stringify<QueryBalanceResponse>(response))
}

export function AllBalances(req: QueryAllBalancesRequest): ArrayBuffer {
    const denoms = getBaseDenoms()
    const balances = new Array<Coin>(0)
    for (let i = 0; i < denoms.length; i++) {
        const balance = balanceInternal(req.address, denoms[i])
        if (balance.amount > BigInt.zero()) {
            balances.push(balance);
        }
    }
    const response = new QueryAllBalancesResponse(balances, new PageResponse(balances.length))
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
        if (value.amount > BigInt.zero()) {
            supply.push(value);
        }
    }
    const response = new QueryTotalSupplyResponse(supply, new PageResponse(supply.length))
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

export function GetAddressByDenom(req: QueryAddressByDenom): ArrayBuffer {
    const addr = getAddressByDenom(req.denom)
    return String.UTF8.encode(JSON.stringify<QueryAddressByDenomResponse>(new QueryAddressByDenomResponse(addr)))
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
        return new Coin(denom, BigInt.zero())
    }
    const data = JSON.parse<erc20.MsgBalanceOfResponse>(resp.data)
    return data.balance
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
        return new Coin(denom, BigInt.zero())
    }
    const data = JSON.parse<erc20.MsgTotalSupplyResponse>(resp.data)
    return data.supply
}

export function deployDenom(codeId: u64, metadata: Metadata, admins: string[], minters: string[]): Bech32String {
    const denoms = getBaseDenoms()
    denoms.push(metadata.base);
    setBaseDenoms(denoms)
    // deploy denom contract
    const name = metadata.name || metadata.display
    const symbol = metadata.base // TODO metadata.symbol
    let decimals = u32(0)
    for (let i = 0; i < metadata.denom_units.length; i++) {
        const unit = metadata.denom_units[i]
        if (decimals < unit.exponent) {
            decimals = unit.exponent;
        }
    }
    const msg = JSON.stringify<erc20.CallDataInstantiate>(new erc20.CallDataInstantiate(admins, minters, name, symbol, decimals))
    const label = "Bank_" + metadata.base
    const addr = wasmxw.createAccount(new CreateAccountRequest(codeId, msg, [], label), MODULE_NAME)
    return addr
}

export function mint(balance: Balance): ArrayBuffer {
    for (let i = 0; i < balance.coins.length; i++) {
        const coin = balance.coins[i]
        const denomInfo = getDenomInfoByAnyDenom(coin.denom)
        if (denomInfo.contract == "") {
            revert(`denom ${coin.denom} does not have registered metadata`);
        }
        // @ts-ignore
        const amount: BigInt = denomInfo.value * coin.amount
        const calldata = new erc20.MsgMint(balance.address, amount);
        const calldatastr = `{"mint":${JSON.stringify<erc20.MsgMint>(calldata)}}`;
        const resp = callToken(denomInfo.contract, calldatastr, false)
        if (resp.success > 0) {
            revert(`could not mint ${denomInfo.denom}; err: ${resp.data}`)
        }
    }
    return new ArrayBuffer(0)
}

export function sendCoins(from: Bech32String, to: Bech32String, coins: Coin[]): CoinMap {
    const coinMap = new Map<string,BigInt>();
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i]
        const denomInfo = getDenomInfoByAnyDenom(coin.denom)
        if (denomInfo.contract == "") {
            revert(`denom ${coin.denom} does not have registered metadata`);
        }
        // @ts-ignore
        const amount: BigInt = denomInfo.value * coin.amount
        if (!coinMap.has(denomInfo.denom)) {
            coinMap.set(denomInfo.denom, BigInt.zero())
        }
        // @ts-ignore
        const value = coinMap.get(denomInfo.denom) + amount
        coinMap.set(denomInfo.denom, value);
        const calldata = new erc20.MsgTransferFrom(from, to, amount);
        const calldatastr = `{"transferFrom":${JSON.stringify<erc20.MsgTransferFrom>(calldata)}}`;
        const resp = callToken(denomInfo.contract, calldatastr, false)
        if (resp.success > 0) {
            revert(`could not transferFrom ${denomInfo.denom}; err: ${resp.data}`)
        }
    }

    // Create account if recipient does not exist.
    let calldata = new authtypes.QueryAccountRequest(to);
    let calldatastr = `{"HasAccount":${JSON.stringify<authtypes.QueryAccountRequest>(calldata)}}`;
    let resp = callAuth(calldatastr, true);
    if (resp.success > 0) {
        revert(`auth.HasAccount call failed`)
    }
    const r = JSON.parse<authtypes.QueryHasAccountResponse>(resp.data)
    if(!r.found) {
        const calldata = new authtypes.MsgSetAccount(authtypes.AnyAccount.New(to));
        const calldatastr = `{"SetAccount":${JSON.stringify<authtypes.MsgSetAccount>(calldata)}}`;
        LoggerDebug("creating recipient account", ["address", to])
        let resp = callAuth(calldatastr, false);
        if (resp.success > 0) {
            revert(`auth.SetAccount call failed`)
        }
    }
    return coinMap
}

export function callAuth(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(authtypes.MODULE_NAME, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callToken(address: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    // TODO denom as alias! when we have alias contract
    const req = new CallRequest(address, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function checkOwnerOrAuthorization(owner: Bech32String): boolean {
    // caller is always an address
    const caller = wasmxw.getCaller()
    if (caller == owner) return true;
    if(isFromDenomContract(caller)) return true
    if(isAuthorized(caller, getAuthorities())) return true;
    return false;
}

export function requireOwnerOrAuthorization(owner: Bech32String, msg: string): void {
    if (!checkOwnerOrAuthorization(owner)) {
        revert(`unauthorized bank action: ${owner}: ${msg}`)
    }
}

export function isFromDenomContract(caller: Bech32String): boolean {
    const denom = getDenomByAddress(caller)
    if (denom != "") return true
    return false
}
