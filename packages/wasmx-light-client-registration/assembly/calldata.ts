import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import { Base64String, Bech32String } from 'wasmx-env/assembly/types';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import {
    registerChain,
    registerValidator,
    addHeader,
    getNextProposer,
} from './register';

@json
export class CallDataInstantiate {
    min_validators: i32;
    constructor(min_validators: i32) {
        this.min_validators = min_validators;
    }
}

@json
export class CallData {
    registerChain: CallDataRegisterChain | null = null;
    registerValidator: CallDataRegisterValidator | null = null;
    addHeader: CallDataAddHeader | null = null;
    getNextProposer: CallDataGetNextProposer | null = null;
}

@json
export class CallDataRegisterChain {
    id: string;
    lightClientAddress: string;
    constructor(id: string, lightClientAddress: string) {
        this.id = id;
        this.lightClientAddress = lightClientAddress
    }
}

@json
export class CallDataRegisterValidator {
    chainId: string;
    constructor(chainId: string) {
        this.chainId = chainId;
    }
}

@json
export class CallDataAddHeader {
    chainId: string;
    header: Base64String;
    validators: Bech32String[];
    signatures: Base64String[];
    constructor(chainId: string, header: Base64String, validators: Bech32String[], signatures: Base64String[]) {
        this.chainId = chainId;
        this.header = header;
        this.validators = validators;
        this.signatures = signatures;
    }
}

@json
export class CallDataGetNextProposer {
    chainId: string;
    headerHash: string;
    constructor(chainId: string, headerHash: string) {
        this.chainId = chainId;
        this.headerHash = headerHash;
    }
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<CallData>(String.UTF8.decode(calldraw));
}

export function registerChainWrap(req: CallDataRegisterChain): ArrayBuffer {
    registerChain(req.id, req.lightClientAddress, wasmxwrap.addr_humanize(wasmx.getCaller()));
    return new ArrayBuffer(0);
}

export function registerValidatorWrap(req: CallDataRegisterValidator): ArrayBuffer {
    registerValidator(req.chainId, wasmxwrap.addr_humanize(wasmx.getCaller()));
    return new ArrayBuffer(0);
}

export function addHeaderWrap(req: CallDataAddHeader): ArrayBuffer {
    addHeader(req.chainId, req.header, req.validators, req.signatures);
    return new ArrayBuffer(0);
}

export function getNextProposerWrap(req: CallDataGetNextProposer): ArrayBuffer {
    const addr = getNextProposer(req.chainId, req.headerHash);
    return wasmxwrap.addr_canonicalize(addr);
}
