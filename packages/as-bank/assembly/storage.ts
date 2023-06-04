import * as wasmx from './wasmx';
import { AccAddress, Coin, DenomMetadata } from './types';
import { BigInt } from './bn';

// Supply Index: 0x0 | byte(denom) -> byte(amount)
// Denom Metadata Index: 0x1 | byte(denom) -> ProtocolBuffer(Metadata)
// Balances Index: 0x2 | byte(address length) | []byte(address) | []byte(balance.Denom) -> ProtocolBuffer(balance)
// Reverse Denomination to Address Index: 0x03 | byte(denom) | 0x00 | []byte(address) -> 0

export function setSupply(denom: string, amount: BigInt): void {
    const key = getSupplyKey(denom);
    wasmx.storageStore(key.buffer, amount.toArrayBufferLe())
}

export function getSupply(denom: string): BigInt {
    const key = getSupplyKey(denom);
    const value = wasmx.storageLoad(key.buffer);
    return new BigInt(value);
}

export function removeSupply(denom: string): void {
    const key = getSupplyKey(denom);
    wasmx.storageRemove(key.buffer);
}

export function setDenomMetadata(denom: string, metadata: DenomMetadata): void {
    const key = getDenomMetadataKey(denom);
    // TODO marshal metadata
    const value = new ArrayBuffer(32);
    wasmx.storageStore(key.buffer, value)
}

export function setBalance(address: AccAddress, denom: string, amount: BigInt) {
    const key = getBalancesKey(address, denom);
    wasmx.storageStore(key.buffer, amount.toArrayBuffer());
}

export function getBalance(address: AccAddress, denom: string): BigInt {
    const key = getBalancesKey(address, denom);
    const value = wasmx.storageLoad(key.buffer);
    return new BigInt(value);
}

function getSupplyKey(denom: string): Uint8Array {
    const denombz = Uint8Array.wrap(String.UTF8.encode(denom));
    const key = new Uint8Array(denombz.byteLength + 1);
    key.set([0x00], 0);
    key.set(denombz, 1);
    return key;
}

function getDenomMetadataKey(denom: string): Uint8Array {
    const denombz = Uint8Array.wrap(String.UTF8.encode(denom));
    const key = new Uint8Array(denombz.byteLength + 1);
    key.set([0x01], 0);
    key.set(denombz, 1);
    return key;
}

function getBalancesKey(address: AccAddress, denom: string): Uint8Array {
    const len = BigInt.fromU32(u32(address.byteLength), 2).toUint8ArrayLe();
    const denombz = Uint8Array.wrap(String.UTF8.encode(denom));
    const key = new Uint8Array(len.length + address.byteLength + denombz.byteLength + 1);
    key.set([0x02], 0);
    key.set(len, 1);
    key.set(address, 3);
    key.set(denombz, 3 + address.byteLength);
    return key;
}
