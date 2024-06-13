import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as erc20 from "wasmx-erc20/assembly/types"
import { MsgBalanceOfCrossChain, MsgTotalSupplyCrossChain, MsgTransferCrossChain, MsgTransferFromCrossChain } from "./types";

// @ts-ignore
@serializable
export class CallData {
    // erc20
    name: erc20.MsgName | null = null;
    symbol: erc20.MsgSymbol | null = null;
    decimals: erc20.MsgDecimals | null = null;
    totalSupply: erc20.MsgTotalSupply | null = null;
    balanceOf:erc20.MsgBalanceOf | null = null;
    transfer: erc20.MsgTransfer | null = null;
    transferFrom: erc20.MsgTransferFrom | null = null;
    approve: erc20.MsgApprove | null = null;
    allowance: erc20.MsgAllowance | null = null;
    mint: erc20.MsgMint | null = null;
    burn: erc20.MsgBurn | null = null;

    // cross-chain
    totalSupplyCrossChain: MsgTotalSupplyCrossChain | null = null;
    balanceOfCrossChain: MsgBalanceOfCrossChain | null = null;
    transferCrossChain: MsgTransferCrossChain | null = null;
    transferFromCrossChain: MsgTransferFromCrossChain | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
