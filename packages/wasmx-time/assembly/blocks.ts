import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Base64String } from "wasmx-env/assembly/types";
import { i64ToUint8ArrayBE, hex64ToBase64 } from "wasmx-utils/assembly/utils";
import { Block, Header } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

export function getNewBlock(prevBlock: Block, chain_id: string, entropy: ArrayBuffer): Block {
    const entropystr = base64.encode(Uint8Array.wrap(entropy));
    // @ts-ignore
    const newindex = prevBlock.header.index + BigInt.one()
    const header = new Header(
        newindex,
        new Date(Date.now()),
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
        base64.encode(Uint8Array.wrap(header.index.toArrayBufferBe())),
        base64.encode(Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))),
        header.lastBlockHash,
        header.entropy,
    ]
    return wasmxw.MerkleHash(data);
}

export function getEmtpyBlock(chain_id: string): Block {
    const header = new Header(
        BigInt.zero(),
        new Date(Date.now()),
        "",
        chain_id,
        "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMA==", // zeroed out entropy
    )
    const hash = getHeaderHash(header);
    const block = new Block(header, hash)
    return block;
}
