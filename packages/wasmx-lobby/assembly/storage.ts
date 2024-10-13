import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { CurrentChainSetup, MsgNewChainGenesisData, MsgNewChainRequest, MsgNewChainResponse, Params } from "./types";
import { ChainId } from "wasmx-consensus/assembly/types_multichain";
import { BigInt } from "wasmx-env/assembly/bn";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import { INIT_CHAIN_INDEX, INIT_FORK_INDEX, INIT_LEVEL, KEY_CURRENT_LEVEL, KEY_DERC20_CODE_ID, KEY_ENABLE_EID_CHECK, KEY_ERC20_CODE_ID, KEY_INITIAL_BALANCE, KEY_MIN_VALIDATORS_COUNT } from "./config";
import { parseInt32, parseInt64 } from "../../wasmx-utils/assembly/utils";

export const TEMP_NEW_CHAIN_REQUESTS = "newchain_requests"
export const TEMP_NEW_CHAIN_RESPONSE = "newchain_response"
export const SUBCHAIN_DATA = "subchain_data"
export const SETUP_DATA = "setup_data"
export const LAST_CHAIN_ID = "chainid_last"

export function getNewChainRequests(): MsgNewChainRequest[] {
    const value = wasmxw.sload(TEMP_NEW_CHAIN_REQUESTS);
    if (value == "") return [];
    return JSON.parse<MsgNewChainRequest[]>(value)
}

export function addNewChainRequests(data: MsgNewChainRequest): void {
    const req = getNewChainRequests()
    let exists = false;
    for (let i = 0; i < req.length; i++) {
        if (req[i].validator.consensusPublicKey == data.validator.consensusPublicKey) {
            exists = true;
        }
    }
    if (exists) return;

    req.push(data);
    return wasmxw.sstore(TEMP_NEW_CHAIN_REQUESTS, JSON.stringify<MsgNewChainRequest[]>(req));
}

export function setNewChainRequests(data: MsgNewChainRequest[]): void {
    return wasmxw.sstore(TEMP_NEW_CHAIN_REQUESTS, JSON.stringify<MsgNewChainRequest[]>(data));
}

export function getNewChainResponse(): MsgNewChainResponse | null {
    const value = wasmxw.sload(TEMP_NEW_CHAIN_RESPONSE);
    if (value == "") return null;
    return JSON.parse<MsgNewChainResponse>(value)
}

export function setNewChainResponse(data: MsgNewChainResponse): void {
    return wasmxw.sstore(TEMP_NEW_CHAIN_RESPONSE, JSON.stringify<MsgNewChainResponse>(data));
}

export function getChainSetupData(): CurrentChainSetup | null {
    const value = wasmxw.sload(SETUP_DATA);
    if (value == "") return null;
    return JSON.parse<CurrentChainSetup>(value)
}

export function setChainSetupData(data: CurrentChainSetup): void {
    return wasmxw.sstore(SETUP_DATA, JSON.stringify<CurrentChainSetup>(data));
}

export function getSubChainData(): MsgNewChainGenesisData | null {
    const value = wasmxw.sload(SUBCHAIN_DATA);
    if (value == "") return null;
    return JSON.parse<MsgNewChainGenesisData>(value)
}

export function setSubChainData(data: MsgNewChainGenesisData): void {
    return wasmxw.sstore(SUBCHAIN_DATA, JSON.stringify<MsgNewChainGenesisData>(data));
}

export function getChainIdLast(): ChainId {
    const value = wasmxw.sload(LAST_CHAIN_ID);
    if (value == "") return new ChainId("", "", getCurrentLevel(), INIT_CHAIN_INDEX, INIT_FORK_INDEX);
    return JSON.parse<ChainId>(value)
}

export function setChainIdLast(data: ChainId): void {
    return wasmxw.sstore(LAST_CHAIN_ID, JSON.stringify<ChainId>(data));
}

export function getMinValidatorsCount(): i32 {
    return parseInt32(fsm.getContextValue(KEY_MIN_VALIDATORS_COUNT))
}

export function getCurrentLevel(): i32 {
    return parseInt32(fsm.getContextValue(KEY_CURRENT_LEVEL))
}

export function getNextLevel(): i32 {
    return getCurrentLevel() + 1
}

export function getParams(): Params {
    const currentLevel = getCurrentLevel()
    const minValidatorCount = getMinValidatorsCount()
    const erc20CodeId = parseInt64(fsm.getContextValue(KEY_ERC20_CODE_ID))
    const derc20CodeId = parseInt64(fsm.getContextValue(KEY_DERC20_CODE_ID))
    const initialBalance = BigInt.fromString(fsm.getContextValue(KEY_INITIAL_BALANCE))
    const enableEidCheckStr = fsm.getContextValue(KEY_ENABLE_EID_CHECK)
    let enableEidCheck = false
    if (enableEidCheckStr == "true") {
        enableEidCheck = true
    }

    return new Params(currentLevel, minValidatorCount, enableEidCheck, erc20CodeId, derc20CodeId, initialBalance)
}
