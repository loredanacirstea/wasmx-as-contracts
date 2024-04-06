const MAX32: u64 = u64(Math.pow(2, 32));
const MAX16: u32 = u32(Math.pow(2, 16));

export class tally {
    buf: ArrayBuffer;
    // a64: Uint64Array;
    a32: Uint32Array;
    a16: Uint16Array;
    a8: Uint8Array;

    constructor(buf: ArrayBuffer, littleEndian: bool = false) {
        this.buf = buf;
        // this.a64 = Uint64Array.wrap(buf);
        this.a32 = Uint32Array.wrap(buf);
        this.a16 = Uint16Array.wrap(buf);
        this.a8 = Uint8Array.wrap(buf);
        if (!littleEndian) {
            this.a8.reverse();
        }
    }

    @operator('+')
    static __add(a: tally, b: tally): tally  {
        return a.add(b)
    }

    // @operator('+')
    // __add(other: tally): tally  {
    //     return this.add(other)
    // }

    @operator('-')
    static __sub(a: tally, b: tally): tally  {
        return a.sub(b)
    }

    // @operator('-')
    // __sub(other: tally): tally  {
    //     return this.sub(other)
    // }

    @operator('*')
    static __mul(a: tally, b: tally): tally  {
        return a.mul(b)
    }

    // @operator('*')
    // __mul(other: tally): tally  {
    //     return this.mul(other)
    // }

    @operator('/')
    static __div(a: tally, b: tally): tally  {
        return a.div(b)
    }

    // @operator('/')
    // __div(other: tally): tally  {
    //     return this.div(other)
    // }

    // "%"
    // "**"

    @operator('>')
    static ___gt(a: tally, b: tally): bool  {
        return a.gt(b)
    }

    // @operator('>')
    // ___gt(other: tally): bool  {
    //     return this.gt(other)
    // }

    @operator('<')
    static ___lt(a: tally, b: tally): bool  {
        return a.lt(b)
    }

    // @operator('<')
    // ___lt(other: tally): bool  {
    //     return this.lt(other)
    // }

    @operator('>=')
    static ___gte(a: tally, b: tally): bool  {
        return a.gte(b)
    }

    // @operator('>=')
    // ___gte(other: tally): bool  {
    //     return this.gte(other)
    // }

    @operator('<=')
    static ___lte(a: tally, b: tally): bool  {
        return a.lte(b)
    }

    // @operator('<=')
    // ___lte(other: tally): bool  {
    //     return this.lte(other)
    // }

    @operator('==')
    static ___eq(a: tally, b: tally): bool  {
        return a.eq(b)
    }

    // @operator('==')
    // ___eq(other: tally): bool  {
    //     return this.eq(other)
    // }

    @operator('!=')
    static ___neq(a: tally, b: tally): bool  {
        return !a.eq(b)
    }

    // @operator('!=')
    // ___neq(other: tally): bool  {
    //     return !this.eq(other)
    // }

    setU32(value: u32): void {
        this.a32[0] = value;
    }

    setU64(value: u64): void {
        // this.a64[this.a64.length - 1] = value;
        // arr[i] = c % MAX_VALUES.max32
        // c = Math.floor(c / MAX_VALUES.max32)
        this.a32[0] = u32(value % MAX32);
        this.a32[1] = u32(Math.floor(f64(value) / f64(MAX32)));
    }

    add(b: tally): tally {
        return tally.add(this, b);
    }

    sub(b: tally): tally {
        return tally.sub(this, b);
    }

    mul(b: tally): tally {
        return tally.mul(this, b);
    }

    div(b: tally): tally {
        return tally.div(this, b);
    }

    mod(b: tally): tally {
        return tally.mod(this, b);
    }

    pow(b: tally): tally {
        return tally.pow(this, b);
    }

    pown(b: u64): tally {
        return tally.pown(this, b);
    }

    abs(): tally {
        return tally.abs(this);
    }

    gt(b: tally): bool {
        return tally.gt(this, b);
    }

    gt_t(b: tally): tally {
        return tally.gt_t(this, b);
    }

    lt(b: tally): bool {
        return tally.lt(this, b);
    }

    lt_t(b: tally): tally {
        return tally.lt_t(this, b);
    }

    eq(b: tally): bool {
        return tally.eq(this, b);
    }

    eq_t(b: tally): tally {
        return tally.eq_t(this, b);
    }

    gte(b: tally): bool {
        return tally.gte(this, b);
    }

    gte_t(b: tally): tally {
        return tally.gte_t(this, b);
    }

    lte(b: tally): bool {
        return tally.lte(this, b);
    }

    isZero(): bool {
        return tally.isZero(this);
    }

    isZero_t(): tally {
        return tally.isZero_t(this);
    }

    bitwiseAnd(b: tally): tally {
        return tally.and(this, b);
    }

    bitwiseOr(b: tally): tally {
        return tally.or(this, b);
    }

    bitwiseXor(b: tally): tally {
        return tally.xor(this, b);
    }

    shl(b: u32): tally {
        return tally.shl(this, b);
    }

    shr(b: u32): tally {
        return tally.shr(this, b);
    }

    neg(): tally {
        return tally.neg(this);
    }

    isNeg(): bool {
        return tally.isNeg(this);
    }

    sdiv(b: tally): tally {
        return tally.sdiv(this, b);
    }

    smod(b: tally): tally {
        return tally.smod(this, b);
    }

    slt_t(b: tally): tally {
        return tally.slt_t(this, b);
    }

    sgt_t(b: tally): tally {
        return tally.sgt_t(this, b);
    }

    // bitsno
    sar(b: tally, maxbits: u32 = 256): tally {
        return tally.sar(this, b, maxbits);
    }

    toI32(): i32 {
        return this.a32[0];
    }

    toU32(): u32 {
        return this.a32[0];
    }

    toU64(): u64 {
        return this.a32[0] + this.a32[1] * MAX32;
    }

    toI64(): i64 {
        // TODO sign
        const isneg = this.isNeg()
        const value = i64(this.a32[0]) + i64(this.a32[1]) * i64(MAX32)
        return isneg ? (-value) : value
    }

    toU8Array(littleEndian: bool = false): Array<u8> {
        if (littleEndian) return this.toU8ArrayLe();
        return this.toU8ArrayBe();
    }

    toU8ArrayLe(): Array<u8> {
        let arr: u8[] = [];
        for (let i = 0; i < this.a8.length; i++) {
            arr[i] = this.a8[i];
        }
        return arr;
    }

    toU8ArrayBe(): Array<u8> {
        let arr: u8[] = [];
        const len = this.a8.length;
        for (let i = 0; i < len; i++) {
            arr[i] = this.a8[len - 1 - i];
        }
        return arr;
    }

    toI32Array(littleEndian: bool = false): Array<i32> {
        if (littleEndian) return this.toI32ArrayLe();
        return this.toI32ArrayBe();
    }

    toI32ArrayLe(): Array<i32> {
        let arr: i32[] = [];
        for (let i = 0; i < this.a32.length / 2; i++) {
            arr[i] = i32(this.a32[i]);
        }
        return arr;
    }

    toI32ArrayBe(): Array<i32> {
        let arr: i32[] = [];
        const len = this.a32.length;
        for (let i = 0; i < len; i++) {
            arr[i] = i32(this.a32[len - 1 - i]);
        }
        return arr;
    }

    toArrayBuffer(littleEndian: bool = false): ArrayBuffer {
        if (littleEndian) return this.toArrayBufferLe();
        return this.toArrayBufferBe();
    }

    toArrayBufferLe(): ArrayBuffer {
        return this.buf
    }

    toArrayBufferBe(): ArrayBuffer {
        return this.a8.slice(0).reverse().buffer;
    }

    toUint8Array(littleEndian: bool = false, size: i32 = 0): Uint8Array {
        if (littleEndian) return this.toUint8ArrayLe(size);
        return this.toUint8ArrayBe(size);
    }

    toUint8ArrayLe(size: i32 = 0): Uint8Array {
        if (size === 0) return this.a8.slice(0);;
        if (size > this.a8.byteLength) {
            const newarr = new Uint8Array(size);
            newarr.set(this.a8);
            return newarr;
        }
        return this.a8.slice(0, size);
    }

    toUint8ArrayBe(size: i32 = 0): Uint8Array {
        if (size === 0) return this.a8.slice(0).reverse();
        if (size > this.a8.byteLength) {
            const newarr = new Uint8Array(size);
            newarr.set(this.a8.slice(0).reverse(), size - this.a8.byteLength);
            return newarr;
        }
        return this.a8.slice(0, size).reverse();
    }

    // this is used by as-json to stringify BigInt
    toString(radix: i32 = 10, byteLength: i32 = 0, littleEndian: bool = false, usePrefix: bool = false): string {
        if (radix == 0) return "[" + this.a8.slice(0).reverse().toString() + "]";
        let res = this.toString_(radix)

        if (radix == 16) {
            if (byteLength > 0) {
                res = processZeros(res, byteLength);
            }
            if (usePrefix) res = "0x" + res;
        }

        return res;
    }

    toString_(radix: i32 = 10): string {
        if (radix < 2 || radix > 16) {
          throw new RangeError("BigInt only prints strings in radix 2 through 16");
        }
        if (this.isZero()) return "0";
        let res: string = this.isNeg() ? "-" : "";
        let t: tally = this.abs();
        const zero: tally = tally.fromU32(0);
        const codes: i32[] = [];
        const radixU: u32 = <u32>radix;
        while (!t.eq(zero)) {
          const d: i32 = t.mod(tally.fromU32(radixU)).toI32();
          t = t.div(tally.fromU32(radixU));
          if (d < 10) {
            codes.push(d + 48);
          } else {
            codes.push(d + 87);
          }
        }
        codes.reverse();
        res += String.fromCharCodes(codes);
        return res;
    }

    clone(): tally {
        let f = this.a32.slice(0)
        return tally.fromUint32Array(f);
    }

    mask(byteLength: i32 = 32): tally {
        if (this.a8.length <= byteLength) return this;
        const part = this.toU8Array().slice(0, byteLength);
        return tally.fromU8Array(part, byteLength);
    }

    static empty(byteLength: i32 = 32): tally {
        const buf = new ArrayBuffer(byteLength);
        return new tally(buf);
    }

    static zero(byteLength: i32 = 32): tally {
        return tally.empty(byteLength)
    }

    static one(byteLength: i32 = 32): tally {
        return tally.fromU32(1, byteLength)
    }

    static fromU32(value: u32, size: i32 = 32): tally {
        const v = tally.empty(size);
        v.setU32(value);
        return v;
    }

    static fromU64(value: u64, size: i32 = 32): tally {
        const v = tally.empty(size);
        v.setU64(value);
        return v;
    }

    static fromU8Array(value: Array<u8>, bytesLength: i32 = 32, littleEndian: bool = false): tally {
        if (bytesLength < value.length) throw new Error("invalid length");
        const v = tally.empty(bytesLength);
        if (littleEndian) {
            v.a8.set(value);
        } else {
            v.a8.set(value.reverse());
        }
        return v;
    }

    static fromUint8Array(value: Uint8Array, bytesLength: i32 = 0, littleEndian: bool = false): tally {
        if (bytesLength == 0) bytesLength = i32(Math.max(value.byteLength, 4));
        if (bytesLength < value.byteLength) throw new Error("invalid length");
        const v = tally.empty(bytesLength);
        if (littleEndian) {
            v.a8.set(value);
        } else {
            v.a8.set(value.reverse());
        }
        return v;
    }

    static fromUint16Array(value: Uint16Array, bytesLength: i32 = 0): tally {
        if (bytesLength == 0) bytesLength = value.byteLength;
        if (bytesLength < value.byteLength) throw new Error("invalid length");
        const v = tally.empty(bytesLength);
        v.a16.set(value);
        return v;
    }

    static fromUint32Array(value: Uint32Array, bytesLength: i32 = 0): tally {
        if (bytesLength == 0) bytesLength = value.byteLength;
        if (bytesLength < value.byteLength) throw new Error("invalid length");
        const v = tally.empty(bytesLength);
        v.a32.set(value);
        return v;
    }

    // static fromUint64Array(value: Uint64Array, bytesLength: i32 = 0): tally {
    //     console.log("-fromUint64Array-" + value.toString());
    //     if (bytesLength == 0) bytesLength = value.byteLength;
    //     if (bytesLength < value.byteLength) throw new Error("invalid length");
    //     const v = tally.empty(bytesLength);
    //     v.a64.set(value);
    //     return v;
    // }

    static add(a: tally, b: tally): tally {
        let l = i32(Math.max(a.a32.byteLength, b.a32.byteLength));
        const len = i32(Math.ceil(l/4));
        let c = tally.empty((len+1)*4);
        let _a = tally.empty(len * 4);
        _a.a32.set(a.a32, 0);
        let _b = tally.empty(len * 4);
        _b.a32.set(b.a32, 0);
        for (let i=0; i<len; i++) {
            let t: u64 = u64(_a.a32[i]) + u64(_b.a32[i]);
            if (t > (MAX32 - 1)){
                c.a32[i+1] = 1
            }
            c.a32[i] = u32((c.a32[i] + t) % MAX32);
        }
        if (c.a32[len] > 0) {
            console.log("add overflow")
            return c;
        }
        return tally.fromUint32Array(c.a32.slice(0, c.a32.length-1), len * 4);
    }

    static mul(a: tally, b: tally): tally {
        let mlen = a.a32.byteLength + b.a32.byteLength
        let c = tally.empty(mlen)
        let carry: u32 = 0;
        let temp: u64 = 0;
        for (let i=0; i<a.a16.length; i++) {
            carry = 0
            for (let j=0; j<b.a16.length; j++) {
                temp = u64(c.a16[i + j]) + u64(carry) + u64(a.a16[i]) * u64(b.a16[j])
                carry = u32(Math.floor(f64(temp) / MAX16));
                c.a16[i + j] = u32(temp % u64(MAX16))
            }
            c.a16[i + b.a16.length] = carry
        }
        if (carry) {
            console.log("mul overflow");
        }
        const len = significantLength32(c.a32);
        if (len < c.a32.length) {
            c = tally.fromUint32Array(c.a32.slice(0, len));
        }
        return c;
    }

    static pow(a: tally, b: tally): tally {
        const power = b.toU64();
        return tally.pown(a, power);
    }

    static pown(a: tally, power: u64): tally {
        if (power == 0) return tally.fromU32(1);
        let result = a.clone();
        for (let i: u64 = 1; i < power; i++) {
            result = tally.mul(result, a);
        }
        return result;
    }

    static sub(a: tally, b: tally): tally {
        let l = i32(Math.max(a.a32.byteLength, b.a32.byteLength))
        let c = tally.empty(l)
        let _a = tally.empty(l)
        _a.a8.set(a.a8, 0)
        let _b = tally.empty(l)
        _b.a8.set(b.a8, 0)
        for (let i=0;i<Math.ceil(l/4);i++) {
            let u = _a.a32[i] < _b.a32[i]
            let t: u64 = u64(_a.a32[i])
            if (u) {
                _a = tally._carry(_a,i+1)
                t = t +  MAX32
            }
            c.a32[i] = u32(t - _b.a32[i])
        }
        return c;
    }

    static _carry(a: tally, i: i32): tally {
        if (i === a.a32.length) {
            a.a32[i-1] = u32(MAX32-1);
            return a
        }
        a.a32[i] = a.a32[i] - 1
        if (a.a32[i] === u32(MAX32-1)) {
            return tally._carry(a,i+1)
        }
        return a
    }

    static _div(a: tally, b: tally): Array<tally> {
        const mlen = i32(Math.max(a.a16.length, b.a16.length));
        let cat = new Uint16Array(mlen);
        let set = new Uint16Array(mlen);

        if (tally.isZero(b) || tally.isZero(a)) {
            return [tally.empty(32), tally.empty(32)]
        }
        if (tally.__gt(b, a, mlen - 1)) {
          return [tally.empty(32), tally.fromUint16Array(a.a16.slice(0), a.a16.byteLength)];
        }

        const slen = significantLength16(b.a16);
        const slena = significantLength16(a.a16);
        let pos = slena - slen;

        for (let i = 0; i < slen; i++) {
          set[i] = a.a16[i + pos];
        }

        const f = tally._findDiv(set, b);
        cat[0] = f.catMax;
        set = f.v.a16;

        let reps = 0;
        while (pos > 0) {
            reps ++;
            if (tally.gt(b, tally.fromUint16Array(set))) {
                set = _div_shr(set);
                pos --;
                set[0] = a.a16[pos];
            }

            const f = tally._findDiv(set, b);
            cat = _div_shr(cat);
            cat[0] = f.catMax;
            set = f.v.a16;

            if (reps > 100000) {
                console.log('reps' + reps.toString())
                return [tally.fromUint16Array(cat), tally.fromUint16Array(set)]
            }
        }
        return  [tally.fromUint16Array(cat), tally.fromUint16Array(set)]
    }

    // n1 > n2
    // n1.length <= n2.length + 1
    static _findDiv(n1: Uint16Array, t2: tally): FindDiv {
        const n2 = t2.a16;
        const t1 = tally.fromUint16Array(n1);
        const len1 = significantLength16(n1);
        const len2 = significantLength16(n2);
        let catMax: u32;

        if (len1 < len2) {
            return new FindDiv(0, t1);
        }
        if (len2 === len1) {
            catMax = u32(Math.floor((u32(n1[len1 - 1]) + 1) / u32(n2[len2-1])));
        }
        else {
            const divident: u32 = u32(n1[len1 - 1]) * MAX16 + u32(n1[len1 - 2]);
            const cat: u32 = u32(Math.floor(divident / u32(n2[len2-1])));
            catMax = cat < MAX16 ? cat : (MAX16 - 1);
        }
        const prod1 = tally.mul(t2, tally.fromU32(catMax, 32));
        if (tally.eq(prod1, t1)) {
            return new FindDiv(catMax, tally.empty(32));
        }
        if (tally.lt(prod1, t1)) {
            return new FindDiv(catMax, tally.sub(t1, prod1));
        }

        const catMin = u32(Math.floor(u32(n1[len1 - 1]) / (u32(n2[len2-1]) + 1)));

        catMax = tally.__findDiv_(t2, t1, catMax + 1, catMin);
        return new FindDiv(catMax, tally.sub(t1, tally.mul(t2, tally.fromU32(u32(catMax), 32))));
    }

    static __findDiv_(q: tally, value: tally, max: u32, min: u32): u32 {
        const current = u32(Math.floor((max + min) / 2));
        return tally.__findDiv(q, value, max, min, current)
    }

    static __findDiv(q: tally, value: tally, max: u32, min: u32, current: u32): u32 {
        const v = tally.mul(q, tally.fromU32(u32(current), 32));
        if (tally.eq(v, value)) return current;
        if (tally.gt(v, value)) {
            const next = u32(Math.floor((current + min) / 2));
            if (next === current) return next;
            return tally.__findDiv(q, value, current, min, next);
        }
        const next = u32(Math.floor((current + max) / 2))
        if (next === current) return next;
        return tally.__findDiv(q, value, max, current, next);
    }

    static div(a: tally, b: tally): tally {
        let c = tally._div(a,b)
        return c[0];
    }

    static mod(a: tally, b: tally): tally {
        let c = tally._div(a,b)
        return c[1];
    }

    static sdiv(a: tally, b: tally): tally {
        const isneg1 = a.isNeg();
        const isneg2 = b.isNeg();
        const isneg3 = ((isneg1 ? -1 : 1) * (isneg2 ? -1 : 1) === -1);
        const a_ = isneg1 ? a.neg() : a;
        const b_ = isneg2 ? b.neg() : b;
        let resp = tally._div(a_, b_);
        const c = resp[0];
        if (isneg3) return c.neg();
        return c;
    }

    static smod(a: tally, b: tally): tally {
        const isneg1 = a.isNeg();
        const isneg2 = b.isNeg();
        const a_ = isneg1 ? a.neg() : a;
        const b_ = isneg2 ? b.neg() : b;
        let resp = tally._div(a_, b_);
        const c = resp[1];
        if (isneg1) return c.neg();
        return c;
    }

    static sar(value: tally, bitsno: tally, maxbits: u32 = 256): tally {
        const msb = tally.isNeg(value) ? 1 : 0;
        const _bitsno = bitsno.toI32();
        let v = value.shr(_bitsno);
        if (msb == 0) return v;
        for (let i = 0; i < _bitsno; i++) {
            v = v.add(tally.fromU32(2).pown(maxbits - 1 - i));
        }
        return v;
    }

    static addmod(a: tally, b: tally, c: tally): tally {
        let d = tally.add(a, b)
        return tally.mod(d, c)
    }

    static mulmod(a: tally, b: tally, c: tally): tally {
        let d = tally.mul(a,b)
        return tally.mod(d, c);
    }

    static lt_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.__lt(a,b,a.a32.length-1)? 1:0
        return c;
    }

    static lt(a: tally, b: tally): bool {
        const i = i32(Math.max(a.a32.length, b.a32.length)) - 1;
        return tally.__lt(a, b, i);
    }

    static lte(a: tally, b: tally): bool {
        return tally.lt(a, b) || tally.eq(a, b);
    }

    static __lt(a: tally, b: tally, i: i32): bool {
        // console.log('---__lt-' + i.toString() + "--" + a.a8.toString() + "--" + b.a8.toString())
        if (i === -1) return false
        const av = a.a32.length > i ? a.a32[i] : 0;
        const bv = b.a32.length > i ? b.a32[i] : 0;
        if (bv < av) return false
        if (bv == av) return (true && tally.__lt(a, b, i-1))
        return true;
    }

    static gt_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.gt(a,b)? 1:0
        return c
    }

    static gte_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.gte(a,b)? 1:0
        return c
    }

    static gte(a: tally, b: tally): bool {
        return tally.gt(a, b) || tally.eq(a, b);
    }

    static gt(a: tally, b: tally): bool {
        const i = i32(Math.max(a.a32.length, b.a32.length) - 1);
        return tally.__gt(a, b, i);
    }

    static __gt(a: tally, b: tally, i: i32): bool {
        if (i === -1) return false
        const av = a.a32.length > i ? a.a32[i] : 0;
        const bv = b.a32.length > i ? b.a32[i] : 0;
        if (bv > av) return false
        if (bv == av) return (true && tally.__gt(a, b, i-1))
        return true;
    }

    static eq_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.eq(a, b)? 1 : 0
        return c;
    }

    static eq(a: tally, b: tally): bool {
        let t = true
        let l = i32(Math.max(a.a32.length, b.a32.length))
        let _a = tally.empty(l * 4)
        _a.a8.set(a.a8, 0)
        let _b = tally.empty(l * 4)
        _b.a8.set(b.a8, 0)
        for (let i=0;i<l;i++) {
            const av = _a.a32[i];
            const bv = _b.a32[i];
            t = t && bv === av;
        }
        return t
    }

    static slt(a: tally, b: tally): bool {
        const isneg1 = a.isNeg();
        const isneg2 = b.isNeg();
        const isLt = tally.lt(a, b);
        if (((isneg1 ? -1 : 1) * (isneg2 ? -1 : 1)) == -1) return !isLt;
        return isLt;
    }

    static slt_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.slt(a, b) ? 1 : 0;
        return c;
    }

    static sgt(a: tally, b: tally): bool {
        const isneg1 = a.isNeg();
        const isneg2 = b.isNeg();
        const isGt = tally.gt(a, b);
        if (((isneg1 ? -1 : 1) * (isneg2 ? -1 : 1)) == -1) return !isGt;
        return isGt;
    }

    static sgt_t(a: tally, b: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.sgt(a, b) ? 1 : 0;
        return c;
    }

    static isZero_t(a: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.isZero(a) ? 1 : 0;
        return c;
    }

    static isZero(a: tally): bool {
        let t = true
        for (let i=0; i < a.a32.length; i++) {
            t = t && a.a32[i] === 0
        }
        return t
    }

    static and(a: tally, b: tally): tally {
        let l = i32(Math.max(a.a32.byteLength, b.a32.byteLength))
        let c = tally.empty(l)
        let _a = tally.empty(l)
        _a.a8.set(a.a8, 0)
        let _b = tally.empty(l)
        _b.a8.set(b.a8, 0)
        for (let i=0;i<c.a32.length;i++) {
            c.a32[i] = _a.a32[i] & _b.a32[i];
        }
        return c;
    }

    static or(a: tally, b: tally): tally {
        let l = i32(Math.max(a.a32.byteLength, b.a32.byteLength))
        let c = tally.empty(l)
        let _a = tally.empty(l)
        _a.a8.set(a.a8, 0)
        let _b = tally.empty(l)
        _b.a8.set(b.a8, 0)
        for (let i=0;i<c.a32.length;i++) {
            c.a32[i] = _a.a32[i] | _b.a32[i];
        }
        return c;
    }

    static xor(a: tally, b: tally): tally {
        let l = i32(Math.max(a.a32.byteLength, b.a32.byteLength))
        let c = tally.empty(l)
        let _a = tally.empty(l)
        _a.a8.set(a.a8, 0)
        let _b = tally.empty(l)
        _b.a8.set(b.a8, 0)
        for (let i=0;i<c.a32.length;i++) {
            c.a32[i] = _a.a32[i] ^ _b.a32[i];
        }
        return c;
    }

    static not(a: tally): tally {
        let b = tally.empty(a.a32.byteLength)
        for (let i=0;i<a.a32.length;i++) {
            b.a32[i] = ~ a.a32[i]
        }
        return b
    }

    static shl(a: tally, b: u32): tally {
        const c = tally.fromU32(2).pown(b);
        return tally.mul(a, c);
    }

    // big endian shr: division
    static shr(a: tally, b: u32): tally {
        let c = tally.empty(a.a32.byteLength);
        const shiftAmount = u32(b % 32);
        const offset = u32(b / 32);
        c.a32.set(a.a32.slice(offset), 0);
        return tally.fromUint32Array(tally.shiftRightUint32Array(c.a32, shiftAmount));
    }

    private static shiftRightUint32Array(array: Uint32Array, shiftAmount: u32): Uint32Array {
        if (shiftAmount == 0) return array;
        const length = array.length;
        const shiftOffset = shiftAmount % 32;
        const carryOffset = 32 - shiftOffset;

        let carry = 0;
        for (let i = length - 1; i >= 0; i--) {
          const currentValue = array[i];
          const shiftedValue = (currentValue >>> shiftOffset) | carry;
          carry = currentValue << carryOffset;
          array[i] = shiftedValue;
        }
        return array;
    }

    static neg(a: tally): tally {
        return tally.sub(tally.empty(), a);
    }

    static isNeg_t(a: tally): tally {
        return tally.isNeg(a) ? tally.fromU32(u32(1), 32) : tally.empty(32);
    }

    static isNeg(a: tally): bool {
        return (a.a32[a.a32.length - 1] >= 0x80000000);
    }

    static abs(a: tally): tally {
        return tally.isNeg(a) ? tally.neg(a) : a;
    }

    static isOne_t(a: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.isOne(a) ? 1 : 0;
        return c;
    }

    static isOne(a: tally): bool {
        let t = true
        for (let i=1; i < a.a32.length; i++) {
            t = t && a.a32[i] === 0
            if (!t) break;
        }
        return a.a32[0] ==1 ? t: false;
    }

    static isEven_t(a: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.isEven(a) ? 1 : 0;
        return c;
    }

    static isEven(a: tally): bool {
        return (a.a8[0] & 1) === 0;
    }

    static isOdd_t(a: tally): tally {
        let c = tally.empty(a.a32.byteLength)
        c.a8[0] = tally.isOdd(a) ? 1 : 0;
        return c;
    }

    static isOdd(a: tally): bool {
        return (a.a8[0] & 1) === 1;
    };

    static gcd(a: tally, b: tally): tally {
        if (tally.isZero(b)) return a;
        if (tally.isZero(a)) return b;
        if (tally.gt(a, b)) {
            return tally.gcd(tally.mod(a, b), b);
        }
        return tally.gcd(a, tally.mod(b, a));
    }

    static lcm(a: tally, b: tally): tally {
        return tally.div(tally.mul(a, b), tally.gcd(a, b))
    }

    static fromString(value: string, radix: u32 = 10): tally {
        const hexPrefix = value.slice(0, 2) == "0x"
        if (hexPrefix) {
            value = value.slice(2)
            radix = 16
        }
        return tally.fromString_(value, radix);
    }

    static fromString_(value: string, radix: i32 = 10): tally {
        if (radix < 2 || radix > 16) {
          throw new RangeError("BigInt only reads strings of radix 2 through 16");
        }
        let i: i32 = 0;
        let isNegative: boolean = false;
        if (value.charAt(0) == "-") {
          i++;
          isNegative = true;
        }
        if (
          (radix == 16 || radix == 10) &&
          value.charAt(i) == "0" &&
          value.charAt(i + 1) == "x"
        ) {
          i += 2;
          radix = 16;
        }
        let res: tally = tally.fromU32(0);
        const radixU: u16 = <u16>radix;
        for (; i < value.length; i++) {
          const code: i32 = value.charCodeAt(i);
          let val: u16;
          if (code >= 48 && code <= 57) {
            val = <u16>(code - 48);
          } else if (code >= 65 && code <= 70) {
            val = <u16>(code - 55);
          } else if (code >= 97 && code <= 102) {
            val = <u16>(code - 87);
          } else {
            throw new RangeError(
              "Character " +
              value.charAt(i) +
                " is not supported for radix " +
                radix.toString()
            );
          }
          res = res.mul(tally.fromU32(u32(radixU))).add(tally.fromU32(u32(val)));
        }
        // res.isNeg = isNegative;
        // res.trimLeadingZeros();
        return res;
    }

    static fromStringBase10(value: string): tally {
        // max u64 18446744073709551615 -> we use 19 digits
        const partLen = 19
        const len = value.length
        let v = value;
        let bn = tally.zero();
        const parts = i32(Math.floor(f64(len) / f64(partLen)))
        for (let i = 0; i < parts; i++) {
            const part = v.slice(0, partLen)
            v = v.slice(partLen)
            const partValue = u64(parseInt(part, 10))
            bn = bn.add(tally.fromU64(partValue).mul(tally.fromU32(10).pown(v.length)))
        }
        if (v.length > 0) {
            const partValue = u64(parseInt(v, 10))
            bn = bn.add(tally.fromU64(partValue))
        }
        return bn;
    }

    // static random(l: i32): tally {
    //   let arr8 = new Uint8Array(l)
    //   for (let i=0; i<l; i++) {
    //     arr8[i] = Math.floor(Math.random()*255)
    //   }
    //   return tally.fromU8Array(arr8);
    // }
}

export default tally;

class FindDiv {
    catMax: u32;
    v: tally;
    constructor(catMax: u32, v: tally) {
        this.catMax = catMax;
        this.v = v;
    }
}

function _div_shr (n: Uint16Array): Uint16Array {
    const len = n.length - 2;
    for (let i = len; i >= 0; i--) {
      n[i + 1] = n[i];
    }
    n[0] = 0;
    return n;
}

function significantLength32(value: Uint32Array): i32 {
    const len = value.length;
    for (let i = len - 1; i >= 0; i--) {
        if (value[i] !== 0) return i + 1;
    }
    return 0;
}

function significantLength16(value: Uint16Array): i32 {
    const len = value.length;
    for (let i = len - 1; i >= 0; i--) {
        if (value[i] !== 0) return i + 1;
    }
    return 0;
}

export function u8ArrayToHex(arr: u8[]): string {
    return arr.reduce((accum: string, v: u8) => accum + v.toString(16).padStart(2, '0'), "");
}

export function uint8ArrayToHex(arr: Uint8Array): string {
    return arr.reduce((accum: string, v: u8) => accum + v.toString(16).padStart(2, '0'), "");
}

export function hexToU8(value: string): u8[] {
    const arr: u8[] = [];
    if (value.substr(0, 2) == "0x") value = value.substr(2);
    if (value.length % 2 == 1) value = "0" + value;

    for (let i = 0; i < value.length / 2; i++) {
        arr[i] = u8(parseInt(value.substr(2*i, 2), 16))
    }
    return arr;
}

export function hexToUint8Array(value: string): Uint8Array {
    if (value.substr(0, 2) == "0x") value = value.substr(2);
    if (value.length % 2 == 1) value = "0" + value;

    const arr = new Uint8Array(value.length / 2);
    for (let i = 0; i < value.length / 2; i++) {
        arr[i] = u8(parseInt(value.substr(2*i, 2), 16))
    }
    return arr;
}

function processZeros(value: string, byteLength: i32): string {
    if (byteLength == 0) return value;
    const hexlen = byteLength * 2
    if (hexlen > 0 && hexlen == value.length) return value;
    // case value needs to be padded
    if (hexlen > 0 && hexlen > value.length) return "0".repeat(hexlen - value.length) + value;
    // find index of first non-zero hex digit
    let ndx = -1
    for (let i = 0; i < value.length; i++) {
        if (value.slice(i, i+1) != "0") {
            ndx = i;
            break;
        }
    }
    if (ndx == -1) return "0".repeat(hexlen);
    if (ndx == 0) return value;

    ndx = i32(Math.min(ndx, value.length - hexlen))
    return value.slice(ndx);
}
