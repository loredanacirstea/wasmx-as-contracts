import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";

@json
export class AddressBook {
    transactionHash: Base64String
    blockHash: Base64String
    constructor(transactionHash: Base64String, blockHash: Base64String) {
        this.transactionHash = transactionHash
        this.blockHash = blockHash
    }
}

@json
export class Params {
    max_level: i64
    current_level: i64
    members_count: i64
    constructor(max_level: i64, current_level: i64, members_count: i64) {
        this.max_level = max_level
        this.current_level = current_level
        this.members_count = members_count
    }
}

@json
export class LayerInvite {
    level: i64
    constructor(level: i64) {
        this.level = level
    }
}

@json
export class ReceiveLayerInvite {
    invite: LayerInvite
    signature: Base64String
    constructor(invite: LayerInvite, signature: Base64String) {
        this.invite = invite
        this.signature = signature
    }
}
