import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { base64ToString, parseInt64 } from "wasmx-utils/assembly/utils";
import { ChatMessage, ChatRoom } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

const ROOM_COUNT_KEY = "room_count"
const ROOM_KEY = "rooms_"
const MSG_COUNT_KEY = "message_count_"
const MSG_KEY = "messages_"

export function getRoomCountKey(): string {
    return ROOM_COUNT_KEY;
}

export function getRoomKey(roomId: string): string {
    return ROOM_KEY + roomId;
}

export function getMesssageCountKey(roomId: string): string {
    return MSG_COUNT_KEY + roomId;
}

export function getMesssageKey(roomId: string, index: i64): string {
    return MSG_KEY + roomId + "_" + BigInt.fromU64(u64(index)).toString(16, 8, false, false)
}

export function getMessageCount(roomId: string): i64 {
    const value = wasmxw.sload(getMesssageCountKey(roomId))
    if (value == "") return 0;
    return parseInt64(value);
}

export function setMessageCount(roomId: string, value: i64): void {
    wasmxw.sstore(getMesssageCountKey(roomId), value.toString())
}

export function setMessage(roomId: string, index: i64, message: ChatMessage): void {
    wasmxw.sstore(getMesssageKey(roomId, index), JSON.stringify<ChatMessage>(message));
}

export function getMessage(roomId: string, index: i64): ChatMessage | null {
    const valuestr = wasmxw.sload(getMesssageKey(roomId, index));
    if (valuestr === "") return null;
    return JSON.parse<ChatMessage>(valuestr);
}

export function appendMessage(roomId: string, message: ChatMessage): void {
    const index = getMessageCount(roomId)
    wasmxw.sstore(getMesssageKey(roomId, index), JSON.stringify<ChatMessage>(message));
    setMessageCount(roomId, index+1);
}

export function getMessages(roomId: string, startIndex: i64, endIndex: i64): ChatMessage[] {
    const startKey = getMesssageKey(roomId, startIndex);
    if (endIndex == 0) endIndex = getMessageCount(roomId);
    const endKey = getMesssageKey(roomId, endIndex);
    const values = wasmxw.sloadRangeStringKeys(startKey, endKey, false)
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < values.length; i++) {
        const msg = JSON.parse<ChatMessage>(base64ToString(values[i]))
        msgs.push(msg);
    }
    return msgs
}

export function getRoomCount(): i64 {
    const value = wasmxw.sload(ROOM_COUNT_KEY)
    if (value == "") return 0;
    return parseInt64(value);
}

export function setRoomCount(value: i64): void {
    wasmxw.sstore(ROOM_COUNT_KEY, value.toString())
}

export function setRoom(room: ChatRoom): void {
    wasmxw.sstore(getRoomKey(room.roomId), JSON.stringify<ChatRoom>(room));
}

export function getRoom(roomId: string): ChatRoom | null {
    const valuestr = wasmxw.sload(getRoomKey(roomId));
    if (valuestr === "") return null;
    return JSON.parse<ChatRoom>(valuestr);
}

export function getRooms(startId: string, endId: string): ChatRoom[] {
    let startKey = getRoomKey(startId);
    let endKey = getRoomKey(endId);
    if (endId == "") endKey = "";
    const values = wasmxw.sloadRangeStringKeys(startKey, endKey, false)
    const rooms: ChatRoom[] = new Array<ChatRoom>(values.length);
    for (let i = 0; i < values.length; i++) {
        rooms[i] = JSON.parse<ChatRoom>(base64ToString(values[i]))
    }
    return rooms
}
