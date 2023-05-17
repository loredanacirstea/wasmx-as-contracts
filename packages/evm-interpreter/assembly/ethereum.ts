import { JSON } from "json-as/assembly";
import { getEnv } from './wasmx';
import { EnvJson } from './types_json';
import { BlockInfo, ChainInfo, ContractInfo, CurrentCallInfo, Env, TransactionInfo } from "./types";
import { u256 } from "as-bignum/assembly";

export function getEnvWrap(): Env {
    // const envJson = JSON.parse<EnvJson>(String.UTF8.decode(getEnv()));
    // const bytecode = arrayBufferTou8Array(getEnv());
    const bytecode: u8[] = [0x66, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3];
    return new Env(
        // new ChainInfo(
        //     envJson.chain.denom,
        //     U64.parseInt(envJson.chain.chainId, 10),
        //     envJson.chain.chainIdFull
        // ),
        // new BlockInfo(
        //     U64.parseInt(envJson.block.height, 10),
        //     U64.parseInt(envJson.block.time, 10),
        //     U64.parseInt(envJson.block.gasLimit, 10),
        //     envJson.block.hash,
        //     envJson.block.proposer,
        // ),
        // new TransactionInfo(
        //     envJson.transaction.index,
        //     u256.fromBytesBE(envJson.transaction.gasPrice),
        // ),
        new ContractInfo(
            [],
            bytecode,
            // envJson.contract.address,
            // envJson.contract.bytecode,
        ),
        // new CurrentCallInfo(
        //     envJson.currentCall.origin,
        //     envJson.currentCall.sender,
        //     u256.fromBytesBE(envJson.currentCall.funds),
        //     envJson.currentCall.isQuery,
        //     envJson.currentCall.callData,
        // ),
    )
}

function arrayBufferTou8Array(buffer: ArrayBuffer): u8[] {
    console.log(buffer.toString())
    const length = buffer.byteLength;
    const uint8View = Uint8Array.wrap(buffer);
    const u8Array: u8[] = [];

    for (let i = 0; i < length; i++) {
        u8Array[i] =  uint8View[i];
    }
    return u8Array;
}
