import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap, getCallDataInstantiateWrap } from './calldata';
import { add, BuildSchema, Close, Connect, Count, CreateTable, Delete, InitializeIdentity, Insert, InsertOrReplace, InstantiateDType, InitializeTokens, move, Read, ReadFields, sub, Update, GetRecordsByRelationType, ReadRaw } from "./actions";
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
  } else if (calld.InsertOrReplace !== null) {
    result = InsertOrReplace(calld.InsertOrReplace!);
  } else if (calld.Update !== null) {
    result = Update(calld.Update!);
  } else if (calld.Delete !== null) {
    result = Delete(calld.Delete!);
  } else if (calld.Read !== null) {
    result = Read(calld.Read!);
  } else if (calld.ReadRaw !== null) {
    result = ReadRaw(calld.ReadRaw!);
  } else if (calld.Count !== null) {
    result = Count(calld.Count!);
  } else if (calld.ReadFields !== null) {
    result = ReadFields(calld.ReadFields!);
  } else if (calld.GetRecordsByRelationType !== null) {
    result = GetRecordsByRelationType(calld.GetRecordsByRelationType!);
  } else if (calld.BuildSchema !== null) {
    result = BuildSchema(calld.BuildSchema!);
  } else if (calld.Connect !== null) {
    result = Connect(calld.Connect!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.Initialize !== null) {
    result = InstantiateDType(calld.Initialize!);
  } else if (calld.InitializeTokens !== null) {
    result = InitializeTokens(calld.InitializeTokens!);
  } else if (calld.InitializeIdentity !== null) {
    result = InitializeIdentity();
  } else if (calld.Add !== null) {
    result = add(calld.Add!);
  } else if (calld.Sub !== null) {
    result = sub(calld.Sub!);
  } else if (calld.Move !== null) {
    result = move(calld.Move!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
