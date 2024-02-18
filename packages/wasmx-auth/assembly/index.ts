import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { Account, AccountAddressByID, AccountInfo, Accounts, AddressBytesToString, AddressStringToBytes, Bech32Prefix, InitGenesis, ModuleAccountByName, ModuleAccounts, Params, UpdateParams } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.Accounts !== null) {
    result = Accounts(calld.Accounts!);
  } else if (calld.Account !== null) {
    result = Account(calld.Account!);
  } else if (calld.AccountAddressByID !== null) {
    result = AccountAddressByID(calld.AccountAddressByID!);
  } else if (calld.Params !== null) {
    result = Params(calld.Params!);
  } else if (calld.ModuleAccounts !== null) {
    result = ModuleAccounts(calld.ModuleAccounts!);
  } else if (calld.ModuleAccountByName !== null) {
    result = ModuleAccountByName(calld.ModuleAccountByName!);
  } else if (calld.Bech32Prefix !== null) {
    result = Bech32Prefix(calld.Bech32Prefix!);
  } else if (calld.AddressBytesToString !== null) {
    result = AddressBytesToString(calld.AddressBytesToString!);
  } else if (calld.AddressStringToBytes !== null) {
    result = AddressStringToBytes(calld.AddressStringToBytes!);
  } else if (calld.AccountInfo !== null) {
    result = AccountInfo(calld.AccountInfo!);
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
