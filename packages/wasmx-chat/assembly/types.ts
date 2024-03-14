import { JSON } from "json-as/assembly";

export const MODULE_NAME = "chat"

// @ts-ignore
@serializable
export class MsgCreateRoom {
    roomId: string
    peers: string[]
    constructor(roomId: string, peers: string[]) {
        this.roomId = roomId
        this.peers = peers
    }
}

// @ts-ignore
@serializable
export class MsgSendMessage {
    roomId: string
    message: string
    constructor(roomId: string, message: string) {
        this.roomId = roomId
        this.message = message
    }
}
