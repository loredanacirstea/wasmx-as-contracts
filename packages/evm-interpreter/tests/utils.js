import { getExports } from "./debug.js";
import { wasmx } from './wasmx.js';

export const LOG = {
    error: 0,
    info: 1,
    debug: 2,
}

export async function benchmark(func, ...args) {
    let start = performance.now();
    const result = await func(...args);
    let end = performance.now();
    return [result, end - start];
}

export async function runf(storage, env, logType = LOG.error) {
    const { main } = await getExports(wasmx(storage, env, logType));
    return main();
}

export function u8ArrayToHex(arr) {
    return arr.reduce((accum, v) => accum + v.toString(16).padStart(2, '0'), "");
}
