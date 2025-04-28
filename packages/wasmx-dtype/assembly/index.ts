import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap, getCallDataInstantiateWrap } from './calldata';
import { Close, Connect, CreateTable, Insert, InstantiateDType, Read, Update } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function wasmx_sql_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInstantiateWrap()
  InstantiateDType(calld)
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.CreateTable !== null) {
    result = CreateTable(calld.CreateTable!);
  } else if (calld.Insert !== null) {
    result = Insert(calld.Insert!);
  } else if (calld.Update !== null) {
    result = Update(calld.Update!);
  } else if (calld.Read !== null) {
    result = Read(calld.Read!);
  } else if (calld.Connect !== null) {
    result = Connect(calld.Connect!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.Initialize !== null) {
    result = InstantiateDType(calld.Initialize!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
