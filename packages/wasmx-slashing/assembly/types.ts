import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, ConsensusAddressString, PageRequest, PageResponse } from "wasmx-env/assembly/types";

export const MODULE_NAME = "slashing"

// @ts-ignore
@serializable
export class GenesisState {
    params: Params
    signing_infos: SigningInfo[]
    missed_blocks: ValidatorMissedBlocks[]
    constructor(params: Params, signing_infos: SigningInfo[], missed_blocks: ValidatorMissedBlocks[]) {
        this.params = params
        this.signing_infos = signing_infos
        this.missed_blocks = missed_blocks
    }
}
// {"params":{"signed_blocks_window":"0","min_signed_per_window":"0.000000000000000000","downtime_jail_duration":"0s","slash_fraction_double_sign":"0.000000000000000000","slash_fraction_downtime":"0.000000000000000000"},"signing_infos":[],"missed_blocks":[]}

// @ts-ignore
@serializable
export class SigningInfo {
    //  e.g. mythosvalcons1....
    address: ConsensusAddressString // same as ValidatorSigningInfo.address
    validator_signing_info: ValidatorSigningInfo
    constructor(address: ConsensusAddressString, validator_signing_info: ValidatorSigningInfo) {
        this.address = address
        this.validator_signing_info = validator_signing_info
    }
}

// @ts-ignore
@serializable
export class ValidatorSigningInfo {
    //  e.g. mythosvalcons1....
    address: ConsensusAddressString
    start_height: i64
    index_offset: i64
    jailed_until: Date
    tombstoned: bool
    missed_blocks_counter: i64
    constructor(address: ConsensusAddressString, start_height: i64, index_offset: i64, jailed_until: Date, tombstoned: bool, missed_blocks_counter: i64) {
        this.address = address
        this.start_height = start_height
        this.index_offset = index_offset
        this.jailed_until = jailed_until
        this.tombstoned = tombstoned
        this.missed_blocks_counter = missed_blocks_counter
    }
}

// @ts-ignore
@serializable
export class ValidatorMissedBlocks {
    address: ConsensusAddressString
    missed_blocks: MissedBlock[]
    constructor(address: ConsensusAddressString, missed_blocks: MissedBlock[]) {
        this.address = address
        this.missed_blocks = missed_blocks
    }
}

// @ts-ignore
@serializable
export class MissedBlock {
    index: i64
    missed: bool
    constructor(index: i64, missed: bool) {
        this.index = index
        this.missed = missed
    }
}

// @ts-ignore
@serializable
export class Params {
    signed_blocks_window: i64
    min_signed_per_window: string
    downtime_jail_duration: string
    slash_fraction_double_sign: string
    slash_fraction_downtime: string
    constructor(signed_blocks_window: i64, min_signed_per_window: string, downtime_jail_duration: string, slash_fraction_double_sign: string, slash_fraction_downtime: string) {
        this.signed_blocks_window = signed_blocks_window
        this.min_signed_per_window = min_signed_per_window
        this.downtime_jail_duration = downtime_jail_duration
        this.slash_fraction_double_sign = slash_fraction_double_sign
        this.slash_fraction_downtime = slash_fraction_downtime
    }
}

// @ts-ignore
@serializable
export class QuerySigningInfoRequest {
    // cons_address is the address to query signing info of
    consAddress: string
    constructor(consAddress: string) {
        this.consAddress = consAddress
    }
}

// @ts-ignore
@serializable
export class QuerySigningInfoResponse {
    // val_signing_info is the signing info of requested val cons address
    valSigningInfo: ValidatorSigningInfo
    constructor(valSigningInfo: ValidatorSigningInfo) {
        this.valSigningInfo = valSigningInfo
    }
}

// @ts-ignore
@serializable
export class QuerySigningInfosRequest {
    pagination: PageRequest
    constructor(pagination: PageRequest) {
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryParamsRequest {}

// @ts-ignore
@serializable
export class QueryParamsResponse {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}


// @ts-ignore
@serializable
export class QuerySigningInfosResponse {
    info: ValidatorSigningInfo[]
    pagination: PageResponse
    constructor(info: ValidatorSigningInfo[], pagination: PageResponse) {
        this.info = info
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class MsgRunHook {
    hook: string
    data: Base64String
    constructor(hook: string, data: Base64String) {
        this.hook = hook
        this.data = data
    }
}
