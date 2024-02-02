import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import * as banktypes from "wasmx-bank/assembly/types"
import * as derc20types from "wasmx-derc20/assembly/types"
import { getParamsInternal, setParams, setNewValidator, getParams } from './storage';
import { MsgInitGenesis, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate, MsgUpdateValidators, InitGenesisResponse, UnbondedS } from './types';
import { revert } from './utils';
import { parseInt64 } from "wasmx-utils/assembly/utils";
import { Bech32String, CallRequest, CallResponse } from "wasmx-env/assembly/types";

const POWER_REDUCTION = 1000000

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    const genesis = req;
    setParams(genesis.params)
    const vupdates: ValidatorUpdate[] = [];
    for (let i = 0; i < genesis.validators.length; i++) {
        const validator = genesis.validators[i];
        setNewValidator(validator);
        const tokens = parseInt64(validator.tokens)
        const power = tokens / POWER_REDUCTION;
        vupdates.push(new ValidatorUpdate(validator.consensus_pubkey, power))
    }
    let data = JSON.stringify<InitGenesisResponse>(new InitGenesisResponse(vupdates))
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}

export function CreateValidator(req: MsgCreateValidator): void {
    const validator = new Validator(
        req.validator_address,
        req.pubkey, // TODO codec any?
        false,
        UnbondedS,
        req.value.amount.toString(),
        "0.0",
        req.description,
        0,
        new Date(0),
        new Commission(req.commission, new Date(0)),
        req.min_self_delegation || "1",
        0,
        [],
    )

    if (parseInt64(req.min_self_delegation) > req.value.amount) {
        revert("delegation lower than min self delegation")
    }

    // check denom
    const params = getParams();
    if (params.bond_denom != req.value.denom) {
        revert(`cannot create validator with ${req.value.denom}; need ${params.bond_denom}`)
    }
    setNewValidator(validator);

    // delegate with token contract
    const tokenAddr = getTokenAddress()
    callDelegate(tokenAddr, req.validator_address, req.validator_address, req.value.amount)
}

export function EditValidator(): void {

}

export function Delegate (): void {
    // check validator exists
    // call delegated token directly
}

export function BeginRedelegate(): void {

}

export function Undelegate(): void {

}

export function CancelUnbondingDelegation(): void {

}

export function UpdateParams(): void {

}

export function ExportGenesis(): void {

}

export function UpdateValidators(req: MsgUpdateValidators): ArrayBuffer {
    // TODO
    console.debug("--staking UpdateValidators--")
    // const updates = req.updates;
    return new ArrayBuffer(0)
}

export function callDelegate(tokenAddress: Bech32String, delegator: Bech32String, validator: Bech32String, value: i64): void {
    const calldata = new derc20types.MsgDelegate(delegator, validator, value);
    const calldatastr = `{"delegate":${JSON.stringify<derc20types.MsgDelegate>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert("could not delegate")
    }
}

export function getTokenAddress(): Bech32String {
    const denom = getParams().bond_denom;
    const calldata = new banktypes.QueryAddressByDenom(denom);
    const calldatastr = `{"GetAddressByDenom":${JSON.stringify<banktypes.QueryAddressByDenom>(calldata)}}`;
    const resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert("could not get staking token address")
    }
    const result = JSON.parse<banktypes.QueryAddressByDenomResponse>(resp.data)
    return result.address
}

export function callBank(calldata: string, isQuery: boolean): CallResponse {
    // TODO denom as alias! when we have alias contract
    const req = new CallRequest("bank", calldata, 0, 100000000, isQuery);
    const resp = wasmxw.call(req);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, 0, 100000000, isQuery);
    const resp = wasmxw.call(req);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
