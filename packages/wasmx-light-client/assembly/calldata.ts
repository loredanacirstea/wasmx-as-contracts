import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import {
    getHeader,
} from './storage';
import {
    addHeader,
} from './registration';

@json
export class CallDataInstantiate {
    chainId: string;
    constructor(chainId: string) {
        this.chainId = chainId;
    }
}

@json
export class CallData {
    addHeader: CallDataAddHeader | null = null;
    getHeader: CallDataGetHeader | null = null;
}

@json
export class CallDataAddHeader {
    header: Base64String;
    validators: Bech32String[];
    signatures: Base64String[];
    constructor(chainId: string, header: Base64String, validators: Bech32String[], signatures: Base64String[]) {
        this.header = header;
        this.validators = validators;
        this.signatures = signatures;
    }
}

@json
export class CallDataGetHeader {
    index: i64;
    constructor(index: i64) {
        this.index = index;
    }
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<CallData>(String.UTF8.decode(calldraw));
}

export function addHeaderWrap(req: CallDataAddHeader): ArrayBuffer {
    addHeader(req.header, req.validators, req.signatures);
    return new ArrayBuffer(0);
}

export function getHeaderWrap(req: CallDataGetHeader): ArrayBuffer {
    const header = getHeader(req.index)
    return String.UTF8.encode(header);
}
