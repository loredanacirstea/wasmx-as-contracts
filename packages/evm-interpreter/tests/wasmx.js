import { LOG, paddLeft } from './utils.js';

export function wasmx(storageMap, env, logType = LOG.error) {
    function finish(buf) {
        if (logType > 0) {
            console.log('-host-finish', [...new Uint8Array(buf)]);
        }
    }

    function stop(buf) {
        if (logType > 0) {
            console.log('-host-stop', [...new Uint8Array(buf)]);
        }
    }

    function revert(buf) {
        if (logType > 0) {
            console.log('-host-revert', [...new Uint8Array(buf)]);
        }
    }

    function log(buf) {
        if (logType > 1) {
            console.log('-host-log', decodeFromUtf8Array(buf));
        }
    }

    function storageStore(keybuf, valuebuf) {
        if (logType > 1) {
            console.log('-host-storageStore', [...new Uint8Array(keybuf)], [...new Uint8Array(valuebuf)]);
        }
        storageMap[keybuf] = valuebuf;
    }

    function storageLoad(keybuf) {
        if (logType > 1) {
            console.log('-host-storageLoad', [...new Uint8Array(keybuf)], [...new Uint8Array(storageMap[keybuf] || [])]);
        }
        return storageMap[keybuf] || [];
    }

    function keccak256(buf) {
        return [];
    }

    function getBalance(buf) {
        return [];
    }

    function getBlockHash(buf) {
        return [];
    }

    function createAccount(buf) {
        return [];
    }

    function create2Account(buf) {
        return [];
    }

    function externalCall(buf) {
        return paddLeft(new Uint8Array(0));
    }

    function getAccount(buf) {
        if (logType > 1) {
            console.log('-host-getAccount', [...new Uint8Array(buf)]);
        }
        return encodeToUtf8Array(JSON.stringify({
            address: [...new Uint8Array(buf)],
            codeHash: paddLeft([]),
            bytecode: paddLeft([]),
        }));
    }

    function getCallData() {
        if (logType > 1) {
            console.log('-host-getCallData', env.currentCall.callData);
        }
        return env.currentCall.callData;
    }

    function getEnv() {
        return encodeToUtf8Array(JSON.stringify(env));
    }

    return {
        finish,
        stop,
        revert,
        log,
        storageStore,
        storageLoad,
        getAccount,
        getCallData,
        getEnv,
        keccak256,
        getBalance,
        getBlockHash,
        createAccount,
        create2Account,
        externalCall,
    }
}

export function encodeToUtf8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

export function decodeFromUtf8Array(arr) {
    const encoder = new TextDecoder();
    return encoder.decode(arr);
}

export function hexToUint8Array(hexString) {
    const encodedString = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    return new Uint8Array(encodedString);
}
