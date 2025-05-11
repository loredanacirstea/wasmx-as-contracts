import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgName, MsgSymbol, MsgDecimals, MsgTotalSupply, MsgBalanceOf, MsgTransfer, MsgTransferFrom, MsgApprove, MsgAllowance, MsgMint } from 'wasmx-erc20/assembly/types';
import { QueryDelegationRequest, QueryValidatorDelegationsRequest } from "wasmx-stake/assembly/types";
import { MsgDelegate, MsgUndelegate, MsgRedelegate, MsgGetAllSDKDelegations } from "./types";

@json
export class CallData {
    name: MsgName | null = null;
    symbol: MsgSymbol | null = null;
    decimals: MsgDecimals | null = null;
    totalSupply: MsgTotalSupply | null = null;
    balanceOf: MsgBalanceOf | null = null;
    approve: MsgApprove | null = null;
    allowance: MsgAllowance | null = null;
    balanceOfValidator: MsgBalanceOf | null = null;

    delegate: MsgDelegate | null = null;
    undelegate: MsgUndelegate | null = null;
    redelegate: MsgRedelegate | null = null;

    // query
    GetAllSDKDelegations: MsgGetAllSDKDelegations | null = null;
    ValidatorDelegations: QueryValidatorDelegationsRequest | null = null;
    GetDelegation: QueryDelegationRequest | null = null;
    GetValidatorDelegations: QueryValidatorDelegationsRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
