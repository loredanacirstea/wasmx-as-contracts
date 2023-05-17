export function ab2arr<T>(ab: ArrayBuffer): Array<T> {
    let res = new Array<T>(ab.byteLength >> alignof<T>());
    memory.copy(res.dataStart, changetype<usize>(ab), ab.byteLength);
    return res;
}
