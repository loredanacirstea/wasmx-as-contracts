import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { TableIndentifier } from "./types";

// @ts-ignore
@serializable
export class Token {
    id: i64 = 0;
    value_type: string = "";
    name: string = "";
    symbol: string = "";
    decimals: i32 = 0;
    address: string = "";
    total_supply: string = "";
    actions: string = "";
    actions_user: string = "";
    fungible: bool = false;

    constructor(
        id: i64,
        value_type: string,
        name: string,
        symbol: string,
        decimals: i32,
        address: string,
        total_supply: string,
        actions: string,
        actions_user: string,
        fungible: bool,
    ) {
        this.id = id;
        this.value_type = value_type;
        this.name = name;
        this.symbol = symbol;
        this.decimals = decimals;
        this.address = address;
        this.total_supply = total_supply;
        this.actions = actions;
        this.actions_user = actions_user;
        this.fungible = fungible;
    }

    toExtended(): TokenExtended {
        return new TokenExtended(
            this.id,
            this.value_type,
            this.name,
            this.symbol,
            this.decimals,
            this.address,
            this.total_supply,
            JSON.parse<string[]>(this.actions),
            JSON.parse<string[]>(this.actions_user),
            this.fungible,
        )
    }
}

// @ts-ignore
@serializable
export class TokenExtended {
    id: i64 = 0;
    value_type: string = "";
    name: string = "";
    symbol: string = "";
    decimals: i32 = 0;
    address: string = "";
    total_supply: string = "";
    actions: string[] = [];
    actions_user: string[] = [];
    fungible: bool = false;

    constructor(
        id: i64,
        value_type: string,
        name: string,
        symbol: string,
        decimals: i32,
        address: string,
        total_supply: string,
        actions: string[],
        actions_user: string[],
        fungible: bool,
    ) {
        this.id = id;
        this.value_type = value_type;
        this.name = name;
        this.symbol = symbol;
        this.decimals = decimals;
        this.address = address;
        this.total_supply = total_supply;
        this.actions = actions;
        this.actions_user = actions_user;
        this.fungible = fungible;
    }

    toRaw(): Token {
        return new Token(
            this.id,
            this.value_type,
            this.name,
            this.symbol,
            this.decimals,
            this.address,
            this.total_supply,
            JSON.stringify<string[]>(this.actions),
            JSON.stringify<string[]>(this.actions_user),
            this.fungible,
        )
    }
}

// @ts-ignore
@serializable
export class Owned {
    id: i64 = 0;
    table_id: i64 = 0;
    record_id: i64 = 0;
    amount: string = "";
    creator: Bech32String = "";
    owner: Bech32String = "";

    constructor(
        id: i64,
        table_id: i64,
        record_id: i64,
        amount: string,
        creator: Bech32String,
        owner: Bech32String,
    ) {
        this.id = id;
        this.table_id = table_id;
        this.record_id = record_id;
        this.amount = amount;
        this.creator = creator;
        this.owner = owner;
    }

    toExtended(): OwnedExtended {
        return new OwnedExtended(
            this.id,
            this.table_id,
            this.record_id,
            this.amount,
            this.creator,
            this.owner,
        )
    }
}

// @ts-ignore
@serializable
export class OwnedExtended {
    id: i64 = 0;
    table_id: i64 = 0;
    record_id: i64 = 0;
    amount: string = "";
    creator: Bech32String = "";
    owner: Bech32String = "";

    constructor(
        id: i64,
        table_id: i64,
        record_id: i64,
        amount: string,
        creator: Bech32String,
        owner: Bech32String,
    ) {
        this.id = id;
        this.table_id = table_id;
        this.record_id = record_id;
        this.amount = amount;
        this.creator = creator;
        this.owner = owner;
    }

    toExtended(): Owned {
        return new Owned(
            this.id,
            this.table_id,
            this.record_id,
            this.amount,
            this.creator,
            this.owner,
        )
    }
}

// @ts-ignore
@serializable
export class AddRequest {
    identifier: TableIndentifier
    fieldName: string = ""
    condition: Base64String = ""
    amount: string = ""
    constructor(
        identifier: TableIndentifier,
        fieldName: string,
        condition: Base64String,
        amount: string,
    ) {
        this.identifier = identifier
        this.fieldName = fieldName
        this.condition = condition
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class SubRequest {
    identifier: TableIndentifier
    fieldName: string = ""
    condition: Base64String = ""
    amount: string = ""
    constructor(
        identifier: TableIndentifier,
        fieldName: string,
        condition: Base64String,
        amount: string,
    ) {
        this.identifier = identifier
        this.fieldName = fieldName
        this.condition = condition
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class MoveRequest {
    identifier: TableIndentifier
    fieldName: string = ""
    condition_source: Base64String = ""
    condition_target: Base64String = ""
    amount: string = ""
    constructor(
        identifier: TableIndentifier,
        fieldName: string,
        condition_source: Base64String,
        condition_target: Base64String,
        amount: string,
    ) {
        this.identifier = identifier
        this.fieldName = fieldName
        this.condition_source = condition_source
        this.condition_target = condition_target
        this.amount = amount
    }
}
