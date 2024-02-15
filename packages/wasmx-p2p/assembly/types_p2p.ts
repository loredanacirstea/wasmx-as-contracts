import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";


// @ts-ignore
@serializable
export class Peer {
  id: string // base64
  host: string
  port: string
  constructor(id: string, host: string, port: string) {
    this.id = id
    this.host = host
    this.port = port
  }
}

// @ts-ignore
@serializable
export class MsgStart {
  protocolId: string
  pk: Base64String
  node: Peer
  peers: Peer[]
  constructor(privateKey: Base64String, protocolId: string, node: Peer, peers: Peer[]) {
    this.pk = privateKey
    this.protocolId = protocolId
    this.node = node
    this.peers = peers
  }
}

// @ts-ignore
@serializable
export class MessageReceivedFromPeer {
    data: Base64String
    peer: Peer
    constructor(data: Base64String, peer: Peer) {
      this.data = data
      this.peer = peer
    }
}
