import assert from "assert";
import {
    runFnWrapped
} from './utils.js';

async function runTests() {
    const storage = {};
    let runFn = runFnWrapped(storage);
    await runFn("instantiate", {initialBlockIndex: 1}, "instantiate")
}

runTests();
