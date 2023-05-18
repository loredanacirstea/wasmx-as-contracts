import { u256 } from 'as-bignum/assembly';
import * as ERROR from './error';

export class GasMeter {
    gasLimit: u256;
    usedGas: u256;
    refundedGas: u256;

    constructor(gasLimit: u256, usedGas: u256 = new u256(0), refundedGas: u256 = new u256(0)) {
        this.gasLimit = gasLimit;
        this.usedGas = usedGas;
        this.refundedGas = refundedGas;
    }

    getGas(): u256 {
        return u256.sub(this.usedGas, this.refundedGas);
    }

    getGasLeft(): u256 {
        const gas = u256.sub(this.gasLimit, this.usedGas)
        return u256.add(gas, this.refundedGas);
    }

    useGas(gas: u256): void {
        this.usedGas = u256.add(this.usedGas, gas);

        if (u256.gt(this.getGas(), this.gasLimit)) {
            throw new Error(`${ERROR.OUT_OF_GAS}. Using ${gas.toString()}. Gas used: ${this.getGas().toString()}. Gas limit: ${this.gasLimit.toString()}`);
        }
    }

    refundGas(gas: u256): void {
        // can be negative due to SSTORE EIP2200;
        if (gas.isZero()) return;
        this.refundedGas = u256.add(this.refundedGas, gas);
    }

    clone(): GasMeter {
        return new GasMeter(this.gasLimit, this.usedGas, this.refundedGas);
    }

    useOpcodeGas(opcodeName: string): void {
        this.useGas(new u256(3));
    }

    // TODO
    getPrice(opcodeName: string): u256 {
        return new u256(0);
    }
}
