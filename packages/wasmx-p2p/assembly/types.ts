import { JSON } from "json-as";
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';

export const MODULE_NAME = "p2p"


@json
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

@json
export class NodeInfo {
    // validator operator address taken from node identifier (memo)
    address: Bech32String
    node: NetworkNode
    outofsync: bool
    constructor(address: Bech32String, node: NetworkNode, outofsync: bool) {
        this.address = address
        this.node = node
        this.outofsync = outofsync
    }
}

@json
export class StartNodeRequest {
    port: string
    protocolId: string
    constructor(port: string, protocolId: string) {
        this.port = port
        this.protocolId = protocolId
    }
}

@json
export class WasmxResponse {
    data: string
    error: string
    constructor(data: string, error: string) {
        this.data = data
        this.error = error
    }
}

@json
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

@json
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

@json
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

@json
export class ConnectPeerRequest {
    protocolId: string
    peer: string
    constructor( protocolId: string, peer: string) {
        this.protocolId = protocolId
        this.peer = peer
    }
}

@json
export class ConnectPeerResponse {}

@json
export class DisconnectPeerRequest {
    protocolId: string
    peer: string
    constructor( protocolId: string, peer: string) {
        this.protocolId = protocolId
        this.peer = peer
    }
}

@json
export class DisconnectPeerResponse {}

@json
export class ConnectChatRoomRequest {
    protocolId: string
    topic: string
    constructor(protocolId: string, topic: string) {
        this.protocolId = protocolId
        this.topic = topic
    }
}

@json
export class ConnectChatRoomResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
export class DisconnectChatRoomRequest {
    protocolId: string
    topic: string
    constructor(protocolId: string, topic: string) {
        this.protocolId = protocolId
        this.topic = topic
    }
}

@json
export class DisconnectChatRoomResponse {}

@json
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

@json
export class SendMessageToChatRoomResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
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

@json
export class StartStateSyncReqRequest {
    start_height: i64
    trust_height: i64
    trust_hash: Base64String
    peer_address: string
    protocol_id: string
    peers: string[]
    current_node_id: i32
    constructor(
        start_height: i64,
        trust_height: i64,
        trust_hash: Base64String,
        peer_address: string,
        protocolId: string,
        peers: string[],
        current_node_id: i32,
    ) {
        this.start_height = start_height
        this.trust_height = trust_height
        this.trust_hash = trust_hash
        this.peer_address = peer_address
        this.protocol_id = protocolId
        this.peers = peers
        this.current_node_id = current_node_id
    }
}

@json
export class StartStateSyncReqResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error
    }
}

@json
export class StartStateSyncResRequest {
    peer_address: string
    protocol_id: string
    constructor(
        peer_address: string,
        protocolId: string
    ) {
        this.peer_address = peer_address
        this.protocol_id = protocolId
    }
}

@json
export class StartStateSyncResResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error
    }
}

@json
export class NodeInfoResponse {
    node_info: NodeInfo | null = null
    error: string = ""
}
