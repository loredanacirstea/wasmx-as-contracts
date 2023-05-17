export class Memory {
    mem: Array<u8>;

    constructor(snapshotMem: Array<u8>) {
        this.mem = snapshotMem;
    }

    fill(maxlength: i32): void {
        if (this.mem.length < maxlength) {
            this.mem.fill(0, this.mem.length, maxlength);
        }
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
}
