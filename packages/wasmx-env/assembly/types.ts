import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import { BigInt } from "./bn";
import { AnyWrap } from "./wasmx_types";

export type HexString = string;
export type Base64String = string;
export type Bech32String = string;
export type ConsensusAddressString = string;
export type ValidatorAddressString = string;
export enum RoleChangedActionType {
    Replace = 0,
    Add = 1,
    Remove = 2,
    NoOp = 3,
}

export const RoleChangedAction_Replace = "Replace"
export const RoleChangedAction_Add = "Add"
export const RoleChangedAction_Remove = "Remove"
export const RoleChangedAction_NoOp = "NoOp"

export const RoleChangedActionTypeByString = new Map<string, RoleChangedActionType>();
RoleChangedActionTypeByString.set(RoleChangedAction_Replace, RoleChangedActionType.Replace);
RoleChangedActionTypeByString.set(RoleChangedAction_Add, RoleChangedActionType.Add);
RoleChangedActionTypeByString.set(RoleChangedAction_Remove, RoleChangedActionType.Remove);
RoleChangedActionTypeByString.set(RoleChangedAction_NoOp, RoleChangedActionType.NoOp);

export const RoleChangedActionTypeByEnum = new Map<RoleChangedActionType, string>();
RoleChangedActionTypeByEnum.set(RoleChangedActionType.Replace, RoleChangedAction_Replace);
RoleChangedActionTypeByEnum.set(RoleChangedActionType.Add, RoleChangedAction_Add);
RoleChangedActionTypeByEnum.set(RoleChangedActionType.Remove, RoleChangedAction_Remove);
RoleChangedActionTypeByEnum.set(RoleChangedActionType.NoOp, RoleChangedAction_NoOp);

@json
export class RoleChangeRequest {
    role: string = ""
    label: string = ""
    contract_address: string = ""
    action_type: RoleChangedActionType = RoleChangedActionType.Replace
    constructor(role: string = "", label: string = "",  contract_address: string = "", action_type: RoleChangedActionType = RoleChangedActionType.Replace) {
        this.role = role
        this.label = label
        this.contract_address = contract_address
        this.action_type = action_type
    }
}

@json
export class RoleChanged {
    role: string = ""
    label: string = ""
    contract_address: Bech32String = ""
    action_type: RoleChangedActionType = RoleChangedActionType.Replace
    previous_address: Bech32String = ""
    constructor(role: string, label: string,  contract_address: Bech32String, action_type: RoleChangedActionType, previous_address: Bech32String) {
        this.role = role
        this.label = label
        this.contract_address = contract_address
        this.action_type = action_type
        this.previous_address = previous_address
    }
}

@json
export class Role {
    role: string = ""
    storage_type: ContractStorageType = ContractStorageType.CoreConsensus
    // if primary exists, then the role can be used as target for transactions
    // primary is the index for an entry from "labels" and "addresses"
    primary: i32 = 0
    multiple: bool = false
    labels: string[] = []
    addresses: string[] = []
    constructor(
        role: string,
        storage_type: ContractStorageType,
        primary: i32,
        multiple: bool,
        labels: string[],
        addresses: string[],
    ) {
        this.role = role
        this.storage_type = storage_type
        this.primary = primary
        this.multiple = multiple
        this.labels = labels
        this.addresses = addresses
    }
}

@json
export class RolesGenesis {
    roles: Role[] = []
    // contracts handle their own migration
    individual_migration: string[] = []
    constructor(roles: Role[], individual_migration: string[]) {
        this.roles = roles
        this.individual_migration = individual_migration
    }
}

@json
export class Account {
    address: Bech32String;
    pubKey: Base64String;
    accountNumber: i64;
    sequence: i64;
    constructor(address: Bech32String, pubKey: Base64String, accountNumber: i64, sequence: i64) {
        this.address = address;
        this.pubKey = pubKey;
        this.accountNumber = accountNumber;
        this.sequence = sequence;
    }
}

@json
export class CallRequest {
  to: string;
  calldata: string;
  value: BigInt;
  gasLimit: i64;
  isQuery: boolean;
  constructor(to: string, calldata: string, value: BigInt, gasLimit: i64, isQuery: boolean) {
    this.to = to;
    this.calldata = calldata;
    this.value = value;
    this.gasLimit = gasLimit;
    this.isQuery = isQuery;
  }
}

@json
export class CallResponse {
  success: i32;
  data: string;
  constructor(success: i32, data: string) {
    this.success = success;
    this.data = data;
  }
}

@json
export class Coin {
    denom: string
    amount: BigInt
    constructor(denom: string, amount: BigInt) {
        this.denom = denom
        this.amount = amount
    }
}

@json
export class DecCoin {
    denom: string
    amount: BigInt
    constructor(denom: string, amount: BigInt) {
        this.denom = denom
        this.amount = amount
    }
}

@json
export class CreateAccountRequest {
    code_id: u64
	msg: Base64String
	funds: Coin[]
	label: string

    constructor(code_id: u64, msg: Base64String, funds: Coin[], label: string) {
        this.code_id = code_id;
        this.msg = msg;
        this.funds = funds;
        this.label = label;
    }
}

@json
export class Create2AccountRequest {
    code_id: u64
	msg: Base64String
    salt: Base64String
	funds: Coin[]
	label: string

    constructor(code_id: u64, msg: Base64String, salt: Base64String, funds: Coin[], label: string) {
        this.code_id = code_id;
        this.msg = msg;
        this.salt = salt;
        this.funds = funds;
        this.label = label;
    }
}

@json
export class CreateAccountResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class Create2AccountResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class WasmxLog {
    type: string = 'fsmvm';
    data: u8[]
    topics: Array<u8[]>;
    constructor(data: u8[], topics: Array<u8[]>) {
        this.data = data;
        this.topics = topics;
    }
}

@json
export class MerkleSlices {
	slices: string[] // base64 encoded
    constructor(slices: string[]) {
        this.slices = slices;
    }
}

@json
export class LoggerLog {
	msg: string
	parts: string[]
    constructor(msg: string, parts: string[]) {
        this.msg = msg;
        this.parts = parts;
    }
}

@json
export class EventAttribute {
    key: string = ""
	value: Base64String = ""
	index: bool = false
    constructor(key: string, value: Base64String, index: bool) {
        this.key = key;
        this.value = value;
        this.index = index;
    }
}

@json
export class Event {
    type: string = ""
	attributes: EventAttribute[] = []
    constructor(type: string, attributes: EventAttribute[]) {
        this.type = type;
        this.attributes = attributes;
    }
}

@json
export class StorageRange {
	start_key: Base64String = ""
	end_key: Base64String = ""
	reverse: bool = false
    constructor(start_key: Base64String, end_key: Base64String, reverse: bool) {
        this.start_key = start_key
        this.end_key = end_key
        this.reverse = reverse
    }
}

@json
export class StorageDeleteRange {
	start_key: Base64String = ""
	end_key: Base64String = ""
    constructor(start_key: Base64String, end_key: Base64String) {
        this.start_key = start_key
        this.end_key = end_key
    }
}

@json
export class StoragePair {
	key: Base64String = ""
	value: Base64String = ""
    constructor(key: Base64String, value: Base64String) {
        this.key = key
        this.value = value
    }
}

@json
export class StoragePairs {
	values: StoragePair[] = []
    constructor(values: StoragePair[]) {
        this.values = values
    }
}

@json
export class ed25519PubKey {
    key: Base64String
    constructor(key: Base64String) {
        this.key = key
    }
    static typeUrl(): string {
        return "/cosmos.crypto.ed25519.PubKey"
    }
}

@json
export class secp256k1PubKey {
    key: Base64String
    constructor(key: Base64String) {
        this.key = key
    }
    static typeUrl(): string {
        return "/cosmos.crypto.secp256k1.PubKey"
    }
}

@json
export class defaultPubKey {
    key: Base64String
    constructor(key: Base64String) {
        this.key = key
    }
}

@json
export class PublicKey { // extends AnyWrap // we cannot extend in as-json
    type_url: string = ""
    value: Base64String = ""
    constructor(type_url: string, value: Base64String) {
        this.type_url = type_url
        this.value = value
    }

    static New(typeUrl: string, value: string): AnyWrap {
        return new AnyWrap(typeUrl, base64.encode(Uint8Array.wrap(String.UTF8.encode(value))));
    }

    getKey(): defaultPubKey {
        return JSON.parse<defaultPubKey>(String.UTF8.decode(base64.decode(this.value).buffer))
    }
}

export enum SignMode {
    SIGN_MODE_UNSPECIFIED = 0,
    SIGN_MODE_DIRECT = 1,
    SIGN_MODE_TEXTUAL = 2,
    SIGN_MODE_DIRECT_AUX = 3,
    SIGN_MODE_LEGACY_AMINO_JSON = 127,
    SIGN_MODE_EIP_191 = 191,
}

export const SIGN_MODE_UNSPECIFIED = "SIGN_MODE_UNSPECIFIED"
export const SIGN_MODE_DIRECT = "SIGN_MODE_DIRECT"
export const SIGN_MODE_TEXTUAL = "SIGN_MODE_TEXTUAL"
export const SIGN_MODE_DIRECT_AUX = "SIGN_MODE_DIRECT_AUX"
export const SIGN_MODE_LEGACY_AMINO_JSON = "SIGN_MODE_LEGACY_AMINO_JSON"
export const SIGN_MODE_EIP_191 = "SIGN_MODE_EIP_191"

export const SignModeByEnum = new Map<SignMode, string>();
SignModeByEnum.set(SignMode.SIGN_MODE_UNSPECIFIED, SIGN_MODE_UNSPECIFIED);
SignModeByEnum.set(SignMode.SIGN_MODE_DIRECT, SIGN_MODE_DIRECT);
SignModeByEnum.set(SignMode.SIGN_MODE_TEXTUAL, SIGN_MODE_TEXTUAL);
SignModeByEnum.set(SignMode.SIGN_MODE_DIRECT_AUX, SIGN_MODE_DIRECT_AUX);
SignModeByEnum.set(SignMode.SIGN_MODE_LEGACY_AMINO_JSON, SIGN_MODE_LEGACY_AMINO_JSON);
SignModeByEnum.set(SignMode.SIGN_MODE_EIP_191, SIGN_MODE_EIP_191);

export const SignModeByName = new Map<string, SignMode>();
SignModeByName.set(SIGN_MODE_UNSPECIFIED, SignMode.SIGN_MODE_UNSPECIFIED);
SignModeByName.set(SIGN_MODE_DIRECT, SignMode.SIGN_MODE_DIRECT);
SignModeByName.set(SIGN_MODE_TEXTUAL, SignMode.SIGN_MODE_TEXTUAL);
SignModeByName.set(SIGN_MODE_DIRECT_AUX, SignMode.SIGN_MODE_DIRECT_AUX);
SignModeByName.set(SIGN_MODE_LEGACY_AMINO_JSON, SignMode.SIGN_MODE_LEGACY_AMINO_JSON);
SignModeByName.set(SIGN_MODE_EIP_191, SignMode.SIGN_MODE_EIP_191);

@json
export class ModeInfoSingle {
    mode: string
    constructor(mode: string) {
        this.mode = mode
    }
}

@json
export class ModeInfoMulti {
    mode_infos: ModeInfo[]
    constructor(mode_infos: ModeInfo[]) {
        this.mode_infos = mode_infos
    }
}

@json
export class ModeInfo {
    single: ModeInfoSingle | null
    // TODO fix recursive issue here
    // json-as runs into issues for recursive types
    @omit
    multi: ModeInfoMulti | null
    constructor(single: ModeInfoSingle | null, multi: ModeInfoMulti | null) {
        this.single = single
        this.multi = multi
    }
}

@json
export class WasmxExecutionMessage {
    data: Base64String
    constructor(data: Base64String) {
        this.data = data
    }
}

@json
export class TxMessage {
    type_url: string
    value: Base64String
    constructor(type_url: string, value: Base64String) {
        this.type_url = type_url
        this.value = value
    }
}

@json
export class TxBody {
    messages: TxMessage[]
    memo: string
    timeout_height: u64
    extension_options: AnyWrap[]
    non_critical_extension_options: AnyWrap[]
    constructor(messages: TxMessage[], memo: string, timeout_height: u64, extension_options: AnyWrap[], non_critical_extension_options: AnyWrap[]) {
        this.messages = messages
        this.memo = memo
        this.timeout_height = timeout_height
        this.extension_options = extension_options
        this.non_critical_extension_options = non_critical_extension_options
    }
}

@json
export class SignerInfo {
    public_key: PublicKey  | null = null
    mode_info: ModeInfo
    sequence: u64
    constructor(public_key: PublicKey | null, mode_info: ModeInfo, sequence: u64) {
        this.public_key = public_key
        this.mode_info = mode_info
        this.sequence = sequence
    }
}

@json
export class Fee {
    amount: Coin[]
    gas_limit: u64
    payer: Bech32String
    granter: Bech32String
    constructor(amount: Coin[], gas_limit: u64, payer: Bech32String, granter: Bech32String) {
        this.amount = amount
        this.gas_limit = gas_limit
        this.payer = payer
        this.granter = granter
    }
}

@json
export class Tip { // deprecated
    amount: Coin[]
    tipper: Bech32String
    constructor(amount: Coin[], tipper: Bech32String) {
        this.amount = amount
        this.tipper = tipper
    }
}

@json
export class AuthInfo {
    signer_infos: SignerInfo[]
    fee: Fee | null
    tip: Tip | null
    constructor(signer_infos: SignerInfo[], fee: Fee | null, tip: Tip | null) {
        this.signer_infos = signer_infos
        this.fee = fee
        this.tip = tip
    }
}

@json
export class SignedTransaction { // Tx // cosmos/tx/v1beta1/tx.proto
    body: TxBody
    auth_info: AuthInfo
    signatures: Base64String[]
    constructor(body: TxBody, auth_info: AuthInfo, signatures: Base64String[]) {
        this.body = body
        this.auth_info = auth_info
        this.signatures = signatures
    }
}


@json
export class PageRequest {
    key: u8
    offset: u64
    limit: u64
    count_total: bool
    reverse: bool
    constructor( key: u8, offset: u64, limit: u64, count_total: bool, reverse: bool) {
        this.key = key
        this.offset = offset
        this.limit = limit
        this.count_total = count_total
        this.reverse = reverse
    }
}

@json
export class PageResponse {
    // next_key: Base64String
    total: u64
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

@json
export class VerifyCosmosTxResponse {
    valid: bool
    error: string
    constructor(valid: bool, error: string) {
        this.valid = valid
        this.error = error
    }
}

@json
export class BlockInfo {
    height: u64;
    timestamp: u64;
    gasLimit: u64;
    hash: Base64String;
    difficulty: BigInt = BigInt.empty();
    proposer: Bech32String;
    constructor(height: u64, timestamp: u64, gasLimit: u64, hash: Base64String, proposer: Bech32String) {
        this.height = height;
        this.timestamp = timestamp;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
    }
}

@json
export class MsgCrossChainCallRequest {
    from: string = ""
    to: string = ""
    msg: Base64String = ""
    funds: Coin[] = []
    dependencies: string[] = []
    from_chain_id: string = ""
    to_chain_id: string = ""
    is_query: boolean = false
    timeout_ms: u64 = 300000 // 5 min
    constructor(
        to: string,
        msg: Base64String,
        funds: Coin[],
        dependencies: string[],
        to_chain_id: string,
    ) {
        this.to = to
        this.msg = msg
        this.funds = funds
        this.dependencies = dependencies
        this.to_chain_id = to_chain_id

        // set by wasmx
        this.from = ""
        this.from_chain_id = ""
        this.is_query = false
        this.timeout_ms = 0
    }
}

@json
export class MsgCrossChainCallResponse {
    error: string
    data: Base64String
    constructor(error: string, data: Base64String) {
        this.error = error
        this.data = data
    }
}

@json
export class MsgIsAtomicTxInExecutionRequest {
    sub_chain_id: string = ""
    tx_hash: Base64String = ""
    constructor(sub_chain_id: string = "", tx_hash: Base64String = "") {
        this.sub_chain_id = sub_chain_id
        this.tx_hash = tx_hash
    }
}

@json
export class MsgIsAtomicTxInExecutionResponse {
    is_in_execution: boolean = false
    constructor(is_in_execution: boolean = false) {
        this.is_in_execution = is_in_execution
    }
}

@json
export class CodeInfo {
    code_hash: Base64String = ""
    creator: Bech32String  = ""
    deps: string[] = []
    pinned: boolean = false
    metering_off: boolean = false
    metadata: CodeMetadata = new CodeMetadata("", [], "", "", "", "", "", new CodeOrigin("", ""))
    interpreted_bytecode_deployment: Base64String = ""
    interpreted_bytecode_runtime: Base64String = ""
    runtime_hash: Base64String = ""
    constructor(
        code_hash: Base64String,
        creator: Bech32String,
        deps: string[],
        pinned: boolean,
        metering_off: boolean,
        metadata: CodeMetadata,
        interpreted_bytecode_deployment: Base64String,
        interpreted_bytecode_runtime: Base64String,
        runtime_hash: Base64String,
    ) {
        this.code_hash = code_hash
        this.creator = creator
        this.deps = deps
        this.pinned = pinned
        this.metering_off = metering_off
        this.metadata = metadata
        this.interpreted_bytecode_deployment = interpreted_bytecode_deployment
        this.interpreted_bytecode_runtime = interpreted_bytecode_runtime
        this.runtime_hash = runtime_hash
    }
}

@json
export class CodeOrigin {
    chain_id: string = ""
    address: Bech32String = ""
    constructor(chain_id: string, address: Bech32String) {
        this.chain_id = chain_id
        this.address = address
    }
}

@json
export class ContractStorage {
    key: HexString
    value: Base64String
    constructor(key: HexString, value: Base64String) {
        this.key = key
        this.value = value
    }
}

@json
export class CodeMetadata {
    name: string = ""
    categ: string[] = []
    icon: string = ""
    author: string = ""
    site: string = ""
    abi: Base64String = ""
    json_schema: string = ""
    origin: CodeOrigin | null = new CodeOrigin("", "")
    constructor(
        name: string,
        categ: string[],
        icon: string,
        author: string,
        site: string,
        abi: Base64String,
        json_schema: string,
        origin: CodeOrigin | null,
    ) {
        this.name = name
        this.categ = categ
        this.icon = icon
        this.author = author
        this.site = site
        this.abi = abi
        this.json_schema = json_schema
        this.origin = origin
    }

    static Empty(): CodeMetadata {
        return new CodeMetadata("", [], "", "", "", "", "", null)
    }
}

@json
export class SystemContract {
    address: string = ""
    label: string = ""
    storage_type: string = ""
    init_message: Base64String = ""
    pinned: boolean = false
    metering_off: boolean = true
    native: boolean = false
    role: string = ""
    deps: string[] = []
    metadata: CodeMetadata = CodeMetadata.Empty()
    contract_state: ContractStorage[] = []
    constructor(
        address: string,
        label: string,
        storage_type: string,
        init_message: Base64String,
        pinned: boolean,
        metering_off: boolean,
        native: boolean,
        role: string,
        deps: string[],
        metadata: CodeMetadata,
    ) {
        this.address = address
        this.label = label
        this.storage_type = storage_type
        this.init_message = init_message
        this.pinned = pinned
        this.metering_off = metering_off
        this.native = native
        this.role = role
        this.deps = deps
        this.metadata = metadata
        this.contract_state = []
    }
}


@json
export class ContractInfo {
    code_id: u64 = 0
    creator: Bech32String = ""
    label: string = ""
    storage_type: string = ""
    init_message: Base64String = ""
    provenance: string = ""
    ibc_port_id: string = ""

    constructor(
        code_id: u64,
        creator: Bech32String,
        label: string,
        storage_type: string,
        init_message: Base64String,
        provenance: string,
        ibc_port_id: string,
    ) {
        this.code_id = code_id
        this.creator = creator
        this.label = label
        this.storage_type = storage_type
        this.init_message = init_message
        this.provenance = provenance
        this.ibc_port_id = ibc_port_id
    }
}

@json
export class MsgSetup {
    previous_address: Bech32String
    constructor(previous_address: Bech32String) {
        this.previous_address = previous_address
    }
}

export enum ContractStorageType {
    CoreConsensus = 0,
    MetaConsensus = 1,
    SingleConsensus = 2,
    Memory = 3,
    Transient = 4,
}

export const StorageCoreConsensus = "CoreConsensus"
export const StorageMetaConsensus = "MetaConsensus"
export const StorageSingleConsensus = "SingleConsensus"
export const StorageMemory = "Memory"
export const StorageTransient = "Transient"

export const ContractStorageTypeByString = new Map<string, ContractStorageType>();
ContractStorageTypeByString.set(StorageCoreConsensus, ContractStorageType.CoreConsensus);
ContractStorageTypeByString.set(StorageMetaConsensus, ContractStorageType.MetaConsensus);
ContractStorageTypeByString.set(StorageSingleConsensus, ContractStorageType.SingleConsensus);
ContractStorageTypeByString.set(StorageMemory, ContractStorageType.Memory);
ContractStorageTypeByString.set(StorageTransient, ContractStorageType.Transient);

export const ContractStorageTypeByEnum = new Map<ContractStorageType, string>();
ContractStorageTypeByEnum.set(ContractStorageType.CoreConsensus, StorageCoreConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.MetaConsensus, StorageMetaConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.SingleConsensus, StorageSingleConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.Memory, StorageMemory);
ContractStorageTypeByEnum.set(ContractStorageType.Transient, StorageTransient);
