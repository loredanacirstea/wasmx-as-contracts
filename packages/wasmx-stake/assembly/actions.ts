import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as banktypes from "wasmx-bank/assembly/types"
import * as derc20types from "wasmx-derc20/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import { getParamsInternal, setParams, setNewValidator, getParams, getValidator, getValidatorsAddresses, getValidatorAddrByConsAddr, setValidator } from './storage';
import { MsgInitGenesis, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate, MsgUpdateValidators, InitGenesisResponse, UnbondedS, QueryValidatorRequest, QueryValidatorResponse, QueryDelegationRequest, QueryValidatorsResponse, MODULE_NAME, QueryPoolRequest, QueryPoolResponse, Pool, BondedS, AfterValidatorCreated, AfterValidatorBonded } from './types';
import { LoggerDebug, LoggerError, revert } from './utils';
import { parseInt64 } from "wasmx-utils/assembly/utils";
import { Bech32String, CallRequest, CallResponse, Coin } from "wasmx-env/assembly/types";

const POWER_REDUCTION: u32 = 1000000

// TODO this must be in initialization
const DENOM_BASE = "amyt"

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    const genesis = req;
    setParams(genesis.params)
    LoggerDebug(`init genesis`, ["validators", req.validators.length.toString(), "delegations", req.delegations.length.toString()])
    const vupdates: ValidatorUpdate[] = [];
    for (let i = 0; i < genesis.validators.length; i++) {
        const validator = genesis.validators[i];
        setNewValidatorAndCallHook(validator);
        const power = getPower(validator.tokens);
        vupdates.push(new ValidatorUpdate(validator.consensus_pubkey, power))
    }
    for (let i = 0; i < genesis.delegations.length; i++) {
        const delegation = genesis.delegations[i]
        const tokenAddr = getTokenAddress()
        callDelegate(tokenAddr, delegation.delegator_address, delegation.validator_address, delegation.amount)
    }
    // we do this here, instead of ApplyAndReturnValidatorSetUpdates
    // TODO - is this good enough?
    for (let i = 0; i < genesis.validators.length; i++) {
        const validator = genesis.validators[i];
        bondValidatorAndCallHook(validator);
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
        BondedS,
        req.value.amount,
        "0.0",
        req.description,
        0,
        new Date(0),
        new Commission(req.commission, new Date(0)),
        req.min_self_delegation || BigInt.one(),
        0,
        [],
    )

    if (req.min_self_delegation > req.value.amount) {
        revert("delegation lower than min self delegation")
    }

    // check denom
    if (req.value.denom != DENOM_BASE) {
        revert(`cannot create validator with ${req.value.denom}; need ${DENOM_BASE}`)
    }
    setNewValidatorAndCallHook(validator);

    // delegate with token contract
    const tokenAddr = getTokenAddress()
    callDelegate(tokenAddr, req.validator_address, req.validator_address, req.value.amount)

    // we do this here, instead of ApplyAndReturnValidatorSetUpdates
    // TODO - is this good enough?
    bondValidatorAndCallHook(validator);
}

export function EditValidator(): void {
    // TODO
}

export function Delegate (): void {
    // TODO check validator exists
    // call delegated token directly
    // bondValidator
}

export function BeginRedelegate(): void {
    // TODO
}

export function Undelegate(): void {
    // TODO
}

export function CancelUnbondingDelegation(): void {
    // TODO
}

export function UpdateParams(): void {
    // TODO
}

export function ExportGenesis(): void {
    // TODO
}

export function UpdateValidators(req: MsgUpdateValidators): ArrayBuffer {
    // TODO
    console.debug("--staking UpdateValidators--")
    // const updates = req.updates;
    return new ArrayBuffer(0)
}


export function GetAllValidators(): ArrayBuffer {
    const addrs = getValidatorsAddresses()
    const validators = new Array<Validator>(addrs.length)
    for (let i = 0; i < validators.length; i++) {
        const valid = getValidatorWithBalance(addrs[i]);
        if (valid != null) {
            validators[i] = valid;
        }
    }
    let data = JSON.stringify<QueryValidatorsResponse>(new QueryValidatorsResponse(validators))
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}

export function GetValidator(req: QueryValidatorRequest): ArrayBuffer {
    const validator = getValidatorWithBalance(req.validator_addr)
    if (validator == null) {
        revert(`validator not found: ${req.validator_addr}`)
        return new ArrayBuffer(0)
    }
    let data = JSON.stringify<QueryValidatorResponse>(new QueryValidatorResponse(validator))
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}

export function GetDelegation(req: QueryDelegationRequest): ArrayBuffer {
    const tokenAddr = getTokenAddress()
    const data = callGetDelegation(tokenAddr, req.delegator_addr, req.validator_addr)
    return String.UTF8.encode(data)
}

export function GetPool(req: QueryPoolRequest): ArrayBuffer {
    // bonded
    const denom = getParams().bond_denom;
    let calldata = new banktypes.QuerySupplyOfRequest(denom);
    let calldatastr = `{"GetSupplyOf":${JSON.stringify<banktypes.QuerySupplyOfRequest>(calldata)}}`;
    let resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get bonded tokens: ${resp.data}`)
    }
    const bonded = JSON.parse<banktypes.QuerySupplyOfResponse>(resp.data)

    // unbonded
    calldata = new banktypes.QuerySupplyOfRequest(DENOM_BASE);
    calldatastr = `{"GetSupplyOf":${JSON.stringify<banktypes.QuerySupplyOfRequest>(calldata)}}`;
    resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get unbonded tokens: ${resp.data}`)
    }
    const unbonded = JSON.parse<banktypes.QuerySupplyOfResponse>(resp.data)

    const res = new QueryPoolResponse(new Pool(unbonded.amount.amount, bonded.amount.amount))
    return String.UTF8.encode(JSON.stringify<QueryPoolResponse>(res))
}

export function ValidatorByConsAddr(req: QueryValidatorRequest): ArrayBuffer {
    const addr = getValidatorAddrByConsAddr(req.validator_addr)
    if (addr == "") {
        revert(`validator not found: ${req.validator_addr}`)
        return new ArrayBuffer(0)
    }
    const validator = getValidatorWithBalance(addr)
    if (validator == null) {
        revert(`validator not found: ${addr}`)
        return new ArrayBuffer(0)
    }
    let data = JSON.stringify<QueryValidatorResponse>(new QueryValidatorResponse(validator))
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}

export function getValidatorWithBalance(validatorAddr: Bech32String): Validator | null {
    const validator = getValidator(validatorAddr)
    if (validator == null) {
        return null
    }
    const balance = callGetValidatorBalance(validator.operator_address);
    validator.tokens = balance.amount
    return validator;
}

export function callGetValidatorBalance(validator: Bech32String): Coin {
    const tokenAddress = getTokenAddress()
    const calldata = new erc20types.MsgBalanceOf(validator);
    const calldatastr = `{"balanceOfValidator":${JSON.stringify<erc20types.MsgBalanceOf>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`balanceOfValidator not found`)
    }
    const amount = JSON.parse<erc20types.MsgBalanceOfResponse>(resp.data)
    return amount.balance
}

export function callGetDelegation(tokenAddress: Bech32String, delegator: Bech32String, validator: Bech32String): string {
    const calldata = new QueryDelegationRequest(delegator, validator);
    const calldatastr = `{"GetDelegation":${JSON.stringify<QueryDelegationRequest>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`delegation not found`)
    }
    return resp.data
}

export function callDelegate(tokenAddress: Bech32String, delegator: Bech32String, validator: Bech32String, value: BigInt): void {
    const calldata = new derc20types.MsgDelegate(delegator, validator, value);
    const calldatastr = `{"delegate":${JSON.stringify<derc20types.MsgDelegate>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`could not delegate: ${resp.data}`)
    }
}

// TODO this should be through the alias contract
export function getTokenAddress(): Bech32String {
    const denom = getParams().bond_denom;
    const calldata = new banktypes.QueryAddressByDenom(denom);
    const calldatastr = `{"GetAddressByDenom":${JSON.stringify<banktypes.QueryAddressByDenom>(calldata)}}`;
    const resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get staking token address: ${resp.data}`)
    }
    const result = JSON.parse<banktypes.QueryAddressByDenomResponse>(resp.data)
    return result.address
}

export function callBank(calldata: string, isQuery: boolean): CallResponse {
    // TODO denom as alias! when we have alias contract
    const req = new CallRequest("bank", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function getPower(tokens: BigInt): i64 {
    // @ts-ignore
    const v: BigInt = tokens / BigInt.fromU32(POWER_REDUCTION);
    return v.toI64()
}

export function setNewValidatorAndCallHook(value: Validator): void {
    setNewValidator(value)
    runHookContract(AfterValidatorCreated, JSON.stringify<Validator>(value));
}

// perform all the store operations for when a validator status becomes bonded
// unbondingToBonded
// unbondedToBonded - ApplyAndReturnValidatorSetUpdates
export function bondValidatorAndCallHook(value: Validator): void {
    value.status = BondedS
    setValidator(value)
    runHookContract(AfterValidatorBonded, JSON.stringify<Validator>(value));
}

export function runHookContract(hookName: string, data: string): void {
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract("hooks", calldatastr, false)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}
