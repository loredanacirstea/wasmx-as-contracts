import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { ChatMessage, ChatRoom, MsgCreateRoom, MsgJoinRoom, MsgReceiveMessage, MsgSendMessage, PROTOCOL_ID } from "./types";
import { appendMessage, getRoom, getRooms, setRoom } from "./storage";
import { LoggerInfo, revert } from "./utils";

export function createRoom(req: MsgCreateRoom): void {
    const room = getRoom(req.roomId)
    if (room != null) {
        revert(`room already exists with id: ${req.roomId}`)
    }
    setRoom(new ChatRoom(req.roomId, []));
}

export function joinRoom(req: MsgJoinRoom): void {
    const room = getRoom(req.roomId)
    if (room != null) {
        revert(`room already exists with id: ${req.roomId}`)
    }
    setRoom(new ChatRoom(req.roomId, []));
}

export function start(): void {
    const rooms = getRooms("", "")
    const roomIds = new Array<string>(rooms.length)
    const protocolId = wasmxw.getAddress()
    for (let i = 0; i < rooms.length; i++) {
        roomIds[i] = rooms[i].roomId
        p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, rooms[i].roomId))
    }
    LoggerInfo("connected to rooms:", ["rooms", roomIds.join(",")])
}

export function sendMessage(req: MsgSendMessage): void {
    const node = p2pw.GetNodeInfo();
    const msg = new ChatMessage(req.roomId, req.message, new Date(Date.now()), node)
    const contract = wasmxw.getAddress()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, req.message, PROTOCOL_ID, req.roomId))
    appendMessage(req.roomId, msg)
}

export function receiveMessage(req: MsgReceiveMessage): void {
    appendMessage(req.roomId, new ChatMessage(req.roomId, req.message, req.timestamp, req.sender))
}
