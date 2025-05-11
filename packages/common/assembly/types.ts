import { JSON } from "json-as";
import { u128 } from 'as-bignum';

export type Address = ArrayBuffer;
export type AddressHex = string;

// @ts-ignore
@serializable
export class Coin {
    denom!: string
    amount!: u128
}

// @ts-ignore
@serializable
export class Log {
	data!: u8[]
	topics!: Array<u8[]>
}
