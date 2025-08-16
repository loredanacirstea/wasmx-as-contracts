// import * as wasmx_blocks from "wasmx-blocks/tests/utils.js";
import { load, LOG } from './wasmx.js';

// export const WASMX_BLOCKS_ADDRESS = btoa("wasmx_blocks");

export function runFnWrapped (storage = {}, env = {}) {
    return async function (fnName, config, args, runfn = "main") {
        let calldata;
        const config_ = encodeToUtf8Array(JSON.stringify(config));
        if (runfn === "main") {
          calldata = encodeToUtf8Array(JSON.stringify({[fnName]: args}));
        } else {
          calldata = args;
        }
        calldata = new Uint8Array([
          ...numToUint8Array32(config_.length),
          ...config_,
          ...numToUint8Array32(calldata.length),
          ...calldata,
        ])

        const defaultSender = encodeToUtf8Array("sender");
        const defaultContract = encodeToUtf8Array("contract");
        env = {
            ...env,
            currentCall: {
                sender: defaultSender,
                contract: defaultContract,
                ...env.currentCall,
                callData: calldata,
            },
            contracts: {},
        }
        // env.contracts[WASMX_BLOCKS_ADDRESS] = (calldata, isQuery) => {
        //     console.log("--inner call", calldata, isQuery);
        //     const storage = {};
        //     let runFn = wasmx_blocks.runFnWrapped(storage);
        //     runFn("instantiate", {initialBlockIndex: 1}, "instantiate").then(() => {
        //         return runFn("main", calldata, "main", true);
        //     })
        // }

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

export function parseMachine(origConfig) {
    origConfig.context = origConfig.context || {};
    let statePath = "#" + origConfig.id;
    const newConfig = {
        ...origConfig,
        context: Object.keys(origConfig.context).map(key => {
            return {key: key, value: origConfig.context[key]};
        }),
        states: parseMachineStates(origConfig.states, statePath),
    };
    return newConfig;
}

function parseMachineStates(configStates = {}, statePath) {
    return Object.keys(configStates).map(key => {
        const stateName = key;
        const state = configStates[key];
        let _stateon = state.on || {};
        const stateon = Object.keys(_stateon).map(eventName => {
            let evs = _stateon[eventName];
            // evs can be a transition object
            // or an array of transitions (if/else)
            const transitions = [];
            if (!(evs instanceof Array)) {
                evs = [evs];
            }
            for (let i = 0; i < evs.length; i++) {
                const ev = evs[i];
                const actions = parseActions(ev.actions);
                const target = parseStateName(ev.target || "", statePath);
                const meta = parseMeta(ev.meta || {});
                const tr = {
                    target: target,
                    guard: parseGuard(ev),
                    actions,
                    meta,
                }
                transitions.push(tr)
            }

            return {
                name: eventName || "",
                transitions,
            }
        })

        let _stateafter = state.after || {};
        const stateafter = Object.keys(_stateafter).map(delayKey => {
            let evs = _stateafter[delayKey];
            if (!(evs instanceof Array)) {
                evs = [evs];
            }
            const transitions = [];
            for (let i = 0; i < evs.length; i++) {
                const ev = evs[i];
                const actions = parseActions(ev.actions);
                const meta = parseMeta(ev.meta || {});
                const tr = {
                    target: parseStateName(ev.target || "", statePath),
                    guard: parseGuard(ev),
                    actions,
                    meta,
                }
                transitions.push(tr)
            }

            return {
                name: delayKey || "",
                transitions: transitions,
            }
        })

        let statealways = []
        if (state.always) {
            if (!(state.always instanceof Array)) {
                state.always = [state.always];
            }
            for (let i = 0; i < state.always.length; i++) {
                const tr = {
                    ...state.always[i],
                    guard: parseGuard( state.always[i]),
                    target: parseStateName(state.always[i].target || "", statePath),
                    actions: parseActions(state.always[i].actions || []),
                    meta: parseMeta(state.always[i].meta || {}),
                }
                const st = {
                    name: "always",
                    transitions: [tr],
                }
                statealways.push(st);
            }
        }

        const entryActions = parseActions(state.entry);
        const exitActions = parseActions(state.exit);
        const initialState = state.initial || "";

        return {
            name: stateName,
            after: stateafter,
            always: statealways,
            on: stateon,
            entry: entryActions,
            exit: exitActions,
            initial: initialState,
            states: state.states ? parseMachineStates(state.states, statePath + "." + stateName) : [],
        }
    })
}

function parseMeta(meta) {
    const metaArray = [];
    const keys = Object.keys(meta);
    for (let i = 0; i < keys.length; i++) {
        metaArray.push({key: keys[i], value: meta[keys[i]]})
    }
    return metaArray;
}

// object or array
function parseActions(oactions) {
    const actions = [];
    if (!oactions) oactions = [];
    if (oactions instanceof Object && !(oactions instanceof Array)) {
        oactions = [oactions];
    }
    for (let i = 0; i < oactions.length; i++) {
        let ev = oactions[i].event;
        if (ev) {
            ev = {type: ev.type || "", params: ev.params || []}
        }
        const action = {
            ...oactions[i],
            params: Object.keys(oactions[i].params || {}).map(stateName => {
                return {key: stateName, value: oactions[i].params[stateName]};
            }),
            event: ev,
        }
        actions.push(action);
    }
    return actions;
}

export function uint8ArrayToHex(arr) {
    return arr.reduce((accum, v) => accum + v.toString(16).padStart(2, '0'), "");
}

export function raise(event, options = {}) {
    const _event = {type: event.type, params: []}
    const evkeys = Object.keys(event);
    for (let i = 0; i < evkeys.length; i++) {
        if (evkeys[i] !== "type") {
            _event.params.push({key: evkeys[i], value: event[evkeys[i]]})
        }
    }
    const _raise = {};
    _raise.type = 'xstate.raise';
    _raise.event = _event;
    // _raise.id = options.id;
    // _raise.delay = options.delay;
    return _raise;
}

function parseStateName(stateName, statePath) {
    if (stateName == "") return stateName;
    if (stateName[0] == "#") return stateName;
    return statePath + "." + stateName;
}

function parseGuard(obj) {
    if (!obj.guard && !obj.cond) return null;
    let guard = obj.guard || obj.cond;
    if (typeof guard == "string") {
        guard = {type: guard};
    }
    guard = {...guard, params: guard.params || [] }
    return guard;
}

export function numToUint8Array(num) {
    let arr = new Uint8Array(8);

    for (let i = 0; i < 8; i++) {
      arr[i] = num % 256;
      num = Math.floor(num / 256);
    }

    return arr.reverse();
}

export function numToUint8Array32(num) {
    const val = numToUint8Array(num);
    return new Uint8Array([...new Uint8Array(24), ...val]);
}
