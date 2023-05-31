import { BigInt } from "./bn";
import * as ERROR from './error';

export class GasMeter {
    gasLimit: BigInt;
    usedGas: BigInt;
    refundedGas: BigInt;

    constructor(gasLimit: BigInt, usedGas: BigInt = BigInt.fromU32(0), refundedGas: BigInt = BigInt.fromU32(0)) {
        this.gasLimit = gasLimit;
        this.usedGas = usedGas;
        this.refundedGas = refundedGas;
    }

    getGas(): BigInt {
        return this.usedGas.sub(this.refundedGas);
    }

    getGasLeft(): BigInt {
        const gas = this.gasLimit.sub(this.usedGas);
        return gas.add(this.refundedGas);
    }

    useGas(gas: BigInt): void {
        this.usedGas = this.usedGas.add(gas);

        if (BigInt.gt(this.getGas(), this.gasLimit)) {
            throw new Error(`${ERROR.OUT_OF_GAS}. Using ${gas.toString()}. Gas used: ${this.getGas().toString()}. Gas limit: ${this.gasLimit.toString()}`);
        }
    }

    refundGas(gas: BigInt): void {
        // can be negative due to SSTORE EIP2200;
        if (gas.isZero()) return;
        this.refundedGas = this.refundedGas.add(gas);
    }

    clone(): GasMeter {
        return new GasMeter(this.gasLimit, this.usedGas, this.refundedGas);
    }

    useOpcodeGas(opcodeName: string): void {
        this.useGas(BigInt.fromU32(3));
    }

    // TODO
    getPrice(opcodeName: string): BigInt {
        return BigInt.fromU32(0);
    }
}
