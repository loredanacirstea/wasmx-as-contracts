import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';

export const MODULE_NAME = "p2p"


// @ts-ignore
@serializable
export class NetworkNode {
  id: Base64String // p2p id
  host: string
  port: string
  ip: string // can be empty if host & port are used
  constructor(id: Base64String, host: string, port: string, ip: string) {
    this.id = id
    this.host = host
    this.port = port
    this.ip = ip
  }
}

// @ts-ignore
@serializable
export class StartNodeRequest {
    port: string
    protocolId: string
    constructor(port: string, protocolId: string) {
        this.port = port
        this.protocolId = protocolId
    }
}

// @ts-ignore
@serializable
export class WasmxResponse {
    data: string
    error: string
    constructor(data: string, error: string) {
        this.data = data
        this.error = error
    }
}

// @ts-ignore
@serializable
export class StartNodeWithIdentityRequest {
    port: string
    protocolId: string
    pk: Base64String
    constructor(port: string, protocolId: string, privateKey: Base64String) {
        this.pk = privateKey
        this.port = port
        this.protocolId = protocolId
    }
}

// @ts-ignore
@serializable
export class SendMessageRequest {
    contract: Bech32String
    msg: Base64String
    protocolId: string
    constructor(contract: Bech32String, msg: Base64String, protocolId: string) {
        this.contract = contract
        this.msg = msg
        this.protocolId = protocolId
    }
}

// @ts-ignore
@serializable
export class SendMessageToPeersRequest {
    contract: Bech32String
    sender: Bech32String
    msg: Base64String
    protocolId: string
    peers: string[]
    constructor(contract: Bech32String, sender: Bech32String, msg: Base64String, protocolId: string, peers: string[]) {
        this.contract = contract
        this.sender = sender
        this.msg = msg
        this.protocolId = protocolId
        this.peers = peers
    }
}

// @ts-ignore
@serializable
export class ConnectPeerRequest {
    protocolId: string
    peer: string
    constructor( protocolId: string, peer: string) {
        this.protocolId = protocolId
        this.peer = peer
    }
}

// @ts-ignore
@serializable
export class ConnectPeerResponse {}

// @ts-ignore
@serializable
export class ConnectChatRoomRequest {
    protocolId: string
    topic: string
    constructor(protocolId: string, topic: string) {
        this.protocolId = protocolId
        this.topic = topic
    }
}

// @ts-ignore
@serializable
export class ConnectChatRoomResponse {}

// @ts-ignore
@serializable
export class SendMessageToChatRoomRequest {
    contract: Bech32String
    sender: Bech32String
    msg: Base64String
    protocolId: string
    topic: string
    constructor(contract: Bech32String, sender: Bech32String, msg: Base64String, protocolId: string, topic: string) {
        this.contract = contract
        this.sender = sender
        this.msg = msg
        this.protocolId = protocolId
        this.topic = topic
    }
}

// @ts-ignore
@serializable
export class SendMessageToChatRoomResponse {}

// @ts-ignore
@serializable
export class P2PMessage {
    roomId: string
    message:   Base64String
    timestamp: Date
	sender: NetworkNode
    constructor(roomId: string, message: string, timestamp: Date, sender: NetworkNode) {
        this.roomId = roomId
        this.message = message
        this.timestamp = timestamp
        this.sender = sender
    }
}
