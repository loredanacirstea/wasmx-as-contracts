import { JSON } from "json-as/assembly";
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { getMempool, ifNewTransaction } from "wasmx-tendermint/assembly/actions";
import { getConsensusParams } from "wasmx-tendermint-p2p/assembly/action_utils";
import { getCurrentState } from "wasmx-tendermint-p2p/assembly/storage";
import * as cfg from "wasmx-tendermint/assembly/config";

export function ifMempoolEmpty(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const mempool = getMempool()
    return mempool.map.keys().length == 0
}

export function ifMempoolNotEmpty(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return !ifMempoolEmpty(params, event)
}

export function ifOldTransaction(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return !ifNewTransaction(params, event)
}

export function ifMempoolFull(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const mempool = getMempool()
    const cparams = getConsensusParams(0);
    let maxbytes = cparams.block.max_bytes;
    if (maxbytes == -1) {
        maxbytes = cfg.MaxBlockSizeBytes;
    }
   return mempool.isBatchFull(cparams.block.max_gas, maxbytes);
}
