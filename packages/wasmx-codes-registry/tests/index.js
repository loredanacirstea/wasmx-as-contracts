import assert from "assert";
import path from "path";
import { fileURLToPath } from "url";
import { getExports } from "wasmx-env/tests/debug.js";
import { wasmx, consensus, encodeToUtf8Array, decodeFromUtf8Array, LOG } from "wasmx-env/tests/wasmx.js";
import { genesisJsonSmall } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WasmDebugPath = path.resolve(__dirname, "..", "build", "debug.wasm");

runTests();

async function runTests() {
    const storage = {};
    let runFn = runFnWrapped(storage);
    await runFn("instantiate", genesisJsonSmall, "instantiate")
}

export async function load(storage = {}, env = {}, logType = LOG.debug) {
    const inst = await getExports(WasmDebugPath, {
        wasmx: wasmx(storage, env, logType),
        consensus: consensus(storage, env, logType),
    });
    return inst
}

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
        const resp = instance[runfn]();
        // console.log("memory: ", decodeFromUtf8Array(instance.memory.buffer))
        return resp
    }
}
