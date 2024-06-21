import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as banktypes from "wasmx-bank/assembly/types"
import * as derc20types from "wasmx-derc20/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import { getParamsInternal, setParams, setNewValidator, getParams, getValidator, getValidatorsAddresses, getValidatorAddrByConsAddr, setValidator, getValidatorOperatorByHexAddr, setBaseDenom, getBaseDenom } from './storage';
import { GenesisState, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate, MsgUpdateValidators, InitGenesisResponse, UnbondedS, QueryValidatorRequest, QueryValidatorResponse, QueryDelegationRequest, QueryValidatorsResponse, MODULE_NAME, QueryPoolRequest, QueryPoolResponse, Pool, BondedS, AfterValidatorCreated, AfterValidatorBonded, QueryValidatorDelegationsRequest, QueryValidatorDelegationsResponse, QueryDelegatorValidatorsRequest, QueryDelegatorValidatorsResponse, QueryParamsRequest, QueryParamsResponse, ValidatorSimple, QueryValidatorInfosResponse, getValidatorFromMsgCreate, Description } from './types';
import { LoggerDebug, LoggerError, revert } from './utils';
import { parseInt64 } from "wasmx-utils/assembly/utils";
import { Bech32String, CallRequest, CallResponse, Coin, PageRequest, PageResponse, ValidatorAddressString } from "wasmx-env/assembly/types";

export const POWER_REDUCTION: u32 = 1000000

export function InitGenesis(req: GenesisState): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    const genesis = req;
    setParams(genesis.params)
    setBaseDenom(genesis.base_denom);
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
    return String.UTF8.encode(data)
}

export function CreateValidator(req: MsgCreateValidator): void {
    const baseDenom = getBaseDenom()
    const validator = getValidatorFromMsgCreate(req)

    if (req.min_self_delegation > req.value.amount) {
        revert("delegation lower than min self delegation")
    }

    // check denom
    if (req.value.denom != baseDenom) {
        revert(`cannot create validator with ${req.value.denom}; need ${baseDenom}`)
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

// does not recalculate token balances!
export function GetAllValidatorInfos(): ArrayBuffer {
    const addrs = getValidatorsAddresses()
    const validators = new Array<ValidatorSimple>(addrs.length)
    for (let i = 0; i < validators.length; i++) {
        const valid = getValidator(addrs[i]);
        if (valid != null) {
            validators[i] = ValidatorSimple.fromValidator(valid);
        } else {
            validators[i] = new ValidatorSimple("", null, false, UnbondedS, new Description("", "", "", "", ""), 0, new Date(0), new Commission(new CommissionRates("0", "0", "0"), new Date(0)), BigInt.zero(), 0, [])
        }
    }
    let data = JSON.stringify<QueryValidatorInfosResponse>(new QueryValidatorInfosResponse(validators, new PageResponse(validators.length)))
    return String.UTF8.encode(data)
}

// recalculates token balances!
export function GetAllValidators(): ArrayBuffer {
    const addrs = getValidatorsAddresses()
    const validators = new Array<Validator>(addrs.length)
    for (let i = 0; i < validators.length; i++) {
        const valid = getValidatorWithBalance(addrs[i]);
        if (valid != null) {
            validators[i] = valid;
        } else {
            validators[i] = new Validator("", null, false, UnbondedS, BigInt.zero(), "0", new Description("", "", "", "", ""), 0, new Date(0), new Commission(new CommissionRates("0", "0", "0"), new Date(0)), BigInt.zero(), 0, [])
        }
    }
    let data = JSON.stringify<QueryValidatorsResponse>(new QueryValidatorsResponse(validators, new PageResponse(validators.length)))
    return String.UTF8.encode(data)
}

export function GetValidator(req: QueryValidatorRequest): ArrayBuffer {
    const validator = getValidatorWithBalance(req.validator_addr)
    if (validator == null) {
        revert(`validator not found: ${req.validator_addr}`)
        return new ArrayBuffer(0)
    }
    let data = JSON.stringify<QueryValidatorResponse>(new QueryValidatorResponse(validator))
    return String.UTF8.encode(data)
}

export function GetDelegation(req: QueryDelegationRequest): ArrayBuffer {
    const tokenAddr = getTokenAddress()
    const data = callGetDelegation(tokenAddr, req.delegator_addr, req.validator_addr)
    return String.UTF8.encode(data)
}

export function GetValidatorDelegations(req: QueryValidatorDelegationsRequest): ArrayBuffer {
    const tokenAddr = getTokenAddress()
    const data = callGetValidatorDelegations(tokenAddr, req)
    return String.UTF8.encode(data)
}

export function GetDelegatorValidators(req: QueryDelegatorValidatorsRequest): ArrayBuffer {
    const tokenAddr = getTokenAddress()
    const validatorAddresses = callGetDelegatorValidators(tokenAddr, req)
    const validators = new Array<Validator>(validatorAddresses.length)
    for (let i = 0; i < validatorAddresses.length; i++) {
        const addr = getValidatorAddrByConsAddr(validatorAddresses[i])
        const valid = getValidator(addr);
        if (valid != null) {
            validators[i] = valid;
        }
    }
    return String.UTF8.encode(JSON.stringify<QueryDelegatorValidatorsResponse>(new QueryDelegatorValidatorsResponse(validators, new PageResponse(validators.length))))
}

export function GetDelegatorValidatorAddresses(req: QueryDelegatorValidatorsRequest): ArrayBuffer {
    const tokenAddr = getTokenAddress()
    const validatorAddresses = callGetDelegatorValidators(tokenAddr, req)
    const validators = new Array<Bech32String>(validatorAddresses.length)
    for (let i = 0; i < validatorAddresses.length; i++) {
        const addr = getValidatorAddrByConsAddr(validatorAddresses[i])
        validators[i] = addr
    }
    return String.UTF8.encode(JSON.stringify<derc20types.DelegatorValidatorsResponse>(new derc20types.DelegatorValidatorsResponse(validators, new PageResponse(validators.length))))
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(new QueryParamsResponse(getParams())))
}

export function GetPool(req: QueryPoolRequest): ArrayBuffer {
    // bonded
    const baseDenom = getBaseDenom()
    const denom = getParams().bond_denom;
    const bonded = GetBankSupply(denom);
    const unbonded = GetBankSupply(baseDenom);
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
    return String.UTF8.encode(data)
}

export function ValidatorByHexAddr(req: QueryValidatorRequest): ArrayBuffer {
    const addr = getValidatorOperatorByHexAddr(req.validator_addr)
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
    return String.UTF8.encode(data)
}

// TODO do not use .tokens
// tokens define the delegated tokens (incl. self-delegation)
// but everything should be taken from the derc20
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
    LoggerDebug("validator balance", ["response", resp.data])
    const amount = JSON.parse<erc20types.MsgBalanceOfResponse>(resp.data)
    return amount.balance
}

export function callGetValidatorDelegations(tokenAddress: Bech32String, req: QueryValidatorDelegationsRequest): string {
    const calldatastr = `{"GetValidatorDelegations":${JSON.stringify<QueryValidatorDelegationsRequest>(req)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`validator delegations not found for ${req.validator_addr}`)
    }
    return resp.data
}

export function callGetDelegatorValidators(tokenAddress: Bech32String, req: QueryDelegatorValidatorsRequest): ValidatorAddressString[] {
    const calldatastr = `{"GetDelegatorValidators":${JSON.stringify<QueryDelegatorValidatorsRequest>(req)}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`validators not found for delegator ${req.delegator_addr}`)
    }
    const validators = JSON.parse<derc20types.DelegatorValidatorsResponse>(resp.data)
    return validators.validators;
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
    if (result.address == "") {
        revert(`could not find staking token address: ${denom}`)
    }
    return result.address
}

export function GetBankSupply(denom: string): banktypes.QuerySupplyOfResponse {
    let calldata = new banktypes.QuerySupplyOfRequest(denom);
    let calldatastr = `{"GetSupplyOf":${JSON.stringify<banktypes.QuerySupplyOfRequest>(calldata)}}`;
    let resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get supply for denom: ${denom}: ${resp.data}`)
    }
    return JSON.parse<banktypes.QuerySupplyOfResponse>(resp.data)
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

