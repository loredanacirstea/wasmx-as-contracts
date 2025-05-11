import { JSON } from "json-as";
import { encode as base64encode } from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { base64ToString, parseInt64 } from "wasmx-utils/assembly/utils";
import { ChatBlock, ChatRoom } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";
import { Base64String } from "wasmx-env/assembly/types";

export const ROOM_COUNT_KEY = "room_count"
export const ROOM_KEY = "rooms_"
export const BLOCK_KEY = "blocks_"
export const MASTER_HASH_KEY = "masterhash_"

export const EMPTY_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

export function getRoomCountKey(): string {
    return ROOM_COUNT_KEY;
}

export function getRoomKey(roomId: string): string {
    return ROOM_KEY + roomId;
}

export function getBlockKey(roomId: string, index: i64): string {
    return BLOCK_KEY + roomId + "_" + BigInt.fromU64(u64(index)).toString(16, 8, false, false)
}

export function getMasterHashKey(): string {
    return MASTER_HASH_KEY;
}

export function setMasterHash(value: Base64String): void {
    wasmxw.sstore(getMasterHashKey(), value);
}

export function getMasterHash(): Base64String {
    const valuestr = wasmxw.sload(getMasterHashKey());
    if (valuestr === "") return base64encode(Uint8Array.wrap(String.UTF8.encode(EMPTY_HASH)));
    return valuestr
}

export function setBlock(roomId: string, index: i64, value: ChatBlock): void {
    wasmxw.sstore(getBlockKey(roomId, index), JSON.stringify<ChatBlock>(value));
}

export function getBlock(roomId: string, index: i64): ChatBlock | null {
    const valuestr = wasmxw.sload(getBlockKey(roomId, index));
    if (valuestr === "") return null;
    return JSON.parse<ChatBlock>(valuestr);
}

export function getBlocks(roomId: string, startIndex: i64, endIndex: i64): ChatBlock[] {
    const room = getRoom(roomId);
    if (!room) return [];
    if (endIndex == 0 || endIndex > room.last_block_height) {
        endIndex = room.last_block_height;
    }

    const startKey = getBlockKey(roomId, startIndex);
    const endKey = getBlockKey(roomId, endIndex + 1);
    const values = wasmxw.sloadRangeStringKeys(startKey, endKey, false)
    const msgs: ChatBlock[] = [];
    for (let i = 0; i < values.length; i++) {
        const msg = JSON.parse<ChatBlock>(base64ToString(values[i]))
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
