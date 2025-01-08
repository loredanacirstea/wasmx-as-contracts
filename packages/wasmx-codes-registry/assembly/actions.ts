import { JSON } from "json-as/assembly";
import { GenesisState, MsgSetCodeInfoRequest, MsgSetContractInfoRequest, MsgSetNewCodeInfoRequest, QueryCodeInfoRequest, QueryCodeInfoResponse, QueryContractInfoRequest, QueryContractInfoResponse, QueryContractInstanceRequest, QueryContractInstanceResponse, QueryLastCodeIdResponse } from "./types";
import { autoIncrementID, getCodeInfo, getContractInfo, getLastCodeId, storeCodeInfo, storeContractInfo } from "./storage";
import { revert } from "./utils";

export function InitGenesis(req: GenesisState): ArrayBuffer {
    for (let i = 0; i < req.code_infos.length; i++) {
        const codeInfo = req.code_infos[i]
        const codeId = autoIncrementID();
        storeCodeInfo(codeId, codeInfo);
    }
    for (let i = 0; i < req.contract_infos.length; i++) {
        const data = req.contract_infos[i]
        storeContractInfo(data.address, data.contract_info)
    }
    return new ArrayBuffer(0);
}

export function NewCodeInfo(req: MsgSetNewCodeInfoRequest): ArrayBuffer {
    const codeId = autoIncrementID();
    storeCodeInfo(codeId, req.code_info);
    const data = JSON.stringify<QueryLastCodeIdResponse>(new QueryLastCodeIdResponse(codeId))
    return String.UTF8.encode(data);
}

export function SetCodeInfo(req: MsgSetCodeInfoRequest): ArrayBuffer {
    storeCodeInfo(req.code_id, req.code_info);
    return new ArrayBuffer(0);
}

export function SetContractInfo(req: MsgSetContractInfoRequest): ArrayBuffer {
    storeContractInfo(req.address, req.contract_info)
    return new ArrayBuffer(0);
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
