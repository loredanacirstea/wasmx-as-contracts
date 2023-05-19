import { u256 } from 'as-bignum/assembly';

export class Stack {
    stack: Array<u256>;

    constructor(snapshotStack: Array<u256>) {
        this.stack = snapshotStack;
    }

    get(index: u32): u256 {
        return this.stack[index];
    }

    last(): u256 {
        return this.stack[this.stack.length - 1];
    }

    length(): i32 {
        return this.stack.length;
    }

    push(value: u256): void {
        this.stack.push(value);
    }

    pop(): u256 {
        return this.stack.pop();
    }

    dup(x: i32): void {
        if (x > this.stack.length) throw new Error(`Invalid DUP${x} ; stack length: ${this.stack.length}`);
        const value = this.stack[this.stack.length - x];
        this.stack.push(value);
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

