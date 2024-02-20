import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { GetAccount, GetAccountAddressByID, GetAccountInfo, GetAccounts, GetAddressBytesToString, GetAddressStringToBytes, GetBech32Prefix, InitGenesis, GetModuleAccountByName, GetModuleAccounts, GetParams, SetAccount, UpdateParams, HasAccount } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetAccount !== null) {
    result = SetAccount(calld.SetAccount!);
  } else if (calld.GetAccount !== null) {
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
  } else if (calld.UpdateParams !== null) {
    result = UpdateParams(calld.UpdateParams!);
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
