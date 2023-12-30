import { load, LOG } from './wasmx.js';

export function runFnWrapped (storage = {}, env = {}) {
    return async function (fnName, args, runfn = "main", raw = false) {
        let calldata;
        if (runfn === "main" && !raw) {
          calldata = encodeToUtf8Array(JSON.stringify({[fnName]: args}));
        } else if (runfn === "main" && raw) {
            calldata = encodeToUtf8Array(args);
        } if (runfn === "instantiate") {
            calldata = encodeToUtf8Array(JSON.stringify(args));
        } else {
          calldata = args;
        }

        const defaultSender = encodeToUtf8Array("sender");
        const defaultContract = encodeToUtf8Array("contract");
        env = {
            ...env,
            currentCall: {
                sender: defaultSender,
                contract: defaultContract,
                ...env.currentCall,
                callData: calldata,
            }
        }
        const instance = await load(storage, env, LOG.debug);
        return instance[runfn]();
    }
}

export function encodeToUtf8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

export function decodeFromUtf8Array(arr) {
    if (!(arr instanceof ArrayBuffer)) arr = new Uint8Array(arr).buffer;
    const encoder = new TextDecoder();
    return encoder.decode(arr);
}

export function hexToUint8Array(hexString) {
    const encodedString = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    return new Uint8Array(encodedString);
}
