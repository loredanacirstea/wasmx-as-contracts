import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { GetAccount, GetAccountAddressByID, GetAccountInfo, GetAccounts, GetAddressBytesToString, GetAddressStringToBytes, GetBech32Prefix, InitGenesis, GetModuleAccountByName, GetModuleAccounts, GetParams, SetAccount, UpdateParams, HasAccount, SetNewBaseAccount, SetNewModuleAccount } from "./actions";
import { revert } from "./utils";
import { MODULE_NAME } from "./types";
import { onlyInternal } from "wasmx-env/assembly/utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.GetAccount !== null) {
    result = GetAccount(calld.GetAccount!);
  } else if (calld.HasAccount !== null) {
    result = HasAccount(calld.HasAccount!);
  } else if (calld.GetAccountAddressByID !== null) {
    result = GetAccountAddressByID(calld.GetAccountAddressByID!);
  } else if (calld.GetAccounts !== null) {
    result = GetAccounts(calld.GetAccounts!);
  } else if (calld.GetParams !== null) {
    result = GetParams(calld.GetParams!);
  } else if (calld.GetModuleAccounts !== null) {
    result = GetModuleAccounts(calld.GetModuleAccounts!);
  } else if (calld.GetModuleAccountByName !== null) {
    result = GetModuleAccountByName(calld.GetModuleAccountByName!);
  } else if (calld.GetBech32Prefix !== null) {
    result = GetBech32Prefix(calld.GetBech32Prefix!);
  } else if (calld.GetAddressBytesToString !== null) {
    result = GetAddressBytesToString(calld.GetAddressBytesToString!);
  } else if (calld.GetAddressStringToBytes !== null) {
    result = GetAddressStringToBytes(calld.GetAddressStringToBytes!);
  } else if (calld.GetAccountInfo !== null) {
    result = GetAccountInfo(calld.GetAccountInfo!);
  }

  // internal operations
  else if (calld.SetAccount !== null) {
    onlyInternal(MODULE_NAME, "SetAccount");
    result = SetAccount(calld.SetAccount!);
  } else if (calld.SetNewBaseAccount !== null) {
    onlyInternal(MODULE_NAME, "SetNewBaseAccount");
    result = SetNewBaseAccount(calld.SetNewBaseAccount!);
  } else if (calld.SetNewModuleAccount !== null) {
    onlyInternal(MODULE_NAME, "SetNewModuleAccount");
    result = SetNewModuleAccount(calld.SetNewModuleAccount!);
  } else if (calld.UpdateParams !== null) {
    onlyInternal(MODULE_NAME, "UpdateParams");
    result = UpdateParams(calld.UpdateParams!);
  } else if (calld.InitGenesis !== null) {
    onlyInternal(MODULE_NAME, "InitGenesis");
    result = InitGenesis(calld.InitGenesis!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
