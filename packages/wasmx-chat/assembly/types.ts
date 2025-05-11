import { JSON } from "json-as";
import { Base64String, Bech32String, PageRequest } from "wasmx-env/assembly/types";
import { NetworkNode } from "wasmx-p2p/assembly/types";

export const MODULE_NAME = "chat"
export const PROTOCOL_ID = "chatv001"

@json
export class NodeInfo {
    address: Bech32String
    node: NetworkNode
    constructor(address: Bech32String, node: NetworkNode) {
        this.address = address
        this.node = node
    }
}

@json
export class ChatRoom {
    roomId: string
    peers: NodeInfo[]
    last_block_height: i64
    last_block_hash: Base64String
    constructor(roomId: string, peers: NodeInfo[], last_block_height: i64, last_block_hash: Base64String) {
        this.roomId = roomId
        this.peers = peers
        this.last_block_height = last_block_height
        this.last_block_hash = last_block_hash
    }
}

@json
export class ChatMessage {
    roomId: string
    message: string
    timestamp: Date // timestamp we received it
    sender: Bech32String
    constructor(roomId: string, message: string, timestamp: Date, sender: Bech32String) {
        this.roomId = roomId
        this.message = message
        this.timestamp = timestamp
        this.sender = sender
    }
}

@json
export class MsgJoinRoom {
    roomId: string
    constructor(roomId: string) {
        this.roomId = roomId
    }
}

@json
export class MsgSendMessage {
    roomId: string
    message: string
    constructor(roomId: string, message: string) {
        this.roomId = roomId
        this.message = message
    }
}

@json
export class  MsgReceiveMessage {
    roomId: string
    message: string
    timestamp: Date // timestamp we received it
    sender: NetworkNode
    constructor(roomId: string, message: string, timestamp: Date, sender: NetworkNode) {
        this.roomId = roomId
        this.message = message
        this.timestamp = timestamp
        this.sender = sender
    }
}

@json
export class QueryGetRooms {}

@json
export class QueryGetMessages {
    roomId: string
    pagination: PageRequest | null
    constructor(roomId: string, pagination: PageRequest | null) {
        this.roomId = roomId
        this.pagination = pagination
    }
}

@json
export class QueryGetMessage {
    roomId: string
    index: i64
    constructor(roomId: string, index: i64) {
        this.roomId = roomId
        this.index = index
    }
}

@json
export class QueryGetBlocks {
    roomId: string
    pagination: PageRequest
    constructor(roomId: string, pagination: PageRequest) {
        this.roomId = roomId
        this.pagination = pagination;
    }
}

@json
export class QueryGetBlock {
    roomId: string
    index: i64
    constructor(roomId: string, index: i64) {
        this.roomId = roomId
        this.index = index
    }
}

@json
export class ChatHeader {
    height: i64
    time: Date
    parent_hash: Base64String
    data_hash: Base64String // transactions
    constructor(height: i64, time: Date, parent_hash: Base64String, data_hash: Base64String) {
        this.height = height
        this.time = time
        this.parent_hash = parent_hash
        this.data_hash = data_hash
    }
}

@json
export class ChatBlock {
    header: ChatHeader
    data: Base64String // transaction
    constructor(header: ChatHeader, data: Base64String) {
        this.header = header
        this.data = data
    }
}
