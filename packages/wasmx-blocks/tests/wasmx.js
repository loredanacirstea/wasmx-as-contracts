import { getExports } from "./debug.js";

export const LOG = {
    error: 0,
    info: 1,
    debug: 2,
}

export async function load(storage = {}, env = {}, logType = LOG.debug) {
    const inst = await getExports(wasmx(storage, env, logType));
    return inst
}

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

    function storageStore(keybuf, valuebuf) {
        const key = [...new Uint8Array(keybuf)];
        const value = [...new Uint8Array(valuebuf)];
        if (logType > 1) {
            console.log('-host-storageStore', [...new Uint8Array(keybuf)]);
        }
        storageMap[key.toString()] = value;
    }

    function storageLoad(keybuf) {
        const key = [...new Uint8Array(keybuf)];
        const value = new Uint8Array(storageMap[key.toString()] || []).buffer;
        if (logType > 1) {
            console.log('-host-storageLoad', [...new Uint8Array(keybuf)]);
        }
        return value;
    }

    function grpcRequest(keybuf) {
        if (logType > 1) {
            console.log('-host-grpcRequest', [...new Uint8Array(keybuf)]);
        }
        const resp = {data: "", error: ""};
        return encodeToUtf8Array(JSON.stringify(resp));
    }

    function getCallData() {
        if (logType > 1) {
            console.log('-host-getCallData', env.currentCall.callData);
        }
        return env.currentCall.callData;
    }

    function getCaller() {
        if (logType > 1) {
            console.log('-host-getCaller', env.currentCall.sender);
        }
        return env.currentCall.sender;
    }

    function getAddress() {
        if (logType > 1) {
            console.log('-host-getAddress', env.currentCall.contract);
        }
        return env.currentCall.contract;
    }

    function getBalance(addrbuf) {
        const key = [...new Uint8Array(addrbuf)];
        if (logType > 1) {
            console.log('-host-getBalance', env.balance[key.toString()]);
        }
        return env.balance[key.toString()];
    }

    function getEnv() {
        return encodeToUtf8Array(JSON.stringify(env));
    }

    function log(item) {
        console.log('-host-log', item);
    }

    function startTimeout() {
        console.log('-host-startTimeout');
    }

    function stopInterval() {
        console.log('-host-stopInterval');
    }

    function sha256(buf) {
        if (logType > 0) {
            console.log('-host-sha256', [...new Uint8Array(buf)]);
        }
        return new Uint8Array(0);
    }

    function setReturnData(buf) {
        if (logType > 0) {
            console.log('-host-setReturnData', [...new Uint8Array(buf)]);
        }
        env.ReturnData = buf;
    }

    function getReturnData() {
        if (logType > 0) {
            console.log('-host-getReturnData');
        }
        return env.ReturnData || new Uint8Array(0);
    }

    return {
        finish,
        stop,
        revert,
        storageStore,
        storageLoad,
        getCallData,
        getEnv,
        getCaller,
        getAddress,
        getBalance,
        log,
        grpcRequest,
        startTimeout,
        stopInterval,
        sha256,
        setReturnData,
        getReturnData,
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

export function paddLeft(arr8uint, maxlen = 32) {
    return new Uint8Array([...new Uint8Array(maxlen - arr8uint.length), ...arr8uint])
}
