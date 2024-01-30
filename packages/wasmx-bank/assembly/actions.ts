import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Bech32String, parseInt64 } from "wasmx-utils/assembly/utils";
import { CallRequest, CallResponse, CreateAccountRequest } from 'wasmx-env/assembly/types';
import * as erc20 from "wasmx-erc20/assembly/types";
import { MsgInitGenesis, MsgSend, MsgMultiSend, MsgSetSendEnabled, MsgUpdateParams, MsgRegisterDenom, Coin, Metadata, Balance, CoinMap } from './types';
import { revert } from './utils';
import { getParamsInternal, setParams, getParams, getDenomInfoByAnyDenom, getAuthorities, getBaseDenoms, setBaseDenoms } from './storage';

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    const genesis = req.genesis;
    const codeIds = req.code_ids;
    setParams(genesis.params)
    if (genesis.supply.length != genesis.denom_metadata.length) {
        revert("supply count must be equal to metadata count")
    }
    if (genesis.supply.length != codeIds.length) {
        revert("supply count must be equal to code ids count")
    }
    for (let i = 0; i < genesis.denom_metadata.length; i++) {
        // we do not give supply, because we mint below
        deployDenom(codeIds[i], genesis.denom_metadata[i])
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
    return new ArrayBuffer(0)
}

export function Send(req: MsgSend): ArrayBuffer {
    sendCoins(req.from_address, req.to_address, req.amount)
    return new ArrayBuffer(0)
}

// one to many transfer of coins
export function MultiSend(req: MsgMultiSend): ArrayBuffer {
    if (req.inputs.length != 1) {
        revert("multisend must have 1 input");
    }
    const input = req.inputs[0];
    const coinMap = new Map<string,i64>()
    for (let i = 0; i < req.outputs.length; i++) {
        const output = req.outputs[i]
        const coinMap_ = sendCoins(input.address, output.address, output.coins)
        const keys = coinMap_.keys()
        for (let j = 0; j < keys.length; j++) {
            if (!coinMap.has(keys[j])) {
                coinMap.set(keys[j], 0)
            }
            coinMap.set(keys[j], coinMap.get(keys[j]) + coinMap_.get(keys[j]))
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
    setParams(req.params)
    return new ArrayBuffer(0)
}

// TODO
export function SetSendEnabled(req: MsgSetSendEnabled): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function deployDenom(codeId: u64, metadata: Metadata): Bech32String {
    const denoms = getBaseDenoms()
    denoms.push(metadata.base);
    setBaseDenoms(denoms)
    // deploy denom contract
    const name = metadata.name || metadata.display
    const symbol = metadata.symbol
    const admin = "bank"
    const minter = "bank"
    let decimals = u32(0)
    for (let i = 0; i < metadata.denom_units.length; i++) {
        const unit = metadata.denom_units[i]
        if (decimals < unit.exponent) {
            decimals = unit.exponent;
        }
    }
    const msg = JSON.stringify<erc20.CallDataInstantiate>(new erc20.CallDataInstantiate(admin, minter, name, symbol, decimals))
    const label = "Bank_" + metadata.base
    const addr = wasmxw.createAccount(new CreateAccountRequest(codeId, msg, [], label))
    return addr
}

export function mint(balance: Balance): ArrayBuffer {
    for (let i = 0; i < balance.coins.length; i++) {
        const coin = balance.coins[i]
        const denomInfo = getDenomInfoByAnyDenom(coin.denom)
        if (denomInfo.contract == "") {
            revert(`denom ${coin.denom} does not have registered metadata`);
        }
        const amount = denomInfo.value * coin.amount
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
    const coinMap = new Map<string,i64>();
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i]
        const denomInfo = getDenomInfoByAnyDenom(coin.denom)
        if (denomInfo.contract == "") {
            revert(`denom ${coin.denom} does not have registered metadata`);
        }
        const amount = denomInfo.value * coin.amount
        if (!coinMap.has(denomInfo.denom)) {
            coinMap.set(denomInfo.denom, 0)
        }
        coinMap.set(denomInfo.denom, coinMap.get(denomInfo.denom) + amount);
        const calldata = new erc20.MsgTransferFrom(from, to, amount);
        const calldatastr = `{"transferFrom":${JSON.stringify<erc20.MsgTransferFrom>(calldata)}}`;
        const resp = callToken(denomInfo.contract, calldatastr, false)
        if (resp.success > 0) {
            revert(`could not transferFrom ${denomInfo.denom}; err: ${resp.data}`)
        }
    }
    return coinMap
}

export function callToken(address: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    // TODO denom as alias! when we have alias contract
    const req = new CallRequest(address, calldata, 0, 100000000, isQuery);
    const resp = wasmxw.call(req);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
