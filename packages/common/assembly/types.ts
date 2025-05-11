import { JSON } from "json-as";
import { u128 } from 'as-bignum';

export type Address = ArrayBuffer;
export type AddressHex = string;

@json
export class Coin {
    denom!: string
    amount!: u128
}

@json
export class Log {
	data!: u8[]
	topics!: Array<u8[]>
}
