import { JSON } from "json-as";
import * as base64 from "as-base64/assembly"
import * as timetypes from "wasmx-time/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { LoggerError, revert } from "./utils";
import { Base64String } from "wasmx-env/assembly/types";

export function setTimeChainEntropy(entropy: Base64String): void {
    const resp = wasmxw.writeToBackgroundProcess("time", "entropyArray", entropy)
    if (resp.error != "") {
        LoggerError(`could not update entropy: ${resp.error}`, [])
    }
}

export function getTimeChainBlocks(): timetypes.Block[] {
    const resp = wasmxw.readFromBackgroundProcess("time", "lastBlocks", "lastBlocksLength")
    if (resp.error != "") {
        revert(`could not get last time blocks: ${resp.error}`)
    }
    const data = String.UTF8.decode(base64.decode(resp.data).buffer)
    return JSON.parse<timetypes.Block[]>(data)
}

export function getTimeChainLastBlock(entropy: Base64String): timetypes.Block {
    let block = getTimeChainLastBlock_()
    if (block.header.entropy == entropy) {
        return block;
    }
    while(true) {
        const block_ = getTimeChainLastBlock_()
        if (block_.header.entropy == entropy) {
            return block_;
        }
        if (block_.header.index > block.header.index ) {
            return block_;
        }
    }
}

export function getTimeChainLastBlock_(): timetypes.Block {
    const resp = wasmxw.readFromBackgroundProcess("time", "lastBlock", "lastBlockLength")
    if (resp.error != "") {
        revert(`could not get last time block: ${resp.error}`)
    }
    const data = String.UTF8.decode(base64.decode(resp.data).buffer)
    return JSON.parse<timetypes.Block>(data)
}
