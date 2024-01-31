import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    MsgInitGenesis, MsgSend, MsgMultiSend, MsgUpdateParams, MsgSetSendEnabled,
    QueryBalanceRequest,
    QueryAllBalancesRequest,
    QuerySpendableBalancesRequest,
    QuerySpendableBalanceByDenomRequest,
    QueryTotalSupplyRequest,
    QuerySupplyOfRequest,
    QueryParamsRequest,
    QueryDenomMetadataRequest,
    QueryDenomsMetadataRequest,
    QueryDenomMetadataByQueryStringRequest,
    QueryDenomOwnersRequest,
    QuerySendEnabledRequest,
} from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    Send: MsgSend | null = null;
    MultiSend: MsgMultiSend | null = null;
    UpdateParams: MsgUpdateParams | null = null;
    SetSendEnabled: MsgSetSendEnabled | null = null;
    // queries
    GetBalance: QueryBalanceRequest | null = null;
    GetAllBalances: QueryAllBalancesRequest | null = null;
    GetSpendableBalances: QuerySpendableBalancesRequest | null = null;
    GetSpendableBalanceByDenom: QuerySpendableBalanceByDenomRequest | null = null;
    GetTotalSupply: QueryTotalSupplyRequest | null = null;
    GetSupplyOf: QuerySupplyOfRequest | null = null;
    GetParams: QueryParamsRequest | null = null;
    GetDenomMetadata: QueryDenomMetadataRequest | null = null;
    GetDenomsMetadata: QueryDenomsMetadataRequest | null = null;
    GetDenomMetadataByQueryString: QueryDenomMetadataByQueryStringRequest | null = null;
    GetDenomOwners: QueryDenomOwnersRequest | null = null;
    GetSendEnabled: QuerySendEnabledRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
