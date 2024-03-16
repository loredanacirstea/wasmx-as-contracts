import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { base64ToString, parseInt64 } from "wasmx-utils/assembly/utils";
import { ChatMessage, ChatRoom } from "./types";

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
    return MSG_KEY + roomId + "_" + index.toString()
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
    const values = wasmxw.sloadRangeStringKeys(getMesssageKey(roomId, startIndex), getMesssageKey(roomId, endIndex), false)
    const msgs: ChatMessage[] = new Array<ChatMessage>(values.length);
    for (let i = 0; i < values.length; i++) {
        msgs[i] = JSON.parse<ChatMessage>(base64ToString(values[i]))
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
    const values = wasmxw.sloadRangeStringKeys(startId, endId, false)
    const rooms: ChatRoom[] = new Array<ChatRoom>(values.length);
    for (let i = 0; i < values.length; i++) {
        rooms[i] = JSON.parse<ChatRoom>(base64ToString(values[i]))
    }
    return rooms
}
