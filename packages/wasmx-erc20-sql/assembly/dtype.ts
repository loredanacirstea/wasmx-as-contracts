import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';
import { CountRequest, CountResponse, InsertRequest, ReadFieldRequest, ReadRequest, TableIndentifier, UpdateRequest } from "wasmx-dtype/assembly/types";
import { AddRequest, MoveRequest, SubRequest } from "wasmx-dtype/assembly/types_tokens";
import * as config from "wasmx-dtype/assembly/config";
import { MODULE_NAME } from './types';
import { callContract } from "wasmx-env/assembly/utils";
import { ROLE_DTYPE } from "wasmx-env/assembly/roles";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { MsgExecuteBatchResponse, MsgQueryResponse } from "wasmx-env-sql/assembly/types";

export function setRecordId(id: i64): void {
    wasmxw.sstore("record_id", id.toString())
}

export function getRecordId(): i64 {
    const v = wasmxw.sload("record_id")
    if (v == "") return i64(0);
    return i64(parseInt(v, 10))
}

function getDTypeIdentifier(table_id: i64, table_name: string): TableIndentifier {
    return new TableIndentifier(config.tableDbConnId, config.tableDbId, table_id, config.DTypeConnection, config.DTypeDbName, table_name)
}

export function getFieldValue(tableId: i64, tableName: string, fieldName: string, data: Base64String): string {
    const calld = JSON.stringify<ReadFieldRequest>(new ReadFieldRequest(
        getDTypeIdentifier(tableId, tableName),
        0, fieldName,
        data,
    ))
    const resp = callContract(ROLE_DTYPE, `{"ReadField":${calld}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`getFieldValue failed for table ${tableName}, field ${fieldName}: ${resp.data}`)
    }
    console.log("--getFieldValue resp--" + resp.data)
    const result = JSON.parse<MsgQueryResponse>(resp.data)
    if (result.error != "") {
        revert(`getFieldValue failed for table ${tableName}, field ${fieldName}: ${result.error}`)
    }
    return base64ToString(result.data)
}

export function getTokenFieldValue(name: string): string {
    return getFieldValue(config.TokensTableId, config.TokensTable, name,  stringToBase64(`{"address":"${wasmxw.getAddress()}"}`))
}

export function getOwnedFieldValue(name: string, owner: Bech32String): string {
    return getFieldValue(config.OwnedTableId, config.OwnedTable, name,  stringToBase64(`{"owner":"${owner}","creator":"${wasmxw.getAddress()}"}`))
}

export function insertTokenFieldValues(keys: string[], values: string[]): i64 {
    const named = new Map<string,string>()
    for (let i = 0; i < keys.length; i++) {
        named.set(keys[i], values[i])
    }
    named.set("address", wasmxw.getAddress())
    named.set("value_type", "erc20")
    const obj = JSON.stringify(named)
    const calld = JSON.stringify<InsertRequest>(new InsertRequest(
        getDTypeIdentifier(config.TokensTableId, config.TokensTable),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Insert":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`setTokenFieldValues failed: ${resp.data}`)
    }
    console.log("--insertTokenFieldValues resp--" + resp.data)
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
    if (response.responses.length == 0) revert(`no insert performed`)
    return response.responses[0].last_insert_id
}

export function setTokenFieldValues(keys: string[], values: string[]): void {
    const named = new Map<string,string>()
    for (let i = 0; i < keys.length; i++) {
        named.set(keys[i], values[i])
    }
    named.set("address", wasmxw.getAddress())
    const obj = JSON.stringify(named)
    const calld = JSON.stringify<UpdateRequest>(new UpdateRequest(
        getDTypeIdentifier(config.TokensTableId, config.TokensTable),
        stringToBase64(`{"address":"${wasmxw.getAddress()}"}`),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Update":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`setTokenFieldValues failed: ${resp.data}`)
    }
    console.log("--setTokenFieldValues resp--" + resp.data)
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
}

export function insertOwnedFieldValues(owner: Bech32String, amount: BigInt): void {
    const obj = `{"table_id":${config.TokensTableId},"record_id":${getRecordId()},"amount":"${amount.toString()}","fungible":true,"permissions":"","creator":"${wasmxw.getAddress()}","owner":"${owner}"}`
    const calld = JSON.stringify<InsertRequest>(new InsertRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Insert":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`insertOwnedFieldValues failed: ${resp.data}`)
    }
    console.log("--insertOwnedFieldValues resp--" + resp.data)
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
}


export function setOwnedFieldValues(name: string, keys: string[], values: string[]): void {
    const named = new Map<string,string>()
    for (let i = 0; i < keys.length; i++) {
        named.set(keys[i], values[i])
    }
    const obj = JSON.stringify(named)
    const calld = JSON.stringify<UpdateRequest>(new UpdateRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        stringToBase64(`{"owner":"${name}","creator":"${wasmxw.getAddress()}"}`),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Update":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`setOwnedFieldValues failed: ${resp.data}`)
    }
    console.log("--setOwnedFieldValues resp--" + resp.data)
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
}

export function assetExists(owner: Bech32String): boolean {
    const count = countFromTable(config.OwnedTableId, config.OwnedTable, stringToBase64(`{"owner":"${owner}","creator":"${wasmxw.getAddress()}"}`))
    return count > 0;
}

export function countFromTable(tableId: i64, tableName: string, data: Base64String): i64 {
    const calld = JSON.stringify<CountRequest>(new CountRequest(
        getDTypeIdentifier(tableId, tableName),
        data,
    ))
    const resp = callContract(ROLE_DTYPE, `{"Count":${calld}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`readFromTable failed for table ${tableName}: ${resp.data}`)
    }
    console.log("--countFromTable resp--" + resp.data)
    const result = JSON.parse<CountResponse>(resp.data)
    if (result.error != "") {
        revert(`readFromTable failed for table ${tableName}: ${result.error}`)
    }
    return result.count
}

export function moveToken(source: Bech32String, target: Bech32String, amount: BigInt): void {
    const calld = JSON.stringify<MoveRequest>(new MoveRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        "amount",
        stringToBase64(`{"owner":"${source}","creator":"${wasmxw.getAddress()}"}`),
        stringToBase64(`{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Move":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`moveToken failed: ${resp.data}`)
    }
}

export function addToken(target: Bech32String, amount: BigInt): void {
    console.log("--addToken--" + target + "--" + amount.toString())
    const calld = JSON.stringify<AddRequest>(new AddRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        "amount",
        stringToBase64(`{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Add":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`addToken failed: ${resp.data}`)
    }
}

export function subToken(target: Bech32String, amount: BigInt): void {
    const calld = JSON.stringify<SubRequest>(new SubRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        "amount",
        stringToBase64(`{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Sub":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`subToken failed: ${resp.data}`)
    }
}

export function addSupply(amount: BigInt): string {
    const calld = JSON.stringify<AddRequest>(new AddRequest(
        getDTypeIdentifier(config.TokensTableId, config.TokensTable),
        "total_supply",
        stringToBase64(`{"address":"${wasmxw.getAddress()}"}`),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Add":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`addSupply failed: ${resp.data}`)
    }
    return resp.data
}

export function subSupply(amount: BigInt): string {
    const calld = JSON.stringify<SubRequest>(new SubRequest(
        getDTypeIdentifier(config.OwnedTableId, config.OwnedTable),
        "total_supply",
        stringToBase64(`{"address":"${wasmxw.getAddress()}"}`),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Sub":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`subToken failed: ${resp.data}`)
    }
    return resp.data
}
