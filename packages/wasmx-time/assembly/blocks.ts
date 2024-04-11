import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { Block, Header } from "./types";

export function getNewBlock(time: Date, prevBlock: Block, chain_id: string, entropy: Uint8Array): Block {
    const entropystr = base64.encode(entropy);
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
    const part1 = Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))
    const part2 = base64.decode(header.lastBlockHash)
    const part3 = base64.decode(header.entropy)
    const data = new Uint8Array(part1.length + part2.length + part3.length)
    data.set(part1)
    data.set(part2, part1.length)
    data.set(part3, part2.length)

    const hash = sha256.digestWrap(data.buffer)
    return base64.encode(Uint8Array.wrap(hash))
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
