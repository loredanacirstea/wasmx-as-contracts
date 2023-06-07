// 1024 * 64 = 64KiB
const PAGE_SIZE: usize = 65536;

export class Memory {
    startPointer: usize;
    endPointer: usize;
    endUsedPointer: usize = 0;
    pages: usize = 1;

    constructor() {
        const startPointer = heap.alloc(PAGE_SIZE);
        this.startPointer = startPointer;
        this.endPointer = startPointer + PAGE_SIZE;
    }

    grow(): void {
        this.pages = this.pages + 1;
        const newSize = PAGE_SIZE * this.pages;
        const newPointer = heap.realloc(this.startPointer, newSize);
        this.startPointer = newPointer;
        this.endPointer = newPointer + newSize;
    }

    load(offset: u32, length: u32): u8[] {
        const _offset = this.startPointer + usize(offset);
        const _end = _offset + usize(length);

        if (usize(length) > PAGE_SIZE) {
            throw new Error("cannot load more than PAGE_SIZE");
        }
        if (this.endPointer < _end) {
            this.grow();
        }
        const arr: u8[] = new Array<u8>(length);
        for (let i: i32 = 0; i < i32(length); i++) {
            arr[i] = load<u8>(_offset + usize(i));
        }
        return arr;
    }

    store(part: Array<u8>, offset: u32): void {
        const _offset = this.startPointer + usize(offset);
        const _end = _offset + usize(part.length);

        if (usize(part.length) > PAGE_SIZE) {
            throw new Error("cannot store more than PAGE_SIZE");
        }
        if (this.endPointer < _end) {
            this.grow();
        }
        for (let i: i32 = 0; i < part.length; i++) {
            store<u8>(_offset + usize(i), part[i]);
        }
        if (this.endUsedPointer < _end) {
            this.endUsedPointer = _end;
        }
    }

    store8(value: u8, offset: u32): void {
        const _offset = this.startPointer + usize(offset);
        const _end = _offset + 1;
        if (this.endPointer < _end) {
            this.grow();
        }
        store<u8>(_offset, value);
        if (this.endUsedPointer < _end) {
            this.endUsedPointer = _end;
        }
    }

    storeUint8Array(part: Uint8Array, offset: u32): void {
        const _offset = this.startPointer + usize(offset);
        const _end = _offset + usize(part.length);

        if (usize(part.length) > PAGE_SIZE) {
            throw new Error("cannot store more than PAGE_SIZE");
        }
        if (this.endPointer < _end) {
            this.grow();
        }
        for (let i: i32 = 0; i < part.length; i++) {
            store<u8>(_offset + usize(i), part[i]);
        }
        if (this.endUsedPointer < _end) {
            this.endUsedPointer = _end;
        }
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

    static loadFromUint8Array(arr: Uint8Array, offset: u32, length: u32): Uint8Array {
        const maxlength = offset + length;
        arr = Memory.fillUint8Array(arr, maxlength);
        return arr.slice(offset, maxlength);
    }

    static fillUint8Array(arr: Uint8Array, maxlength: u32): Uint8Array {
        if (u32(arr.length) < maxlength) {
            const newarr = new Uint8Array(maxlength);
            newarr.set(arr);
            return newarr;
        }
        return arr
    }
}
