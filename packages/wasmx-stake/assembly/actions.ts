import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import * as roles from "wasmx-env/assembly/roles"
import { BigInt } from "wasmx-env/assembly/bn"
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import * as wasmxcoret from "wasmx-env-core/assembly/types";
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import * as banktypes from "wasmx-bank/assembly/types"
import * as derc20types from "wasmx-derc20/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import { getParamsInternal, setParams, setNewValidator, getParams, getValidator, getValidatorsAddresses, getValidatorAddrByConsAddr, setValidator, getValidatorOperatorByHexAddr, setBaseDenom, getBaseDenom, getConsAddress } from './storage';
import { GenesisState, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate, MsgUpdateValidators, InitGenesisResponse, UnbondedS, QueryValidatorRequest, QueryValidatorResponse, QueryDelegationRequest, QueryValidatorsResponse, MODULE_NAME, QueryPoolRequest, QueryPoolResponse, Pool, BondedS, AfterValidatorCreated, AfterValidatorBonded, QueryValidatorDelegationsRequest, QueryValidatorDelegationsResponse, QueryDelegatorValidatorsRequest, QueryDelegatorValidatorsResponse, QueryParamsRequest, QueryParamsResponse, ValidatorSimple, QueryValidatorInfosResponse, getValidatorFromMsgCreate, Description, QueryContractInfoResponse, QueryIsValidatorJailed, MsgJail, MsgUnjail, MsgSlashWithInfractionReason, MsgSlash, QueryIsValidatorJailedResponse, MsgSlashWithInfractionReasonResponse, QueryConsensusAddressByOperatorAddressResponse, QueryConsensusAddressByOperatorAddress } from './types';
import { LoggerDebug, LoggerError, LoggerInfo, revert } from './utils';
import { parseInt64 } from "wasmx-utils/assembly/utils";
import { Bech32String, CallRequest, CallResponse, Coin, PageRequest, PageResponse, ValidatorAddressString, Event, EventAttribute, MsgSetup, ContractInfo, ContractStorageTypeByString } from "wasmx-env/assembly/types";
import { AttributeKeyAmount, AttributeKeyValidator, EventTypeCreateValidator } from "./events";
import { callContract } from "wasmx-env/assembly/utils";

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

export function setup(req: MsgSetup): ArrayBuffer {
    const oldaddr = req.previous_address
    if (oldaddr != "") {
        setupStorageMigration(oldaddr)
    }
    return new ArrayBuffer(0)
}

export function stop(): ArrayBuffer {
    return new ArrayBuffer(0)
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

    const ev = new Event(
        EventTypeCreateValidator,
        [
            new EventAttribute(AttributeKeyValidator, req.validator_address, true),
            new EventAttribute(AttributeKeyAmount, req.value.amount.toString(10), true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);
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

export function Jail(req: MsgJail): ArrayBuffer {
    const resp = new ArrayBuffer(0)
    const validator = getValidatorByConsAddr(req.consaddr)
    if (validator == null) {
        revert(`cannot jail validator, validator not found: ${req.consaddr}`)
        return resp;
    }
    jailValidator(validator)
    return resp;
}

// can only be called internally
export function Unjail(req: MsgUnjail): ArrayBuffer {
    const resp = new ArrayBuffer(0)
    const validator = getValidator(req.address)
    if (validator == null) {
        revert(`cannot jail validator, validator not found: ${req.address}`)
        return resp;
    }
    unjailValidator(validator)

    // TODO
    // cannot be unjailed if no self-delegation exists
    return resp;
}

export function Slash(req: MsgSlash): ArrayBuffer {
    const amount = slashWithInfraction(req.consaddr, req.infractionHeight, req.power, req.slashFactor, "")
    return String.UTF8.encode(JSON.stringify<MsgSlashWithInfractionReasonResponse>(new MsgSlashWithInfractionReasonResponse(amount)))
}

export function SlashWithInfractionReason(req: MsgSlashWithInfractionReason): ArrayBuffer {
    const amount = slashWithInfraction(req.consaddr, req.infractionHeight, req.power, req.slashFactor, req.infractionReason)
    return String.UTF8.encode(JSON.stringify<MsgSlashWithInfractionReasonResponse>(new MsgSlashWithInfractionReasonResponse(amount)))
}

export function slashWithInfraction(consaddr: string, infractionHeight: i64, power: i64, slashFactor: string, infractionReason: string): BigInt {
    // cosmos slashes the validator here and all the delegators
    // TODO implement me
    const validator = getValidatorByConsAddr(consaddr)
    if (validator == null) {
        revert(`cannot slash validator, validator not found: ${consaddr}`)
        return BigInt.zero()
    }
    // TODO slash balance, maybe slash delegators
    return BigInt.zero()
}

export function IsValidatorJailed(req: QueryIsValidatorJailed): ArrayBuffer {
    const resp = new QueryIsValidatorJailedResponse(false)
    const validator = getValidatorByConsAddr(req.consaddr)
    if (validator == null) {
        revert(`cannot jail validator, validator not found: ${req.consaddr}`)
        return new ArrayBuffer(0);
    }
    resp.jailed = validator.jailed
    return String.UTF8.encode(JSON.stringify<QueryIsValidatorJailedResponse>(resp))
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

export function ConsensusAddressByOperatorAddress(req: QueryConsensusAddressByOperatorAddress): ArrayBuffer {
    const validator = getValidator(req.validator_addr);
    if (validator == null) {
        revert(`validator not found: ${req.validator_addr}`);
        return new ArrayBuffer(0);
    }
    if (validator.consensus_pubkey == null) {
        revert(`validator consensus key not found: ${req.validator_addr}`);
        return new ArrayBuffer(0);
    }
    const consAddr = getConsAddress(validator.consensus_pubkey!)
    let data = JSON.stringify<QueryConsensusAddressByOperatorAddressResponse>(new QueryConsensusAddressByOperatorAddressResponse(consAddr))
    return String.UTF8.encode(data)
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

export function getValidatorByConsAddr(consaddr: string): Validator | null {
    const addr = getValidatorAddrByConsAddr(consaddr)
    if (addr == "") {
        return null
    }
    return getValidator(addr)
}

export function jailValidator(validator: Validator): void {
    if (validator.jailed) {
        revert(`cannot jail already jailed validator: ${validator.operator_address}`)
    }
    validator.jailed = true
    setValidator(validator)
}

export function unjailValidator(validator: Validator): void {
    if (!validator.jailed) {
        revert(`cannot unjail already unjailed validator: ${validator.operator_address}`)
    }
    validator.jailed = false
    setValidator(validator)
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
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`balanceOfValidator not found`)
    }
    LoggerDebug("validator balance", ["response", resp.data])
    const amount = JSON.parse<erc20types.MsgBalanceOfResponse>(resp.data)
    return amount.balance
}

export function callGetValidatorDelegations(tokenAddress: Bech32String, req: QueryValidatorDelegationsRequest): string {
    const calldatastr = `{"GetValidatorDelegations":${JSON.stringify<QueryValidatorDelegationsRequest>(req)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`validator delegations not found for ${req.validator_addr}`)
    }
    return resp.data
}

export function callGetDelegatorValidators(tokenAddress: Bech32String, req: QueryDelegatorValidatorsRequest): ValidatorAddressString[] {
    const calldatastr = `{"GetDelegatorValidators":${JSON.stringify<QueryDelegatorValidatorsRequest>(req)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`validators not found for delegator ${req.delegator_addr}`)
    }
    const validators = JSON.parse<derc20types.DelegatorValidatorsResponse>(resp.data)
    return validators.validators;
}

export function callGetDelegation(tokenAddress: Bech32String, delegator: Bech32String, validator: Bech32String): string {
    const calldata = new QueryDelegationRequest(delegator, validator);
    const calldatastr = `{"GetDelegation":${JSON.stringify<QueryDelegationRequest>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`delegation not found`)
    }
    return resp.data
}

export function callDelegate(tokenAddress: Bech32String, delegator: Bech32String, validator: Bech32String, value: BigInt): void {
    const calldata = new derc20types.MsgDelegate(delegator, validator, value);
    const calldatastr = `{"delegate":${JSON.stringify<derc20types.MsgDelegate>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
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
    const req = new CallRequest("bank", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(base64.decode(resp.data).buffer);
    return resp;
}

export function getPower(tokens: BigInt): i64 {
    // @ts-ignore
    const v: BigInt = tokens / BigInt.fromU32(POWER_REDUCTION);
    return v.toI64()
}

export function setNewValidatorAndCallHook(value: Validator): void {
    const v = getValidator(value.operator_address)
    if (v != null) {
        revert(`validator already registered: ${value.operator_address}`)
    }
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
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract("hooks", calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}

export function getContractInfo(addr: Bech32String): ContractInfo | null {
    const addrb64 = base64.encode(Uint8Array.wrap(wasmxw.addr_canonicalize(addr)))
    const calldatastr = `{"GetContractInfo":{"address":"${addrb64}"}}`;
    const resp = callContract(roles.ROLE_STORAGE_CONTRACTS, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        LoggerError(`get contract info failed`, ["error", resp.data])
        return null;
    }
    const data = JSON.parse<QueryContractInfoResponse>(resp.data)
    return data.contract_info
}

export function setupStorageMigration(addr: Bech32String): void {
    const sourceContractInfo = getContractInfo(addr);
    if (sourceContractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }
    const ourAddr = wasmxw.getAddress()
    const targetContractInfo = getContractInfo(ourAddr);
    if (targetContractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }

    LoggerInfo("migrating contract storage", ["from_address", addr, "to_address", ourAddr, "source storage type", sourceContractInfo.storage_type, "target storage type", targetContractInfo.storage_type])

    if (!ContractStorageTypeByString.has(sourceContractInfo.storage_type)) {
        revert(`invalid source storage type ${sourceContractInfo.storage_type}`)
    }
    if (!ContractStorageTypeByString.has(targetContractInfo.storage_type)) {
        revert(`invalid target storage type ${targetContractInfo.storage_type}`)
    }

    wasmxcorew.migrateContractStateByAddress(new wasmxcoret.MigrateContractStateByAddressRequest(addr, ourAddr, sourceContractInfo.storage_type, targetContractInfo.storage_type))

    LoggerInfo("contract storage migrated", ["address", ourAddr, "target_storage_type", targetContractInfo.storage_type]);
}
