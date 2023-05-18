export function finish(buf) {
    console.log('finish', buf);
}

export function stop(buf) {
    console.log('stop', buf);
}

export function getEnv() {
    console.log('getEnv');
    const env = {
        // chain: {
        //     denom: "amyt",
        //     chainId: 7000,
        //     chainIdFull: "mythos_7000-1",
        // },
        // block: {
        //     height: 10,
        //     time: new Date().getTime() / 1000,
        //     gasLimit: 10000000,
        //     hash: [...new Uint8Array(32)],
        //     proposer: [...new Uint8Array(20)],
        // },
        // transaction: {
        //     index: 2,
        //     gasPrice: [...new Uint8Array(32)],
        // },
        contract: {
            address: [...new Uint8Array(20)],
            bytecode: [...hexToUint8Array('66eeeeeeeeeeeeee60005260206000f3')],
        },
        // currentCall: {
        //     origin: [...hexToUint8Array('1fB8CD37C35546FeC07A794158F4035f06f023A0')],
        //     sender: [...hexToUint8Array('1fB8CD37C35546FeC07A794158F4035f06f023A0')],
        //     funds: [...new Uint8Array(32)],
        //     isQuery: true,
        //     callData: [],
        // },
    }
    // const encoded = encodeToUtf8Array(JSON.stringify(env));
    return [...hexToUint8Array('66eeeeeeeeeeeeee60005260206000f3')];
    console.log('encoded', encoded);
    return encoded;
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
