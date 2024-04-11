import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import * as timetypes from "wasmx-time/assembly/types";
import { Block, Header } from "./types";
import { getTimeChainLastBlock, setTimeChainEntropy } from "./time";
import { getLastBlockByIndex, setBlock } from "./storage";

// TODO use wasmx-blocks compatible system

export function buildNewBlock(transactions: Base64String[], chain_id: string): Block {
    const txhashes = new Array<Base64String>(transactions.length)
    const datahashdata = new Uint8Array(32 * transactions.length);
    for (let i = 0; i < transactions.length; i++) {
        const txhashbz = sha256.digestWrap(base64.decode(transactions[i]).buffer)
        const txhash = base64.encode(Uint8Array.wrap(txhashbz))
        txhashes[i] = txhash;
        datahashdata.set(Uint8Array.wrap(txhashbz), i*32)
    }
    const datahash = sha256.digestWrap(datahashdata.buffer);
    const datahashstr = base64.encode(Uint8Array.wrap(datahash))

    setTimeChainEntropy(datahashstr);
    const timeblock = getTimeChainLastBlock(datahashstr);
    const lastBlock = getLastBlockByIndex();
    const block = getNewBlock(timeblock, lastBlock, chain_id, transactions, txhashes, datahashstr)
    return block;
}

export function getNewBlock(timeblock: timetypes.Block, prevBlock: Block, chain_id: string, transactions: Base64String[], txhashes: Base64String[], datahashstr: Base64String): Block {
    const newindex = prevBlock.header.index + 1
    const header = new Header(
        newindex,
        timeblock.header.time,
        prevBlock.hash,
        chain_id,
        datahashstr,
    )
    const hash = getHeaderHash(header);
    const block = new Block(transactions, header, hash, txhashes)
    return block;
}

export function getHeaderHash(header: Header): Base64String {
    const part1 = Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))
    const part2 = base64.decode(header.lastBlockHash)
    const part3 = base64.decode(header.dataHash)
    const data = new Uint8Array(part1.length + part2.length + part3.length)
    data.set(part1)
    data.set(part2, part1.length)
    data.set(part3, part2.length)

    const hash = sha256.digestWrap(data.buffer)
    return base64.encode(Uint8Array.wrap(hash))
}

export function getEmtpyBlock(chain_id: string): Block {
    const header = new Header(
        1,
        new Date(Date.now()),
        "",
        chain_id,
        "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA==", // zeroed out entropy
    )
    const hash = getHeaderHash(header);
    const block = new Block([], header, hash, [])
    return block;
}
