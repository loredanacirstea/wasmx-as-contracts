import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { Peer } from "wasmx-p2p/assembly/types_p2p";

export const MODULE_NAME = "raftp2p"

export const PROTOCOL_ID = "raftp2p_1"


// @ts-ignore
@serializable
export class MsgP2PReceived {
  sender: string // peerId
  msg: Base64String
  constructor(sender: string, msg: Base64String) {
    this.sender = sender
    this.msg = msg
  }
}
