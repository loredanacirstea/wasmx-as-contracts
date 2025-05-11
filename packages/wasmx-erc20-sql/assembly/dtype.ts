import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';
import { CountRequest, CountResponse, InsertRequest, ReadFieldRequest, ReadRequest, TableIndentifier, UpdateRequest } from "wasmx-dtype/assembly/types";
import { AddRequest, MoveRequest, SubRequest } from "wasmx-dtype/assembly/types_tokens";
import * as config from "wasmx-dtype/assembly/config";
import { getDTypeIdentifier } from "wasmx-dtype/assembly/helpers";
import { MODULE_NAME } from './types';
import { callContract } from "wasmx-env/assembly/utils";
import { ROLE_DTYPE } from "wasmx-env/assembly/roles";
import { base64ToString, parseInt64, stringToBase64 } from "wasmx-utils/assembly/utils";
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

export function getTokenFieldValue(name: string): string {
    return getFieldValue(config.TokensTableId, config.TokensTable, name,  stringToBase64(`{"address":"${wasmxw.getAddress()}"}`))
}

export function getOwnedFieldValue(name: string, owner: Bech32String): string {
    return getFieldValue(config.OwnedTableId, config.OwnedTable, name,  stringToBase64(`{"owner":"${owner}","creator":"${wasmxw.getAddress()}"}`))
}

export function getPermissionFieldValue(name: string, owner: Bech32String, spender: Bech32String): string {
    return getFieldValue(config.AllowanceTableId, config.AllowanceTable, name,  stringToBase64(`{"owner":"${owner}","owned":"${wasmxw.getAddress()}","spender":"${spender}"}`))
}

export function insertTokenFieldValues(name: string, symbol: string, decimals: i32, total_supply: BigInt): i64 {
    const obj = `{"value_type":"erc20","name":"${name}","symbol":"${symbol}","decimals":${decimals},"decimals":${decimals},"total_supply":"${total_supply.toString()}","address":"${wasmxw.getAddress()}","fungible":true}`
    return insertFieldValues(config.TokensTableId, config.TokensTable, obj)
}

export function insertOwnedFieldValues(owner: Bech32String, amount: BigInt): i64 {
    const obj = `{"table_id":${config.TokensTableId},"record_id":${getRecordId()},"amount":"${amount.toString()}","creator":"${wasmxw.getAddress()}","owner":"${owner}"}`
    return insertFieldValues(config.OwnedTableId, config.OwnedTable, obj)
}

export function insertPermissionFieldValues(owner: Bech32String, spender: Bech32String, amount: BigInt): i64 {
    const ownedIdStr = getFieldValue(config.OwnedTableId, config.OwnedTable, "id",  stringToBase64(`{"creator":"${wasmxw.getAddress()}","owner":"${owner}"}`))
    const ownedId = parseInt64(ownedIdStr)
    const obj = `{"table_id":${config.OwnedTableId},"record_id":${ownedId},"owner":"${owner}","spender":"${spender}","owned":"${wasmxw.getAddress()}", "amount":"${amount.toString()}"}`
    return insertFieldValues(config.AllowanceTableId, config.AllowanceTable, obj)
}

export function setTokenFieldValues(keys: string[], values: string[]): void {
    const named = new Map<string,string>()
    for (let i = 0; i < keys.length; i++) {
        named.set(keys[i], values[i])
    }
    named.set("address", wasmxw.getAddress())
    const obj = JSON.stringify(named)
    updateFieldValues(config.TokensTableId, config.TokensTable, obj, `{"address":"${wasmxw.getAddress()}"}`)
}

export function setOwnedFieldValues(name: string, keys: string[], values: string[]): void {
    const named = new Map<string,string>()
    for (let i = 0; i < keys.length; i++) {
        named.set(keys[i], values[i])
    }
    const obj = JSON.stringify(named)

    updateFieldValues(config.OwnedTableId, config.OwnedTable, obj, `{"owner":"${name}","creator":"${wasmxw.getAddress()}"}`)
}

export function assetExists(owner: Bech32String): boolean {
    const count = countFromTable(config.OwnedTableId, config.OwnedTable, stringToBase64(`{"owner":"${owner}","creator":"${wasmxw.getAddress()}"}`))
    return count > 0;
}

export function permissionExists(owner: Bech32String, spender: Bech32String): boolean {
    const count = countFromTable(config.AllowanceTableId, config.AllowanceTable, stringToBase64(`{"owner":"${owner}","owned":"${wasmxw.getAddress()}","spender":"${spender}"}`))
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
    const result = JSON.parse<CountResponse>(resp.data)
    if (result.error != "") {
        revert(`readFromTable failed for table ${tableName}: ${result.error}`)
    }
    return result.count
}

export function moveToken(source: Bech32String, target: Bech32String, amount: BigInt): void {
    return moveValue(config.OwnedTableId, config.OwnedTable, "amount", `{"owner":"${source}","creator":"${wasmxw.getAddress()}"}`, `{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`, amount)
}

export function addToken(target: Bech32String, amount: BigInt): void {
    return addValue(config.OwnedTableId, config.OwnedTable, "amount", `{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`, amount)
}

export function subToken(target: Bech32String, amount: BigInt): void {
    return subValue(config.OwnedTableId, config.OwnedTable, "amount", `{"owner":"${target}","creator":"${wasmxw.getAddress()}"}`, amount)
}

export function addSupply(amount: BigInt): void {
    return addValue(config.TokensTableId, config.TokensTable, "total_supply", `{"address":"${wasmxw.getAddress()}"}`, amount)
}

export function subSupply(amount: BigInt): void {
    return subValue(config.OwnedTableId, config.OwnedTable, "total_supply", `{"address":"${wasmxw.getAddress()}"}`, amount)
}

export function addPermission(owner: Bech32String, spender: Bech32String, amount: BigInt): void {
    return addValue(config.AllowanceTableId, config.AllowanceTable, "amount", `{"owner":"${owner}","spender":"${spender}","owned":"${wasmxw.getAddress()}"}`, amount)
}

export function subPermission(owner: Bech32String, spender: Bech32String, amount: BigInt): void {
    return subValue(config.AllowanceTableId, config.AllowanceTable, "amount", `{"owner":"${owner}","spender":"${spender}","owned":"${wasmxw.getAddress()}"}`, amount)
}

export function moveValue(tableId: i64, tableName: string, fieldName: string, condSource: string, condTarget: string, amount: BigInt): void {
    const calld = JSON.stringify<MoveRequest>(new MoveRequest(
        getDTypeIdentifier(tableId, tableName),
        fieldName,
        stringToBase64(condSource),
        stringToBase64(condTarget),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Move":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`moveToken failed: ${resp.data}`)
    }
}

export function addValue(tableId: i64, tableName: string, fieldName: string, cond: string, amount: BigInt): void {
    const calld = JSON.stringify<AddRequest>(new AddRequest(
        getDTypeIdentifier(tableId, tableName),
        fieldName,
        stringToBase64(cond),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Add":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`addToken failed: ${resp.data}`)
    }
}

export function subValue(tableId: i64, tableName: string, fieldName: string, cond: string, amount: BigInt): void {
    const calld = JSON.stringify<SubRequest>(new SubRequest(
        getDTypeIdentifier(tableId, tableName),
        fieldName,
        stringToBase64(cond),
        amount.toString(),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Sub":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`subToken failed: ${resp.data}`)
    }
}

export function updateFieldValues(tableId: i64, tableName: string, obj: string, cond: string): void {
    const calld = JSON.stringify<UpdateRequest>(new UpdateRequest(
        getDTypeIdentifier(tableId, tableName),
        stringToBase64(cond),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Update":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`updateFieldValues failed: ${resp.data}`)
    }
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
}

export function insertFieldValues(tableId: i64, tableName: string, obj: string): i64 {
    const calld = JSON.stringify<InsertRequest>(new InsertRequest(
        getDTypeIdentifier(tableId, tableName),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Insert":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`insertFieldValues failed: ${resp.data}`)
    }
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
    if (response.responses.length == 0) revert(`no insert performed`)
    return response.responses[0].last_insert_id
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
    const result = JSON.parse<MsgQueryResponse>(resp.data)
    if (result.error != "") {
        revert(`getFieldValue failed for table ${tableName}, field ${fieldName}: ${result.error}`)
    }
    return base64ToString(result.data)
}
