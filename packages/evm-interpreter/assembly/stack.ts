import { BigInt } from "./bn";

export class Stack {
    stack: Array<BigInt> = new Array<BigInt>(2048);

    get(index: u32): BigInt {
        return this.stack[index];
    }

    last(): BigInt {
        return this.stack[this.stack.length - 1];
    }

    length(): i32 {
        return this.stack.length;
    }

    push(value: BigInt): void {
        this.stack.push(value);
    }

    pop(): BigInt {
        return this.stack.pop();
    }

    dup(x: i32): BigInt {
        if (x > this.stack.length) throw new Error(`Invalid DUP${x} ; stack length: ${this.stack.length}`);
        const value = this.stack[this.stack.length - x];
        this.stack.push(value);
        return value;
    }

    swap(x: i32): void {
        if (x >= this.stack.length) {
            throw new Error(`Invalid SWAP${x} ; stack length: ${this.stack.length}`);
        }
        const index = this.stack.length - x - 1;
        const last = this.pop();
        const middle = this.stack[index];
        const pre = this.stack.slice(0, index);
        const post = this.stack.slice(index + 1);
        pre.push(last);
        this.stack = pre.concat(post);
        this.stack.push(middle);
    }
}

