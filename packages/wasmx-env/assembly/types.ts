import { JSON } from "json-as/assembly";
import { BigInt } from "./bn";

export const MAX_LOGGED = 2000

// @ts-ignore
@serializable
export type HexString = string;
// @ts-ignore
@serializable
export type Base64String = string;
// @ts-ignore
@serializable
export type Bech32String = string;

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CallResponse {
  success: i32;
  data: string;
  constructor(success: i32, data: string) {
    this.success = success;
    this.data = data;
  }
}

// @ts-ignore
@serializable
export class Coin {
    denom: string
    amount: BigInt
    constructor(denom: string, amount: BigInt) {
        this.denom = denom
        this.amount = amount
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CreateAccountResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class Create2AccountResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class WasmxLog {
    type: string = 'fsmvm';
    data: Uint8Array;
    topics: Array<Uint8Array>;
    constructor(data: Uint8Array, topics: Array<Uint8Array>) {
        this.data = data;
        this.topics = topics;
    }
}

// @ts-ignore
@serializable
export class GrpcResponse {
    data: string // base64
    error: string
    constructor(data: string, error: string) {
        this.data = data;
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MerkleSlices {
	slices: string[] // base64 encoded
    constructor(slices: string[]) {
        this.slices = slices;
    }
}

// @ts-ignore
@serializable
export class StartTimeoutRequest {
	contract: string
	delay: i64
	args: Base64String
    constructor(contract: string, delay: i64, args: Base64String) {
        this.contract = contract
        this.delay = delay
        this.args = args
    }
}

// @ts-ignore
@serializable
export class LoggerLog {
	msg: string
	parts: string[]
    constructor(msg: string, parts: string[]) {
        this.msg = msg;
        this.parts = parts;
    }
}

// @ts-ignore
@serializable
export class EventAttribute {
    key: string
	value: Base64String
	index: bool
    constructor(key: string, value: Base64String, index: bool) {
        this.key = key;
        this.value = value;
        this.index = index;
    }
}

// @ts-ignore
@serializable
export class Event {
    type: string
	attributes: EventAttribute[]
    constructor(type: string, attributes: EventAttribute[]) {
        this.type = type;
        this.attributes = attributes;
    }
}

// @ts-ignore
@serializable
export class StorageRange {
	start_key: Base64String
	end_key: Base64String
	reverse: bool
    constructor(start_key: Base64String, end_key: Base64String, reverse: bool) {
        this.start_key = start_key
        this.end_key = end_key
        this.reverse = reverse
    }
}

// @ts-ignore
@serializable
export class StoragePair {
	key: Base64String
	value: Base64String
    constructor(key: Base64String, value: Base64String) {
        this.key = key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class StoragePairs {
	values: StoragePair[]
    constructor(values: StoragePair[]) {
        this.values = values
    }
}

// @ts-ignore
@serializable
export class PublicKey {
    anytype: string
    key: Base64String
    constructor(type: string, key: Base64String) {
        this.anytype = type;
        this.key = key
    }

    static toExternal(pk: PublicKey): string {
        let data = JSON.stringify<PublicKey>(pk)
        data = data.replaceAll(`"anytype"`, `"@type"`)
        return data;
    }

    static fromExternal(value: string): PublicKey {
        value = value.replaceAll(`"@type"`, `"anytype"`)
        return JSON.parse<PublicKey>(value);
    }
}

// @ts-ignore
@serializable
export class ModeInfoSingle {
    mode: string
    constructor(mode: string) {
        this.mode = mode
    }
}

// @ts-ignore
@serializable
export class ModeInfoMulti {
    mode_infos: ModeInfo[]
    constructor(mode_infos: ModeInfo[]) {
        this.mode_infos = mode_infos
    }
}

// @ts-ignore
@serializable
export class ModeInfo {
    single: ModeInfoSingle | null
    multi: ModeInfoMulti | null
    constructor(single: ModeInfoSingle | null, multi: ModeInfoMulti | null) {
        this.single = single
        this.multi = multi
    }
}

// @ts-ignore
@serializable
export class WasmxExecutionMessage {
    data: Base64String
    constructor(data: Base64String) {
        this.data = data
    }
}

// @ts-ignore
@serializable
export class TxMessage {
    anytype: string
    sender: Bech32String
    contract: Bech32String
    msg: WasmxExecutionMessage
    funds: Coin[]
    dependencies: string[]
    constructor(anytype: string, sender: Bech32String, contract: Bech32String, msg: WasmxExecutionMessage, funds: Coin[], dependencies: string[]) {
        this.anytype = anytype
        this.sender = sender
        this.contract = contract
        this.msg = msg
        this.funds = funds
        this.dependencies = dependencies
    }
}

// @ts-ignore
@serializable
export class TxBody {
    messages: TxMessage[]
    memo: string
    timeout_height: u64
    extension_options: Base64String[]
    non_critical_extension_options: Base64String[]
    constructor(messages: TxMessage[], memo: string, timeout_height: u64, extension_options: Base64String[], non_critical_extension_options: Base64String[]) {
        this.messages = messages
        this.memo = memo
        this.timeout_height = timeout_height
        this.extension_options = extension_options
        this.non_critical_extension_options = non_critical_extension_options
    }
}

// @ts-ignore
@serializable
export class SignerInfo {
    public_key: PublicKey
    mode_info: ModeInfo
    sequence: u64
    constructor(public_key: PublicKey, mode_info: ModeInfo, sequence: u64) {
        this.public_key = public_key
        this.mode_info = mode_info
        this.sequence = sequence
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class Tip { // deprecated
    amount: Coin[]
    tipper: Bech32String
    constructor(amount: Coin[], tipper: Bech32String) {
        this.amount = amount
        this.tipper = tipper
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class SignedTransaction { // TxRaw
    body: TxBody
    auth_info: AuthInfo
    signatures: Base64String[]
    constructor(body: TxBody, auth_info: AuthInfo, signatures: Base64String[]) {
        this.body = body
        this.auth_info = auth_info
        this.signatures = signatures
    }
}
