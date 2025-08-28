import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import {
  InitGenesis,
  Send, SendCoinsFromModuleToAccount, SendCoinsFromModuleToModule, SendCoinsFromAccountToModule,
  MultiSend, UpdateParams, SetSendEnabled,
  GetBalance, AllBalances, SpendableBalances,
  SpendableBalanceByDenom,
  TotalSupply,
  SupplyOf,
  GetParams,
  DenomMetadata,
  DenomMetadataByQueryString,
  DenomOwners,
  SendEnabled,
  GetAddressByDenom,
  MintCoins,
} from "./actions";
import { CallDataInstantiate, MODULE_NAME } from "./types"
import { setAuthorities } from "./storage";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
  setAuthorities(calld.authorities)
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();

  // public operations
  if (calld.GetBalance !== null) {
    result = GetBalance(calld.GetBalance!);
  } else if (calld.GetAllBalances !== null) {
    result = AllBalances(calld.GetAllBalances!);
  } else if (calld.GetSpendableBalances !== null) {
    result = SpendableBalances(calld.GetSpendableBalances!);
  } else if (calld.GetSpendableBalanceByDenom !== null) {
    result = SpendableBalanceByDenom(calld.GetSpendableBalanceByDenom!);
  } else if (calld.GetTotalSupply !== null) {
    result = TotalSupply(calld.GetTotalSupply!);
  } else if (calld.GetAddressByDenom !== null) {
    result = GetAddressByDenom(calld.GetAddressByDenom!);
  } else if (calld.GetSupplyOf !== null) {
    result = SupplyOf(calld.GetSupplyOf!);
  } else if (calld.GetParams !== null) {
    result = GetParams(calld.GetParams!);
  } else if (calld.GetDenomMetadata !== null) {
    result = DenomMetadata(calld.GetDenomMetadata!);
  } else if (calld.GetDenomMetadataByQueryString !== null) {
    result = DenomMetadataByQueryString(calld.GetDenomMetadataByQueryString!);
  } else if (calld.GetDenomOwners !== null) {
    result = DenomOwners(calld.GetDenomOwners!);
  } else if (calld.GetSendEnabled !== null) {
    result = SendEnabled(calld.GetSendEnabled!);
  } else if (calld.SendCoins !== null) {
    Send(calld.SendCoins!);
    result = new ArrayBuffer(0)
  } else if (calld.MultiSend !== null) {
    result = MultiSend(calld.MultiSend!);
  }

  // internal operations
  else if (calld.SendCoinsFromModuleToAccount !== null) {
    onlyInternal(MODULE_NAME, "SendCoinsFromModuleToAccount");
    result = SendCoinsFromModuleToAccount(calld.SendCoinsFromModuleToAccount!);
  } else if (calld.SendCoinsFromModuleToModule !== null) {
    onlyInternal(MODULE_NAME, "SendCoinsFromModuleToModule");
    result = SendCoinsFromModuleToModule(calld.SendCoinsFromModuleToModule!);
  } else if (calld.SendCoinsFromAccountToModule !== null) {
    onlyInternal(MODULE_NAME, "SendCoinsFromAccountToModule");
    result = SendCoinsFromAccountToModule(calld.SendCoinsFromAccountToModule!);
  } else if (calld.UpdateParams !== null) {
    onlyInternal(MODULE_NAME, "UpdateParams");
    result = UpdateParams(calld.UpdateParams!);
  } else if (calld.SetSendEnabled !== null) {
    onlyInternal(MODULE_NAME, "SetSendEnabled");
    result = SetSendEnabled(calld.SetSendEnabled!);
  } else if (calld.InitGenesis !== null) {
    onlyInternal(MODULE_NAME, "InitGenesis");
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.MintCoins !== null) {
    onlyInternal(MODULE_NAME, "MintCoins");
    result = MintCoins(calld.MintCoins!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
