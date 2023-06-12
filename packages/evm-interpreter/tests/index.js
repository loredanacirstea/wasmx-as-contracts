import assert from "assert";
import { benchmark, runf, LOG, u8ArrayToHex, paddLeft } from './utils.js';
import { hexToUint8Array } from './wasmx.js';
import * as curveBytecode from './data/curve.js';
import * as fibBytecode from './data/fib.js';
import * as allopsBytecode from './data/allops.js';

const baseenv = {
    chain: {
        denom: "amyt",
        chainId: paddLeft([0x1b, 0x58]), // 7000,
        chainIdFull: "mythos_7000-1",
    },
    block: {
        height: paddLeft([10]),
        timestamp: [...paddLeft(hexToUint8Array(Math.floor(new Date().getTime()*1000000).toString(16)))],
        gasLimit: paddLeft([0x98, 0x96, 0x80]), // 10000000
        hash: [...new Uint8Array(32)],
        proposer: [...new Uint8Array(32)],
    },
    transaction: {
        index: paddLeft([2]),
        gasPrice: [...new Uint8Array(32)],
    },
    contract: {
        address: [...paddLeft(hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec99'))],
        bytecode: [...hexToUint8Array(fibBytecode.runtime)],
        balance: paddLeft([0]),
        codeHash: paddLeft([]),
    },
    currentCall: {
        origin: [...paddLeft(hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98'))],
        sender: [...paddLeft(hexToUint8Array('39B1BF12E9e21D78F0c76d192c26d47fa710Ec98'))],
        funds: [...new Uint8Array(32)],
        gasLimit: paddLeft([0x01, 0x86, 0xa0]), // 100000
        // fibonacci fibInternal(9)
        callData: [...hexToUint8Array('b19602740000000000000000000000000000000000000000000000000000000000000005')],

    },
}

async function test() {
    for (let i = 0; i < testCases.length; i++) {
        const storageMap = {};
        let env = baseenv;
        const testcase = testCases[i];
        env.contract.bytecode = [...hexToUint8Array(testcase.bytecode)];
        for (let j = 0; j < testcase.calldatas.length; j++) {
            const calldata = testcase.calldatas[j];
            env.currentCall.callData = [...hexToUint8Array(calldata.value)];
            const [result, timeTaken] = await benchmark(runf, storageMap, env, LOG.error);
            console.log(`Execution time: ${testcase.name} - ${calldata.name}: ${timeTaken} milliseconds`);
            if (calldata.result) {
                const resulthex = u8ArrayToHex(result);
                assert.strictEqual(resulthex, calldata.result, testcase.name + '-' + calldata.name);
            }
        }
    }
    console.log("ok");
}

const testCases = [
    {
        name: 'allops',
        bytecode: allopsBytecode.runtime,
        calldatas: [
            {
                name: 'add',
                value: 'd1cbf1c509d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe0318b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6',
                result: '2287bfbbef94511c76236b89d88272584a79c04abea137ae4874ed48e4d32dc9',
            },
            {
                name: 'address_',
                value: '758aa8ad',
                result: '00000000000000000000000039b1bf12e9e21d78f0c76d192c26d47fa710ec99',
            },
            {
                name: 'mul_(2, 27) => 81',
                value: 'c42e92080000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001b',
                result: '0000000000000000000000000000000000000000000000000000000000000051',
            },
            {
                name: 'mul_',
                value: 'c42e92080000000000000000000000000000000000000000000000000000000000000003fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9',
                result: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeb'
            },
            {
                name: 'div',
                value: '70ea8194fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff900000000000000000000000000000000000000000000000000000000000000038ad',
                result: '5555555555555555555555555555555555555555555555555555555555555553'
            },
            {
                name: 'div',
                value: '70ea8194fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff900000000000000000000000000000000000000000ffffffffffffffffffffff9',
                result: '0000000000000000000000100000000000000000000007000000000000000000'
            },
            {
                name: 'sub',
                value: 'f090359a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
            },
            {
                name: 'exp_',
                value: '630834b500000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
                result: '0000000000000000000000000000000000000000000000000000000000000001',
            },
            {
                name: 'sdiv -4 / 2',
                // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc
                // 2
                value: '85548375fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0000000000000000000000000000000000000000000000000000000000000002',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
            },
            {
                name: 'sdiv',
                // 0x00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
                // -10000000000 // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00
                value: '8554837500fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00',
                result: 'ffffffffff920c8098a1091520a5465df8d2bbd97268207c8198b76a91a393df'
            },
            {
                name: 'sdiv 4 / 2',
                value: '8554837500000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002',
                result: '0000000000000000000000000000000000000000000000000000000000000002',
            },
            {
                name: 'sgt -2 > -4 = 1',
                value: 'e7a77a56fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc',
                result: '0000000000000000000000000000000000000000000000000000000000000001',
            },
            {
                name: 'sgt -2 > 4 = 0',
                value: 'e7a77a56fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0000000000000000000000000000000000000000000000000000000000000004',
                result: '0000000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'slt -2 < -4 = 0',
                value: '0f58c996fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc',
                result: '0000000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'slt -2 < 4 = 1',
                value: '0f58c996fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0000000000000000000000000000000000000000000000000000000000000004',
                result: '0000000000000000000000000000000000000000000000000000000000000001',
            },
            {
                name: 'smod -5 / 2',
                // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
                // 2
                value: 'd44aeb8afffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb0000000000000000000000000000000000000000000000000000000000000002',
                result: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            },
            {
                name: 'smod',
                // 0x00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
                // -10000000000 // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00
                value: 'd44aeb8a00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffdabf41c00',
                result: '0000000000000000000000000000000000000000000000000000000036479bfe',
            },
            {
                name: 'smod 5 / 2',
                value: 'd44aeb8a00000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000002',
                result: '0000000000000000000000000000000000000000000000000000000000000001',
            },
            {
                name: 'sar 2, 0xc',
                value: '2ea9b94b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c',
                result: '0000000000000000000000000000000000000000000000000000000000000003',
            },
            {
                name: 'sar c, 0',
                value: '2ea9b94b000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000',
                result: '0000000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'sar 2, -12 -> -3',
                value: '2ea9b94b0000000000000000000000000000000000000000000000000000000000000002fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd',
            },
            {
                name: 'sar 1, -12 -> -6',
                value: '2ea9b94b0000000000000000000000000000000000000000000000000000000000000001fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa',
            },
            {
                name: 'shl 1, 0xfff3',
                value: '45a907660000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000fff3',
                result: '000000000000000000000000000000000000000000000000000000000001ffe6',
            },
            {
                name: 'shl 240, 0xfff3',
                value: '45a9076600000000000000000000000000000000000000000000000000000000000000f0000000000000000000000000000000000000000000000000000000000000fff3',
                result: 'fff3000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'shl 255, 0xfff3',
                value: '45a9076600000000000000000000000000000000000000000000000000000000000000ff000000000000000000000000000000000000000000000000000000000000fff3',
                result: '8000000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'shl 256, 0xfff3 -> 0',
                value: '45a907660000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000fff3',
                result: '0000000000000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'signextend 1, 0xfff3',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000fff3',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3',
            },
            {
                name: 'signextend 0, 0xff03',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff03',
                result: '0000000000000000000000000000000000000000000000000000000000000003',
            },
            {
                name: 'signextend 1, 0xff03',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000ff03',
                result: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03',
            },
            {
                name: 'signextend 0, 0xff99',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff99',
                result: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff99',
            },
            {
                name: 'signextend 0, 0xff79',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff79',
                result: '0000000000000000000000000000000000000000000000000000000000000079',
            },
            {
                name: 'signextend 0, 0xff80',
                value: 'bb1c8ed40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff80',
                result: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80',
            },
            {
                name: 'not 2',
                value: 'd6eddb180000000000000000000000000000000000000000000000000000000000000002',
                result: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd',
            },
            {
                name: 'not',
                value: 'd6eddb18000000000000000000000001853fe40b3c24696b156c3460a90238e38e38e38e',
                result: 'fffffffffffffffffffffffe7ac01bf4c3db9694ea93cb9f56fdc71c71c71c71',
            },
            {
                name: 'mulmod',
                // 0x09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03
                // 0x18b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6
                // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
                value: 'ab3300c309d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe0318b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                result: 'd01bd8fe6e7023551201ddb79c4827f4aefa22eb509a8c43ad0bc45a67f9b430',
            },
            {
                name: 'addmod',
                value: 'd957a80709d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe0318b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                result: '2287bfbbef94511c76236b89d88272584a79c04abea137ae4874ed48e4d32dc9',
            },
            {
                name: 'and',
                value: '8491293f0000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
                result: '0000000000f44f00002bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
            },
            {
                name: 'or',
                value: '3f8d65580000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
                result: '09d11b1a5effff6bffffffffffffffffffffffffffffffffffffffffffffffff',
            },
            {
                name: 'or',
                value: '3f8d65580000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
                result: '09d11b1a5effff6bffffffffffffffffffffffffffffffffffffffffffffffff',
            },
            {
                name: 'xor',
                value: '27401a410000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
                result: '09d11b1a5e0bb06bffd42dda4aa3fb2c758c82660c3c87ba94b0a083063e01fc',
            },
            {
                name: 'xor',
                value: '27401a410000000000ffff000fffffffffffffffffffffffffffffffffffffffffffffff09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03',
                result: '09d11b1a5e0bb06bffd42dda4aa3fb2c758c82660c3c87ba94b0a083063e01fc',
            },
            {
                name: 'shr - 0',
                // 0xaa0000000000000000000000000000000000000000000000000000000000000c
                value: '38619a920000000000000000000000000000000000000000000000000000000000000000aa0000000000000000000000000000000000000000000000000000000000000c',
                result: 'aa0000000000000000000000000000000000000000000000000000000000000c',
            },
            {
                name: 'shr - 240',
                // 0xaa0000000000000000000000000000000000000000000000000000000000000c
                value: '38619a9200000000000000000000000000000000000000000000000000000000000000f0aa0000000000000000000000000000000000000000000000000000000000000c',
                result: '000000000000000000000000000000000000000000000000000000000000aa00',
            },
            {
                name: 'shr - 31',
                // 0xaa0000000000000000000000000000000000000000000000000000000000000c
                value: '38619a92000000000000000000000000000000000000000000000000000000000000001faa0000000000000000000000000000000000000000000000000000000000000c',
                result: '0000000154000000000000000000000000000000000000000000000000000000',
            },
            {
                name: 'shr - 0x3f',
                value: '38619a92000000000000000000000000000000000000000000000000000000000000003faa0000000000000000000000000000000000000000000000000000000000000c',
                result: '0000000000000001540000000000000000000000000000000000000000000000',
            },
            {
                name: 'timestamp',
                value: '24b60399',
            },
            {
                name: 'calldatasize',
                value: '584a4504112233',
                result: '0000000000000000000000000000000000000000000000000000000000000007',
            },
            {
                name: 'codesize',
                value: 'fcca1ca2',
                result: '0000000000000000000000000000000000000000000000000000000000001f41',
            },
            {
                name: 'call',
                value: 'cce14e6b000000000000000000000000000000000000000000000000000000000001d4c000000000000000000000000039b1bf12e9e21d78f0c76d192c26d47fa710ec98000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                result: '',
            },
        ]
    },
    {
        name: 'fibonacci',
        bytecode: fibBytecode.runtime,
        calldatas: [
            {
                name: '5',
                value: 'b19602740000000000000000000000000000000000000000000000000000000000000005',
                result: '0000000000000000000000000000000000000000000000000000000000000005'
            },
        ]
    },
    {
        name: 'deployment',
        bytecode: allopsBytecode.deployment,
        calldatas: [
            {
                name: 'deployment',
                value: '0x',
                result: allopsBytecode.runtime,
            },
        ]
    },
    // {
    //     name: 'curve',
    //     bytecode: curveBytecode.runtime,
    //     calldatas: [
    //         {
    //             name: 'test_cmul',
    //             value: 'e5582b4d',
    //         },
    //         {
    //             name: 'precomputeGen',
    //             value: '85d3cf13',
    //         },
    //     ]
    // }
]

test();




// bytecode: [...hexToUint8Array('608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f61007f565b60405161006c91906100ff565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b6100a08161008d565b81146100ab57600080fd5b50565b6000813590506100bd81610097565b92915050565b6000602082840312156100d9576100d8610088565b5b60006100e7848285016100ae565b91505092915050565b6100f98161008d565b82525050565b600060208201905061011460008301846100f0565b9291505056fea264697066735822122078d7d2506cfdc9cd346c7e1c6d45608c51a65a5f60d910a1c8ab59c457fc784064736f6c63430008120033')],

// bytecode: [...hexToUint8Array('7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9600a1b7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff96101011b80820160005260206000f3')],

// bytecode: [...hexToUint8Array('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff600a1b7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff96101011b80820160005260206000f3')],
