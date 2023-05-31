import { BigInt } from "./bn";
import { STACK_UNDERFLOW } from "./error";

export class Stack {
    stack: StaticArray<BigInt> = new StaticArray<BigInt>(2048);
    len: i32 = 0;

    get(index: u32): BigInt {
        return this.stack[index];
    }

    last(): BigInt {
        return this.stack[this.len - 1];
    }

    length(): i32 {
        return this.len;
    }

    push(value: BigInt): void {
        this.stack[this.len] = value;
        this.len += 1;
    }

    pop(): BigInt {
        if (this.len === 0) {
            throw new Error(STACK_UNDERFLOW);
        }
        const v = this.stack[this.len - 1];
        this.len -= 1;
        return v;
    }

    dup(x: i32): BigInt {
        if (x > this.len) throw new Error(`Invalid DUP${x} ; stack length: ${this.len}`);
        const value = this.stack[this.len - x].clone();
        this.push(value);
        return value;
    }

    swap(x: i32): void {
        if (x >= this.len) {
            throw new Error(`Invalid SWAP${x} ; stack length: ${this.len}`);
        }
        const index = this.len - x - 1;
        const last = this.stack[this.len - 1];
        const middle = this.stack[index];
        this.stack[index] = last;
        this.stack[this.len - 1] = middle;
    }
}

