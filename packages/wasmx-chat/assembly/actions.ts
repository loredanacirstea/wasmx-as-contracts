import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { ChatMessage, ChatRoom, MsgCreateRoom, MsgJoinRoom, MsgReceiveMessage, MsgSendMessage, NodeInfo, QueryGetMessages, QueryGetRooms } from "./types";
import { appendMessage, getMessages, getRoom, getRooms, setRoom } from "./storage";
import { LoggerInfo, revert } from "./utils";
import { TxMessage } from "wasmx-env/assembly/types";

export function joinRoom(ctx: TxMessage, req: MsgJoinRoom): void {
    const room = getRoom(req.roomId)
    if (room != null) {
        revert(`room already exists with id: ${req.roomId}`)
    }
    const node = p2pw.GetNodeInfo();
    const nodeInfo = new NodeInfo(ctx.sender, node);
    setRoom(new ChatRoom(req.roomId, [nodeInfo]));
    const protocolId = wasmxw.getAddress()
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, req.roomId))
    LoggerInfo("connected to chat room:", ["id", req.roomId])
}

export function GetRooms(): ArrayBuffer {
    const rooms = getRooms("", "")
    return String.UTF8.encode(JSON.stringify<ChatRoom[]>(rooms))
}

export function GetMessages(req: QueryGetMessages): ArrayBuffer {
    const values = getMessages(req.roomId, 0, 0)
    return String.UTF8.encode(JSON.stringify<ChatMessage[]>(values))
}

export function start(): void {
    const rooms = getRooms("", "")
    const roomIds = new Array<string>(rooms.length)
    const protocolId = wasmxw.getAddress()
    for (let i = 0; i < rooms.length; i++) {
        roomIds[i] = rooms[i].roomId
        p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, rooms[i].roomId))
    }
    LoggerInfo("connected to chat rooms:", ["rooms", roomIds.join(",")])
}

export function sendMessage(ctx: TxMessage, req: MsgSendMessage): void {
    const msg = new ChatMessage(req.roomId, req.message, new Date(Date.now()), ctx.sender)
    const contract = wasmxw.getAddress()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, req.message, contract, req.roomId))
    appendMessage(req.roomId, msg)
}

export function receiveMessage(req: MsgReceiveMessage): void {
    appendMessage(req.roomId, new ChatMessage(req.roomId, req.message, req.timestamp, wasmxw.getCaller()))
}
