import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";


@json
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

@json
export class MessageReceivedFromPeer {
    data: Base64String
    peer: Peer
    constructor(data: Base64String, peer: Peer) {
      this.data = data
      this.peer = peer
    }
}
