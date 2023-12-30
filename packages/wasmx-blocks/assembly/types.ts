import { JSON } from "json-as/assembly";

export type HexString = string;
export type Base64String = string;
export type Bech32String = string;


// @ts-ignore
@serializable
export class BlockEntry {
    index: i64;
    readerContract: Base64String
    writerContract: Base64String
    data: string; // base64-encoded RequestFinalizeBlock
    header: string // base64-encoded Header
    commit: string // base64-encoded BlockCommit
    result: string // base64-encoded BlockFinalizeResult - same as ResponseFinalizeBlock
    constructor(index: i64, readerContract: Bech32String, writerContract: Bech32String, data: string, header: string, commit: string, result: string) {
        this.index = index;
        this.readerContract = readerContract;
        this.writerContract = writerContract;
        this.data = data;
        this.header = header;
        this.commit = commit;
        this.result = result;
    }
}

// @ts-ignore
@serializable
export class IndexedTransaction {
    height: i64
	index: u32
    constructor(height: i64, index: u32) {
        this.height = height;
        this.index = index;
    }
}
