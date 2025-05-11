import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import * as wasmxwrap from "wasmx-env/assembly/wasmx_wrap";
import { Base64String, Bech32String, CallRequest, CallResponse } from "wasmx-env/assembly/types";
import { parseUint8ArrayToU32BigEndian } from "wasmx-utils/assembly/utils";
import { ChainInfo, Chains } from "./types";
import {
    getConfig,
    setConfig,
    getChains,
    setChains,
    getChainInfo,
    setChainInfo,
} from './storage';
import { revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";

export function registerChain(chainId: string, lightClientAddress: Bech32String, validatorAddress: Bech32String) {
    // store chainArray
    const chains = getChains();
    if (!chains.chainsIds.includes(chainId)) {
        chains.chainsIds.push(chainId);
        setChains(chains);
    }
    setChainInfo(chainId, new ChainInfo([validatorAddress], lightClientAddress));
}

export function registerValidator(chainId: string, validatorAddress: Bech32String) {
    const value = getChainInfo(chainId);
    if (value == null) {
        revert(`chain ${chainId} not registered`);
    }
    const chainInfo: ChainInfo = value!;
    if (!chainInfo.validators.includes(validatorAddress)) {
        chainInfo.validators.push(validatorAddress);
    }
    setChainInfo(chainId, chainInfo);
}

export function addHeader(chainId: string, header: Base64String, validators: Bech32String[], signatures: Base64String[]) {
    const config = getConfig();
    const value = getChainInfo(chainId);
    if (value == null) {
        revert(`chain ${chainId} not registered`);
    }
    const chainInfo: ChainInfo = value!;

    // check number of signatures is = number of validators
    if (signatures.length != validators.length) {
        revert(`signatures and validators count mismatch`);
    }

    // check number of signatures is > MIN_VALIDATORS
    if (signatures.length < config.min_validators) {
        revert(`not enough header signatures for chain: ${chainId} (< min)`);
    }

    // check number of signatures is > majority
    if (signatures.length < getMajority(chainInfo.validators.length)) {
        revert(`not enough header signatures for chain: ${chainId} (< majority)`);
    }

    // check signatures
    for (let i = 0; i < signatures.length; i++) {
        if (!chainInfo.validators.includes(validators[i])) {
            revert(`validator is not registered: ${validators[i]}`)
        }
        const isSigner = verifySignature(header, validators[i], signatures[i]);
        if (!isSigner) {
            revert(`signature verification failed for ${validators[i]}`);
        }
    }
    const calldata = `{"addHeader":{"header":"${header}"}}`
    const resp = callLightClient(chainInfo.lightClient, calldata, false);
    if (resp.success > 0) {
        return revert("light client could not update header");
    }
}

export function getNextProposer(chainId: string, headerHash: string): Bech32String {
    const value = getChainInfo(chainId);
    if (value == null) {
        revert(`chain ${chainId} not registered`);
    }
    const chainInfo: ChainInfo = value!;
    const validators = chainInfo.validators;
    const index = getNextProposerIndex(validators.length, headerHash)
    return validators[index];
}

function getNextProposerIndex(count: i32, headerHash: string): i32 {
    const votingPower = 50;
    const totalVotingPower = votingPower * count;
    const hashbz = decodeBase64(headerHash);
    const normalizer = Math.pow(2, 32);
    const hashslice = Uint8Array.wrap(hashbz.buffer, 0, 4)
    const part = parseUint8ArrayToU32BigEndian(hashslice)
    console.debug("-getNextProposer part: " + part.toString())
    const valf = f64(part) / f64(normalizer) * f64(totalVotingPower);
    const val = i64(valf);
    let closestVal: i32 = -1;
    let aggregatedVP: i64[] = new Array<i64>(count);
    let lastSumVP: i64 = 0;
    for (let i = 0; i < count; i++) {
        aggregatedVP[i] = votingPower + lastSumVP;
        lastSumVP = aggregatedVP[i];
        if (aggregatedVP[i] >= val) {
            if (closestVal == -1) {
                closestVal = i;
            } else if (aggregatedVP[i] < aggregatedVP[closestVal]) {
                closestVal = i;
            }
        }
    }
    return closestVal;
}

function getMajority(value: i32): i32 {
    return i32(f32(value) / f32(2)) + 1;
}

function callLightClient(lcAddress: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(lcAddress, calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxwrap.call(req);
    if (resp.success == 0) {
        resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    }
    return resp;
}

// TODO
function verifySignature(header: Base64String, validatorAddress: Bech32String, signature: string): boolean {
    const acc = wasmxwrap.getAccount(validatorAddress);
    return wasmxwrap.ed25519Verify(acc.pubKey, signature, header);
}
