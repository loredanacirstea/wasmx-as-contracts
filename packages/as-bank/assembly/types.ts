import {BigInt} from './bn';

export type AccAddress = Uint8Array;

export class Coin {
    denom: string
    amount: BigInt // u128
    constructor(denom: string, amount: BigInt) {
        this.denom = denom;
        this.amount = amount;
    }

    GetDenom(): string {
        return this.denom;
    }

    GetAmount(): BigInt {
        return this.amount;
    }

    Add(coin: Coin): void {
        this.amount = this.amount.add(coin.GetAmount());
    }

    Sub(coin: Coin): void {
        this.amount = this.amount.sub(coin.GetAmount());
    }

    IsZero(): bool {
        return this.amount.isZero();
    }
}

export type Coins = Coin[];

export class Balance {

}

export class DenomMetadata {}

export class Params {}

export class SendEnabled {
    denom!: string;
    enabled!: bool;
}
