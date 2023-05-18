export function u8ArrayToArrayBuffer(u8Array: u8[]): ArrayBuffer {
    const length = u8Array.length;
    const buffer = new ArrayBuffer(length);
    const uint8View = Uint8Array.wrap(buffer);

    for (let i = 0; i < length; i++) {
      uint8View[i] = u8Array[i];
    }
    return buffer;
}

export function arrayBufferTou8Array(buffer: ArrayBuffer): u8[] {
    console.log(buffer.toString())
    const length = buffer.byteLength;
    const uint8View = Uint8Array.wrap(buffer);
    const u8Array: u8[] = [];

    for (let i = 0; i < length; i++) {
        u8Array[i] =  uint8View[i];
    }
    return u8Array;
}
