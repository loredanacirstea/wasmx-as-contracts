import { JSON } from "json-as/assembly";
import { Bech32String } from "wasmx-env/assembly/types";
import { NetworkNode } from "wasmx-p2p/assembly/types";

export const MODULE_NAME = "chat"
export const PROTOCOL_ID = "chatv001"

// @ts-ignore
@serializable
export class NodeInfo {
    address: Bech32String
    node: NetworkNode
    constructor(address: Bech32String, node: NetworkNode) {
        this.address = address
        this.node = node
    }
}

// @ts-ignore
@serializable
export class ChatRoom {
    roomId: string
    peers: NodeInfo[]
    constructor(roomId: string, peers: NodeInfo[]) {
        this.roomId = roomId
        this.peers = peers
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class MsgCreateRoom {
    roomId: string
    constructor(roomId: string) {
        this.roomId = roomId
    }
}

// @ts-ignore
@serializable
export class MsgJoinRoom {
    roomId: string
    constructor(roomId: string) {
        this.roomId = roomId
    }
}

// @ts-ignore
@serializable
export class MsgSendMessage {
    roomId: string
    message: string
    constructor(roomId: string, message: string) {
        this.roomId = roomId
        this.message = message
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class QueryGetRooms {}

// @ts-ignore
@serializable
export class QueryGetMessages {
    roomId: string
    constructor(roomId: string) {
        this.roomId = roomId
    }
}
