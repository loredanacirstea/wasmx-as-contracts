import { JSON } from "json-as/assembly";
import { encode as base64encode } from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmxt from 'wasmx-env/assembly/wasmx_types';
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { ChatBlock, ChatHeader, ChatMessage, ChatRoom, MsgJoinRoom, MsgReceiveMessage, MsgSendMessage, NodeInfo, PROTOCOL_ID, QueryGetBlock, QueryGetBlocks, QueryGetMessage, QueryGetMessages, QueryGetRooms } from "./types";
import { EMPTY_HASH, getBlock, getBlocks, getMasterHash, getRoom, getRooms, setBlock, setRoom } from "./storage";
import { LoggerInfo, revert } from "./utils";
import { Base64String, TxMessage } from "wasmx-env/assembly/types";
import { buildBlock, getBlockHeaderHash, getChatMessageFromBlock } from "./block";
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { CallDataInternal } from "./calldata";

export function joinRoom(ctx: wasmxt.MsgExecuteContract, tx: Base64String, req: MsgJoinRoom): void {
    const room = getRoom(req.roomId)
    if (room != null) {
        revert(`room already exists with id: ${req.roomId}`)
    }
    const node = p2pw.GetNodeInfo();
    const nodeInfo = new NodeInfo(ctx.sender, node);
    const newroom = new ChatRoom(req.roomId, [nodeInfo], 0, getEmptyHash());
    setRoom(newroom);
    const protocolId = getProtocolId()
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, req.roomId))
    LoggerInfo("connected to chat room:", ["id", req.roomId])
}

export function GetRooms(): ArrayBuffer {
    const rooms = getRooms("", "")
    return String.UTF8.encode(JSON.stringify<ChatRoom[]>(rooms))
}

export function GetMessages(req: QueryGetMessages): ArrayBuffer {
    let start: i64 = 1;
    let end: i64 = 0;
    const pag = req.pagination
    if (pag != null) {
        start = i64(pag.offset)
        end = i64(pag.limit)
    }
    const values = getBlocks(req.roomId, start, end)
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < values.length; i++) {
        const msg = getChatMessageFromBlock(values[i]);
        if (msg) {
            msgs.push(msg);
        }
    }
    return String.UTF8.encode(JSON.stringify<ChatMessage[]>(msgs))
}

export function GetMessage(req: QueryGetMessage): ArrayBuffer {
    const value = getBlock(req.roomId, req.index)
    if (!value) return new ArrayBuffer(0);
    const msg = getChatMessageFromBlock(value);
    if (!msg) return new ArrayBuffer(0);
    return String.UTF8.encode(JSON.stringify<ChatMessage>(msg))
}

export function GetBlocks(req: QueryGetBlocks): ArrayBuffer {
    let start: i64 = 1;
    let end: i64 = 0;
    const pag = req.pagination
    if (pag != null) {
        start = i64(pag.offset)
        end = i64(pag.limit)
    }
    const values = getBlocks(req.roomId, start, end)
    return String.UTF8.encode(JSON.stringify<ChatBlock[]>(values))
}

export function GetBlock(req: QueryGetBlock): ArrayBuffer {
    const value = getBlock(req.roomId, req.index)
    if (!value) return new ArrayBuffer(0);
    return String.UTF8.encode(JSON.stringify<ChatBlock>(value))
}

export function start(): void {
    const rooms = getRooms("", "")
    const roomIds = new Array<string>(rooms.length)
    const protocolId = getProtocolId()
    for (let i = 0; i < rooms.length; i++) {
        roomIds[i] = rooms[i].roomId
        p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, rooms[i].roomId))
    }
    LoggerInfo("connected to chat rooms:", ["rooms", roomIds.join(",")])
}

export function sendMessage(ctx: wasmxt.MsgExecuteContract, tx: Base64String, req: MsgSendMessage): void {
    const room = getRoom(req.roomId)
    if (!room) return;

    const block = buildBlock(room, tx)
    appendBlock(room, block)

    const blockstr = JSON.stringify<ChatBlock>(block);

    const contract = wasmxw.getAddress()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, blockstr, contract, req.roomId))
}

export function receiveMessage(ctx: wasmxt.MsgExecuteContract, peerblock: ChatBlock, req: MsgReceiveMessage, calld: CallDataInternal): void {
    const room = getRoom(req.roomId)
    if (!room) return;

    const newblock = buildBlock(room, peerblock.data)
    // TODO do we take the original timestamp or our current timestamp?
    // TODO include main chain last block hash
    // newblock.header.time = peerblock.header.time

    appendBlock(room, newblock)
}

export function appendBlock(room: ChatRoom, block: ChatBlock): void {
    room.last_block_height = block.header.height
    room.last_block_hash = getBlockHeaderHash(block.header)
    // TODO masterhash
    // let masterHash = getMasterHash()
    // masterHash = wasmxw.MerkleHash([masterHash]);
    setRoom(room)
    setBlock(room.roomId, block.header.height, block)
}

function getEmptyHash(): Base64String {
    return base64encode(Uint8Array.wrap(String.UTF8.encode(EMPTY_HASH)))
}

export function getProtocolId(): string {
    return PROTOCOL_ID + "_" + wasmxw.getAddress()
}
