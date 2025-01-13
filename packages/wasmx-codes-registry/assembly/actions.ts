import { JSON } from "json-as/assembly";
import { GenesisState, MODULE_NAME, MsgSetCodeInfoRequest, MsgSetContractInfoRequest, MsgSetNewCodeInfoRequest, QueryCodeInfoRequest, QueryCodeInfoResponse, QueryContractInfoRequest, QueryContractInfoResponse, QueryContractInstanceRequest, QueryContractInstanceResponse, QueryLastCodeIdResponse } from "./types";
import { autoIncrementID, getCodeId, getCodeInfo, getCodeRootKey, getContractAddressRootKey, getContractInfo, getLastCodeId, storeCodeInfo, storeContractInfo } from "./storage";
import { LoggerInfo, revert } from "./utils";
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
    const prevContract = req.previous_address
    // TODO migrate old data
    return new ArrayBuffer(0);
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
