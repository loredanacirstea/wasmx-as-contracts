import { BigInt } from "as-bigint/assembly";
import * as ERROR from './error';

export class GasMeter {
    gasLimit: BigInt;
    usedGas: BigInt;
    refundedGas: BigInt;

    constructor(gasLimit: BigInt, usedGas: BigInt = BigInt.from(0), refundedGas: BigInt = BigInt.from(0)) {
        this.gasLimit = gasLimit;
        this.usedGas = usedGas;
        this.refundedGas = refundedGas;
    }

    getGas(): BigInt {
        return BigInt.sub(this.usedGas, this.refundedGas);
    }

    getGasLeft(): BigInt {
        const gas = BigInt.sub(this.gasLimit, this.usedGas)
        return BigInt.add(gas, this.refundedGas);
    }

    useGas(gas: BigInt): void {
        this.usedGas = BigInt.add(this.usedGas, gas);

        if (BigInt.gt(this.getGas(), this.gasLimit)) {
            throw new Error(`${ERROR.OUT_OF_GAS}. Using ${gas.toString()}. Gas used: ${this.getGas().toString()}. Gas limit: ${this.gasLimit.toString()}`);
        }
    }

    refundGas(gas: BigInt): void {
        // can be negative due to SSTORE EIP2200;
        if (gas.isZero()) return;
        this.refundedGas = BigInt.add(this.refundedGas, gas);
    }

    clone(): GasMeter {
        return new GasMeter(this.gasLimit, this.usedGas, this.refundedGas);
    }

    useOpcodeGas(opcodeName: string): void {
        this.useGas(BigInt.from(3));
    }

    // TODO
    getPrice(opcodeName: string): BigInt {
        return BigInt.from(0);
    }
}
