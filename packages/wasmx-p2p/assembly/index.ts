// this is used for testing
import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { Base64String } from "wasmx-env/assembly/types";
import { revert } from "./utils";
import * as p2pw from "./p2p_wrap";
import { ConnectChatRoomRequest, ConnectPeerRequest, SendMessageRequest, SendMessageToChatRoomRequest, SendMessageToPeersRequest, StartNodeWithIdentityRequest } from "./types";
import { MessageReceivedFromPeer, Peer } from "./types_p2p";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();
  if (calld.start != null) {
    start(calld.start!);
  } else if (calld.chat != null) {
    chat(calld.chat!);
  } else {
    revert(`invalid function call`);
  }
  wasmx.finish(result);
}

// @ts-ignore
@serializable
class MsgStart {
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
export class MsgChat {
  protocolId: string
  pk: Base64String
  node: Peer
  roomId: string
  constructor(privateKey: Base64String, protocolId: string, node: Peer, roomId: string) {
    this.pk = privateKey
    this.protocolId = protocolId
    this.node = node
    this.roomId = roomId
  }
}

export function peerMessage(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getMessageReceivedFromPeer()
  wasmx.finish(result);
}

function start(req: MsgStart): void {
  const resp = p2pw.StartNodeWithIdentity(new StartNodeWithIdentityRequest(req.node.port, req.protocolId, req.pk))

  const peers: string[] = []
  for (let i = 0; i < req.peers.length; i++) {
    const peer = `/ip4/${req.peers[i].host}/tcp/${req.peers[i].port}/ipfs/${req.peers[i].id}`
    peers.push(peer)
    p2pw.ConnectPeer(new ConnectPeerRequest(req.protocolId, peer))
  }

  if (req.peers.length > 0) {
    p2pw.SendMessage(new SendMessageRequest("", "helloo", req.protocolId))

    p2pw.SendMessageToPeers(new SendMessageToPeersRequest("", "helloo", req.protocolId, peers))
  }
}

function chat(req: MsgChat): void {
  const resp = p2pw.StartNodeWithIdentity(new StartNodeWithIdentityRequest(req.node.port, req.protocolId, req.pk))
  p2pw.ConnectChatRoom(new ConnectChatRoomRequest(req.protocolId, req.roomId))

  p2pw.SendMessageToChatRoom(new SendMessageToChatRoomRequest("", `hello to chat room from ${req.node.port} !`, req.protocolId, req.roomId));
}

// @ts-ignore
@serializable
export class CallData {
    start: MsgStart | null = null;
    chat: MsgChat | null = null;
}

function getCallDataWrap(): CallData {
  const calldraw = wasmx.getCallData();
  const calldstr = String.UTF8.decode(calldraw)
  return JSON.parse<CallData>(calldstr);
}

function getMessageReceivedFromPeer(): MessageReceivedFromPeer {
  const calldraw = wasmx.getCallData();
  return JSON.parse<MessageReceivedFromPeer>(String.UTF8.decode(calldraw));
}
