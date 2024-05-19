import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    GenesisState, MsgSend, MsgMultiSend, MsgUpdateParams, MsgSetSendEnabled,
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
    QueryAddressByDenom,
    MsgMintCoins,
} from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: GenesisState | null = null;
    SendCoins: MsgSend | null = null;
    MultiSend: MsgMultiSend | null = null;
    UpdateParams: MsgUpdateParams | null = null;
    SetSendEnabled: MsgSetSendEnabled | null = null;
    // for efficiency of role checking
    SendCoinsFromModuleToAccount: MsgSend | null = null;
    SendCoinsFromModuleToModule: MsgSend | null = null;
    SendCoinsFromAccountToModule: MsgSend | null = null;
    MintCoins: MsgMintCoins | null = null;

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

    // core
    GetAddressByDenom: QueryAddressByDenom | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
