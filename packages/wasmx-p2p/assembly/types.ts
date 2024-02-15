import { JSON } from "json-as/assembly";
import { Base64String } from 'wasmx-env/assembly/types';

export const MODULE_NAME = "p2p"

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
    msg: Base64String
    constructor(msg: Base64String) {
        this.msg = msg
    }
}

// @ts-ignore
@serializable
export class SendMessageToPeersRequest {
    msg: Base64String
    protocolId: string
    peers: string[]
    constructor(msg: Base64String, protocolId: string, peers: string[]) {
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
export class SubscribeRequest {
    topic: Base64String
    constructor(topic: Base64String) {
        this.topic = topic
    }
}
