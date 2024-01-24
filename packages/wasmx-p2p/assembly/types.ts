import { JSON } from "json-as/assembly";
import { Base64String } from 'wasmx-env/assembly/types';

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
    privateKey: Base64String
    constructor(port: string, protocolId: string, privateKey: Base64String) {
        this.privateKey = privateKey
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
export class ConnectPeersRequest {
    peers: string[]
    constructor(peers: string[]) {
        this.peers = peers
    }
}

// @ts-ignore
@serializable
export class ConnectPeersResponse {}

// @ts-ignore
@serializable
export class SubscribeRequest {
    topic: Base64String
    constructor(topic: Base64String) {
        this.topic = topic
    }
}
