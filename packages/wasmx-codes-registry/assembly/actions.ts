import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import * as wasmxcoret from "wasmx-env-core/assembly/types";
import { ContractInfo, ContractStorageTypeByString } from "wasmx-env/assembly/types";
import { GenesisState, MODULE_NAME, MsgSetCodeInfoRequest, MsgSetContractInfoRequest, MsgSetNewCodeInfoRequest, QueryCodeInfoRequest, QueryCodeInfoResponse, QueryContractInfoRequest, QueryContractInfoResponse, QueryContractInstanceRequest, QueryContractInstanceResponse, QueryLastCodeIdResponse } from "./types";
import { autoIncrementID, getCodeId, getCodeInfo, getCodeRootKey, getContractAddressRootKey, getContractInfo, getLastCodeId, storeCodeInfo, storeContractInfo } from "./storage";
import { LoggerError, LoggerInfo, revert } from "./utils";
import { Bech32String, CodeInfo, MsgSetup } from "wasmx-env/assembly/types";
import { callContract } from "wasmx-env/assembly/utils";

export function InitGenesis(req: GenesisState): ArrayBuffer {
    for (let i = 0; i < req.code_infos.length; i++) {
        const codeInfo = req.code_infos[i]
        setCodeInfo(u64(0), codeInfo);
    }
    for (let i = 0; i < req.contract_infos.length; i++) {
        const data = req.contract_infos[i]
        storeContractInfo(data.address, data.contract_info)
    }
    return new ArrayBuffer(0);
}

export function setup(req: MsgSetup): ArrayBuffer {
    const oldaddr = req.previous_address
    if (oldaddr != "") {
        setupStorageMigration(oldaddr)
    }
    return new ArrayBuffer(0)
}

export function NewCodeInfo(req: MsgSetNewCodeInfoRequest): ArrayBuffer {
    const codeId = setCodeInfo(u64(0), req.code_info);
    const data = JSON.stringify<QueryLastCodeIdResponse>(new QueryLastCodeIdResponse(codeId))
    return String.UTF8.encode(data);
}

export function SetCodeInfo(req: MsgSetCodeInfoRequest): ArrayBuffer {
    setCodeInfo(req.code_id, req.code_info);
    return new ArrayBuffer(0);
}

export function SetContractInfo(req: MsgSetContractInfoRequest): ArrayBuffer {
    storeContractInfo(req.address, req.contract_info)
    return new ArrayBuffer(0);
}

export function GetCodeInfoPrefix(): ArrayBuffer {
    return getCodeRootKey().buffer;
}

export function GetContractInfoPrefix(): ArrayBuffer {
    return getContractAddressRootKey().buffer;
}

export function GetLastCodeId(): ArrayBuffer {
    const codeId = getLastCodeId()
    const data = JSON.stringify<QueryLastCodeIdResponse>(new QueryLastCodeIdResponse(codeId))
    return String.UTF8.encode(data);
}

export function GetCodeInfo(req: QueryCodeInfoRequest): ArrayBuffer {
    const value = getCodeInfo(req.code_id)
    const data = JSON.stringify<QueryCodeInfoResponse>(new QueryCodeInfoResponse(value))
    return String.UTF8.encode(data);
}

export function GetContractInfo(req: QueryContractInfoRequest): ArrayBuffer {
    const value = getContractInfo(req.address)
    const data = JSON.stringify<QueryContractInfoResponse>(new QueryContractInfoResponse(value))
    return String.UTF8.encode(data);
}

export function GetContractInstance(req: QueryContractInstanceRequest): ArrayBuffer {
    const contractInfo = getContractInfo(req.address)
    if (contractInfo == null) {
        return String.UTF8.encode(`{}`);
    }
    const codeInfo = getCodeInfo(contractInfo.code_id)
    if (codeInfo == null) {
        revert(`code info cannot be found for address ${req.address}, code id ${contractInfo.code_id}`)
        return new ArrayBuffer(0);
    }
    const resp = new QueryContractInstanceResponse(codeInfo, contractInfo);
    const data = JSON.stringify<QueryContractInstanceResponse>(resp)
    return String.UTF8.encode(data);
}

export function setCodeInfo(codeId: u64, codeInfo: CodeInfo): u64 {
    const existentCodeId = getCodeId(codeInfo.code_hash);
    // TODO
    // // new code, but code already exists => tbd
    // if (codeId == 0 && existentCodeId > 0) {
    //     LoggerInfo(`code already exists`, ["code_hash", codeInfo.code_hash, "code_id", existentCodeId.toString()]);
    //     return existentCodeId
    // }
    // new code, store
    if (codeId == 0) {
        codeId = autoIncrementID();
        storeCodeInfo(codeId, codeInfo);
        return codeId;
    }
    // cannot set non-existent codeid
    if (existentCodeId == 0) {
        revert(`cannot replace code info for code id not found ${codeId}`);
        return 0
    }
    if (existentCodeId != codeId) {
        revert(`cannot replace code info for code id ${codeId}, expected ${existentCodeId}`);
        return 0
    }
    // replacing existing code
    storeCodeInfo(codeId, codeInfo);
    return codeId;
}

export function setupStorageMigration(addr: Bech32String): void {
    const sourceContractInfo = getContractInfoFromPrev(addr, addr);
    if (sourceContractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }
    const ourAddr = wasmxw.getAddress()
    const targetContractInfo = getContractInfoFromPrev(addr, ourAddr);
    if (targetContractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }

    const targetCodeInfo = getCodeInfoFromPrev(addr, targetContractInfo.code_id);
    if (targetCodeInfo == null) {
        revert(`cannot find code info for codeId ${targetContractInfo.code_id}`);
        return
    }

    LoggerInfo("migrating contract storage", ["from_address", addr, "to_address", ourAddr, "source storage type", sourceContractInfo.storage_type, "target storage type", targetContractInfo.storage_type])

    if (!ContractStorageTypeByString.has(sourceContractInfo.storage_type)) {
        revert(`invalid source storage type ${sourceContractInfo.storage_type}`)
    }
    if (!ContractStorageTypeByString.has(targetContractInfo.storage_type)) {
        revert(`invalid target storage type ${targetContractInfo.storage_type}`)
    }

    wasmxcorew.migrateContractStateByAddress(new wasmxcoret.MigrateContractStateByAddressRequest(addr, ourAddr, sourceContractInfo.storage_type, targetContractInfo.storage_type))

    LoggerInfo("contract storage migrated", ["address", ourAddr, "target_storage_type", targetContractInfo.storage_type]);

    // for codes, we need to update the cached information by the host!!
    const resp = wasmxcorew.updateSystemCache(new wasmxcoret.UpdateSystemCacheRequest("", ourAddr, targetContractInfo.code_id, targetCodeInfo, targetContractInfo))
    if (resp.error != "") {
        LoggerError("system cache update error for codes registry; should restart...", ["error", resp.error])
    }
}

// callding previous codes contract; make sure we use the correct types
export function getContractInfoFromPrev(prevCodesAddr: Bech32String, addr: Bech32String): ContractInfo | null {
    const addrb64 = base64.encode(Uint8Array.wrap(wasmxw.addr_canonicalize(addr)))
    const calldatastr = `{"GetContractInfo":{"address":"${addrb64}"}}`;
    const resp = callContract(prevCodesAddr, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        LoggerError(`get contract info failed`, ["error", resp.data])
        return null;
    }
    const data = JSON.parse<QueryContractInfoResponse>(resp.data)
    return data.contract_info
}


// callding previous codes contract; make sure we use the correct types
export function getCodeInfoFromPrev(prevCodesAddr: Bech32String, codeId: u64): CodeInfo | null {
    const calldatastr = `{"GetCodeInfo":{"code_id":${codeId}}}`;
    const resp = callContract(prevCodesAddr, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        LoggerError(`get code info failed`, ["error", resp.data])
        return null;
    }
    const data = JSON.parse<QueryCodeInfoResponse>(resp.data)
    return data.code_info
}
