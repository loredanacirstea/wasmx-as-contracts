import * as curveBytecode from './curve.js';
import * as fibBytecode from './fib.js';
import * as allopsBytecode from './allops.js';

export function finish(buf) {
    console.log('finish', buf);
}

export function stop(buf) {
    console.log('stop', buf);
}

export function revert(buf) {
    console.log('revert', buf);
}

export function storageStore(keybuf, valuebuf) {
    console.log('storageStore', keybuf, valuebuf);
}

export function storageLoad(buf) {
    console.log('storageLoad', buf);
    return [10]
}

export function getAccount(buf) {
    console.log('getAccount', buf);
    return encodeToUtf8Array(JSON.stringify({
        balance: [0],
        codeHash: [],
        bytecode: [...hexToUint8Array(curveBytecode.runtime)],
    }));
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
            timestamp: [...hexToUint8Array(Math.floor(new Date().getTime() / 1000).toString(16))],
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
            // bytecode: [...hexToUint8Array('66eeeeeeeeeeeeee60005260206000f3')],

            bytecode: [...hexToUint8Array(allopsBytecode.runtime)],

            // bytecode: [...hexToUint8Array('608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b9291505056fea264697066735822122078d7d2506cfdc9cd346c7e1c6d45608c51a65a5f60d910a1c8ab59c457fc784064736f6c63430008120033')],

            // bytecode: [...hexToUint8Array('7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9600a1b7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff96101011b80820160005260206000f3')],

            // bytecode: [...hexToUint8Array('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff600a1b7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff96101011b80820160005260206000f3')],

            // fibonacci
            // bytecode: [...hexToUint8Array(fibBytecode.runtime)],

            // bytecode: [...hexToUint8Array(curveBytecode.runtime)],

            balance: [0],
            codeHash: [],
        },
        currentCall: {
            origin: [...hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98')],
            sender: [...hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98')],
            funds: [...new Uint8Array(32)],
            gasLimit: [0x01, 0x86, 0xa0], // 100000

            // address_
            callData: [...hexToUint8Array('758aa8ad')],

            // mul_(2, 27) => 81
            callData: [...hexToUint8Array('c42e92080000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001b')],

            // mul_
            callData: [...hexToUint8Array('c42e92080000000000000000000000000000000000000000000000000000000000000003fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9')],
            // result 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeb

            // div
            callData: [...hexToUint8Array('70ea8194fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff90000000000000000000000000000000000000000000000000000000000000003')],
            // 0x5555555555555555555555555555555555555555555555555555555555555553


            // div
            callData: [...hexToUint8Array('70ea8194fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff900000000000000000000000000000000000000000ffffffffffffffffffffff9')],
            // 0x0000000000000000000000100000000000000000000007000000000000000000

            // sub
            callData: [...hexToUint8Array('f090359a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006')],
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe

            // sdiv -4 / 2
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc
            // 2
            callData: [...hexToUint8Array('85548375fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0000000000000000000000000000000000000000000000000000000000000002')],
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe

            // sdiv
            // 0x00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
            // -10000000000 // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00
            callData: [...hexToUint8Array('8554837500fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00')],
            // 0xffffffffff920c8098a1091520a5465df8d2bbd97268207c8198b76a91a393df

            // sdiv 4 / 2
            callData: [...hexToUint8Array('8554837500000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002')],

            // sgt -2 > -4 = 1
            callData: [...hexToUint8Array('e7a77a56fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc')],

            // sgt -2 > 4 = 0
            callData: [...hexToUint8Array('e7a77a56fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0000000000000000000000000000000000000000000000000000000000000004')],

            // slt -2 < -4 = 0
            callData: [...hexToUint8Array('0f58c996fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc')],

            // slt -2 < 4 = 1
            callData: [...hexToUint8Array('0f58c996fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0000000000000000000000000000000000000000000000000000000000000004')],

            // smod -5 / 2
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
            // 2
            callData: [...hexToUint8Array('d44aeb8afffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000002')],
            // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

            // smod
            // 0x00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
            // -10000000000 // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00
            callData: [...hexToUint8Array('d44aeb8a00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00')],
            // 0x0000000000000000000000000000000000000000000000000000000036479bfe

            // smod 5 / 2
            callData: [...hexToUint8Array('d44aeb8a00000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000002')],
            // 0000000000000000000000000000000000000000000000000000000000000001

            // sar 2, 0xc
            callData: [...hexToUint8Array('2ea9b94b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c')],
            // 0000000000000000000000000000000000000000000000000000000000000003

            // sar c, 0
            callData: [...hexToUint8Array('2ea9b94b000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000')],
            // 0000000000000000000000000000000000000000000000000000000000000000

            // sar 2, -12 -> -3
            callData: [...hexToUint8Array('2ea9b94b0000000000000000000000000000000000000000000000000000000000000002fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4')],
            // fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd

            // sar 1, -12 -> -6
            callData: [...hexToUint8Array('2ea9b94b0000000000000000000000000000000000000000000000000000000000000001fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4')],
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa

            // shl 1, 0xfff3
            callData: [...hexToUint8Array('45a907660000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000fff3')],
            // 0x000000000000000000000000000000000000000000000000000000000001ffe6

            // shl 240, 0xfff3
            callData: [...hexToUint8Array('45a9076600000000000000000000000000000000000000000000000000000000000000f0000000000000000000000000000000000000000000000000000000000000fff3')],
            // 0xfff3000000000000000000000000000000000000000000000000000000000000

            // shl 255, 0xfff3
            callData: [...hexToUint8Array('45a9076600000000000000000000000000000000000000000000000000000000000000ff000000000000000000000000000000000000000000000000000000000000fff3')],
            // 0x8000000000000000000000000000000000000000000000000000000000000000

            // shl 256, 0xfff3 -> 0
            callData: [...hexToUint8Array('45a907660000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000fff3')],

            // signextend 1, 0xfff3
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000fff3')],
            // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3

            // signextend 0, 0xff03
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff03')],
            // 0000000000000000000000000000000000000000000000000000000000000003

            // signextend 1, 0xff03
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000ff03')],
            // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03

            // signextend 0, 0xff99
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff99')],
            // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff99

            // signextend 0, 0xff79
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff79')],
            // 0x0000000000000000000000000000000000000000000000000000000000000079

            // signextend 0, 0xff80
            callData: [...hexToUint8Array('bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff80')],
            // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80

            // not 2
            callData: [...hexToUint8Array('d6eddb180000000000000000000000000000000000000000000000000000000000000002')],
            // fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd

            // not
            callData: [...hexToUint8Array('d6eddb18000000000000000000000001853fe40b3c24696b156c3460a90238e38e38e38e')],
            // 0xfffffffffffffffffffffffe7ac01bf4c3db9694ea93cb9f56fdc71c71c71c71

            // allopcodes mulmod
            // 0x09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03
            // 0x18b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6
            // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            callData: [...hexToUint8Array('ab3300c309d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe0318b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
            // 0xd01bd8fe6e7023551201ddb79c4827f4aefa22eb509a8c43ad0bc45a67f9b430

            // allopcodes addmod
            callData: [...hexToUint8Array('d957a80709d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe0318b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
            // 0x2287bfbbef94511c76236b89d88272584a79c04abea137ae4874ed48e4d32dc9

            // and
            callData: [...hexToUint8Array('8491293f0000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03')],
            // 0x0000000000f44f00002bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03

            // or
            callData: [...hexToUint8Array('3f8d65580000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03')],
            // 0x09d11b1a5effff6bffffffffffffffffffffffffffffffffffffffffffffffff

            // xor
            callData: [...hexToUint8Array('27401a410000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03')],
            // 0x09d11b1a5e0bb06bffd42dda4aa3fb2c758c82660c3c87ba94b0a083063e01fc

            // callData: [...hexToUint8Array('24b60399')],
            // // timestamp

            // // curve precomputeGen
            // callData: [...hexToUint8Array('85d3cf13')],

            // // test_cmul
            // callData: [...hexToUint8Array('e5582b4d')],

            // // simplestorage
            // callData: [...hexToUint8Array('60fe47b10000000000000000000000000000000000000000000000000000000000000006')],
            // // callData: [],

            // // fibonacci fibInternal(9)
            // callData: [...hexToUint8Array('b19602740000000000000000000000000000000000000000000000000000000000000008')],
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
