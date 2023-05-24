export function finish(buf) {
    console.log('finish', buf);
}

export function stop(buf) {
    console.log('stop', buf);
}

export function storageStore(keybuf, valuebuf) {
    console.log('storageStore', keybuf, valuebuf);
}

export function storageLoad(buf) {
    console.log('storageLoad', buf);
    return [10]
}

export function getEnv() {
    console.log('getEnv');
    const env = {
        chain: {
            denom: "amyt",
            chainId: [0x1b, 0x58], // 7000,
            chainIdFull: "mythos_7000-1",
        },
        block: {
            height: 10,
            time: Math.floor(new Date().getTime() / 1000),
            gasLimit: [0x98, 0x96, 0x80], // 10000000
            hash: [...new Uint8Array(32)],
            proposer: [...new Uint8Array(20)],
        },
        transaction: {
            index: [2],
            gasPrice: [...new Uint8Array(32)],
        },
        contract: {
            address: [...hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec99')],
            bytecode: [...hexToUint8Array('66eeeeeeeeeeeeee60005260206000f3')],
            balance: [0],
            codeHash: [],
        },
        currentCall: {
            origin: [...hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98')],
            sender: [...hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98')],
            funds: [...new Uint8Array(32)],
            gasLimit: [0x01, 0x86, 0xa0], // 100000
            callData: [],
        },
    }
    return encodeToUtf8Array(JSON.stringify(env));
}

function encodeToUtf8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

function hexToUint8Array(hexString) {
    const decoder = new TextDecoder('utf-8');
    const encodedString = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    return new Uint8Array(encodedString);
}
