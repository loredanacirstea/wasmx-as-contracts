import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Block, MsgNewTransaction, MsgNewTransactionResponse } from "./types";
import { LoggerError } from "./utils";
import { buildNewBlock } from "./block";
import { chainId, setBlock } from "./storage";

export function newTransaction(req: MsgNewTransaction): ArrayBuffer {
    const block = buildNewBlock([req.transaction], chainId);
    const data = JSON.stringify<Block>(block)
    setBlock(data, block.hash, block.data_hashes);

    return String.UTF8.encode(JSON.stringify<MsgNewTransactionResponse>(new MsgNewTransactionResponse(block.data_hashes[0], block.hash)))
}
