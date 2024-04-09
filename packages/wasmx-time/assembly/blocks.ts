import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Base64String } from "wasmx-env/assembly/types";
import { i64ToUint8ArrayBE, hex64ToBase64 } from "wasmx-utils/assembly/utils";
import { Block, Header } from "./types";

export function getNewBlock(time: Date, prevBlock: Block, chain_id: string, entropy: ArrayBuffer): Block {
    const entropystr = base64.encode(Uint8Array.wrap(entropy));
    const newindex = prevBlock.header.index + 1
    const header = new Header(
        newindex,
        time,
        prevBlock.hash,
        chain_id,
        entropystr,
    )
    const hash = getHeaderHash(header);
    const block = new Block(header, hash)
    return block;
}

export function getHeaderHash(header: Header): Base64String {
    const data = [
        base64.encode(Uint8Array.wrap(String.UTF8.encode(header.chain_id))),
        base64.encode(i64ToUint8ArrayBE(header.index)),
        base64.encode(Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))),
        header.lastBlockHash,
        header.entropy,
    ]
    return wasmxw.MerkleHash(data);
}

export function getEmtpyBlock(chain_id: string): Block {
    const header = new Header(
        0,
        new Date(Date.now()),
        "",
        chain_id,
        "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA==", // zeroed out entropy
    )
    const hash = getHeaderHash(header);
    const block = new Block(header, hash)
    return block;
}
