export class Memory {
    mem: Array<u8>;

    constructor(snapshotMem: Array<u8>) {
        this.mem = snapshotMem;
    }

    fill(maxlength: u32): void {
        this.mem = Memory.fill(this.mem, maxlength);
    }

    load(offset: u32, length: u32): u8[] {
        const maxlength = offset + length;
        this.fill(maxlength);
        return this.mem.slice(offset, maxlength);
    }

    store(part: Array<u8>, offset: u32): void {
        const maxlength = offset + part.length;
        this.fill(maxlength);
        for (let i = 0; i < part.length; i++) {
            this.mem[i + offset] = part[i];
        }
    }

    store8(value: u8, offset: u32): void {
        this.mem[offset] = value;
    }

    static fill(arr: Array<u8>, maxlength: u32): u8[] {
        if (u32(arr.length) < maxlength) {
            arr = arr.concat(new Array<u8>(maxlength - u32(arr.length)))
        }
        return arr
    }

    static load(arr: Array<u8>, offset: u32, length: u32): u8[] {
        const maxlength = offset + length;
        arr = Memory.fill(arr, maxlength);
        return arr.slice(offset, maxlength);
    }
}
