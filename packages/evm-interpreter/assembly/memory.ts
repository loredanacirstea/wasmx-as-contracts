export class Memory {
    mem: Array<u8>;

    constructor(snapshotMem: Array<u8>) {
        this.mem = snapshotMem;
    }

    fill(maxlength: i32): void {
        this.mem = Memory.fill(this.mem, maxlength);
    }

    load(offset: i32, length: i32): u8[] {
        const maxlength = offset + length;
        this.fill(maxlength);
        return this.mem.slice(offset, maxlength);
    }

    store(part: Array<u8>, offset: i32): void {
        const maxlength = offset + part.length;
        this.fill(maxlength);
        for (let i = 0; i < part.length; i++) {
            this.mem[i + offset] = part[i];
        }
    }

    static fill(arr: Array<u8>, maxlength: i32): u8[] {
        if (arr.length < maxlength) {
            arr.fill(0, arr.length, maxlength);
        }
        return arr
    }

    static load(arr: Array<u8>, offset: i32, length: i32): u8[] {
        const maxlength = offset + length;
        arr = Memory.fill(arr, maxlength);
        return arr.slice(offset, maxlength);
    }
}
