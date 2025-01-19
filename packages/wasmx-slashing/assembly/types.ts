import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, ConsensusAddressString, PageRequest, PageResponse } from "wasmx-env/assembly/types";

export const MODULE_NAME = "slashing"

// MissedBlockBitmapChunkSize defines the chunk size, in number of bits, of a
// validator missed block bitmap. Chunks are used to reduce the storage and
// write overhead of IAVL nodes. The total size of the bitmap is roughly in
// the range [0, SignedBlocksWindow) where each bit represents a block. A
// validator's IndexOffset modulo the SignedBlocksWindow is used to retrieve
// the chunk in that bitmap range. Once the chunk is retrieved, the same index
// is used to check or flip a bit, where if a bit is set, it indicates the
// validator missed that block.
//
// For a bitmap of N items, i.e. a validator's signed block window, the amount
// of write complexity per write with a factor of f being the overhead of
// IAVL being un-optimized, i.e. 2-4, is as follows:
//
// ChunkSize + (f * 256 <IAVL leaf hash>) + 256 * log_2(N / ChunkSize)
//
// As for the storage overhead, with the same factor f, it is as follows:
// (N - 256) + (N / ChunkSize) * (512 * f)
export const MissedBlockBitmapChunkSize: i32 = 1024 // 2^10 bits

export const ValidatorUpdateDelay: i64 = 1

// @ts-ignore
@serializable
export enum Infraction {
    // UNSPECIFIED defines an empty infraction.
    INFRACTION_UNSPECIFIED = 0,
    // DOUBLE_SIGN defines a validator that double-signs a block.
    INFRACTION_DOUBLE_SIGN = 1,
    // DOWNTIME defines a validator that missed signing too many blocks.
    INFRACTION_DOWNTIME = 2,
}

export const Infraction_INFRACTION_UNSPECIFIED = "INFRACTION_UNSPECIFIED"
export const Infraction_INFRACTION_DOUBLE_SIGN = "INFRACTION_DOUBLE_SIGN"
export const Infraction_INFRACTION_DOWNTIME = "INFRACTION_DOWNTIME"

export const InfractionByString = new Map<string, Infraction>();
InfractionByString.set(Infraction_INFRACTION_UNSPECIFIED, Infraction.INFRACTION_UNSPECIFIED);
InfractionByString.set(Infraction_INFRACTION_DOUBLE_SIGN, Infraction.INFRACTION_DOUBLE_SIGN);
InfractionByString.set(Infraction_INFRACTION_DOWNTIME, Infraction.INFRACTION_DOWNTIME);

export const InfractionByEnum = new Map<Infraction, string>();
InfractionByEnum.set(Infraction.INFRACTION_UNSPECIFIED, Infraction_INFRACTION_UNSPECIFIED);
InfractionByEnum.set(Infraction.INFRACTION_DOUBLE_SIGN, Infraction_INFRACTION_DOUBLE_SIGN);
InfractionByEnum.set(Infraction.INFRACTION_DOWNTIME, Infraction_INFRACTION_DOWNTIME);

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
    // Height at which validator was first a candidate OR was un-jailed
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
    cons_address: string
    constructor(cons_address: string) {
        this.cons_address = cons_address
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
export class QueryMissedBlockBitmapRequest {
    cons_address: string
    constructor(cons_address: string) {
        this.cons_address = cons_address
    }
}

// @ts-ignore
@serializable
export class QueryMissedBlockBitmapResponse {
    chunks: Base64String[]
    constructor(chunks: Base64String[]) {
        this.chunks = chunks
    }
}

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
