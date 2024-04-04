import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgName, MsgSymbol, MsgDecimals, MsgTotalSupply, MsgBalanceOf, MsgTransfer, MsgTransferFrom, MsgApprove, MsgAllowance, MsgMint, MsgBurn } from './types';

// @ts-ignore
@serializable
export class CallData {
    name: MsgName | null = null;
    symbol: MsgSymbol | null = null;
    decimals: MsgDecimals | null = null;
    totalSupply: MsgTotalSupply | null = null;
    balanceOf: MsgBalanceOf | null = null;
    transfer: MsgTransfer | null = null;
    transferFrom: MsgTransferFrom | null = null;
    approve: MsgApprove | null = null;
    allowance: MsgAllowance | null = null;
    mint: MsgMint | null = null;
    burn: MsgBurn | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
