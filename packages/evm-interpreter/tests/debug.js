async function instantiate(module, imports = {}) {
  const __module0 = imports.wasmx;
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
      "console.log"(text) {
        // ~lib/bindings/dom/console.log(~lib/string/String) => void
        text = __liftString(text >>> 0);
        console.log(text);
      },
    }),
    wasmx: Object.assign(Object.create(__module0), {
      finish(value) {
        // assembly/wasmx/finish(~lib/arraybuffer/ArrayBuffer) => void
        value = __liftBuffer(value >>> 0);
        __module0.finish(value);
      },
      revert(message) {
        // assembly/wasmx/revert(~lib/arraybuffer/ArrayBuffer) => void
        message = __liftBuffer(message >>> 0);
        __module0.revert(message);
      },
      storageLoad(key) {
        // assembly/wasmx/storageLoad(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        key = __liftBuffer(key >>> 0);
        return __lowerBuffer(__module0.storageLoad(key)) || __notnull();
      },
      storageStore(key, value) {
        // assembly/wasmx/storageStore(~lib/arraybuffer/ArrayBuffer, ~lib/arraybuffer/ArrayBuffer) => void
        key = __liftBuffer(key >>> 0);
        value = __liftBuffer(value >>> 0);
        __module0.storageStore(key, value);
      },
      keccak256(value) {
        // assembly/wasmx/keccak256(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        value = __liftBuffer(value >>> 0);
        return __lowerBuffer(__module0.keccak256(value)) || __notnull();
      },
      getBalance(address) {
        // assembly/wasmx/getBalance(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        address = __liftBuffer(address >>> 0);
        return __lowerBuffer(__module0.getBalance(address)) || __notnull();
      },
      getAccount(address) {
        // assembly/wasmx/getAccount(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        address = __liftBuffer(address >>> 0);
        return __lowerBuffer(__module0.getAccount(address)) || __notnull();
      },
      getBlockHash(number) {
        // assembly/wasmx/getBlockHash(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        number = __liftBuffer(number >>> 0);
        return __lowerBuffer(__module0.getBlockHash(number)) || __notnull();
      },
      log(value) {
        // assembly/wasmx/log(~lib/arraybuffer/ArrayBuffer) => void
        value = __liftBuffer(value >>> 0);
        __module0.log(value);
      },
      externalCall(data) {
        // assembly/wasmx/externalCall(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        data = __liftBuffer(data >>> 0);
        return __lowerBuffer(__module0.externalCall(data)) || __notnull();
      },
      createAccount(account) {
        // assembly/wasmx/createAccount(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        account = __liftBuffer(account >>> 0);
        return __lowerBuffer(__module0.createAccount(account)) || __notnull();
      },
      create2Account(account) {
        // assembly/wasmx/create2Account(~lib/arraybuffer/ArrayBuffer) => ~lib/arraybuffer/ArrayBuffer
        account = __liftBuffer(account >>> 0);
        return __lowerBuffer(__module0.create2Account(account)) || __notnull();
      },
      getEnv() {
        // assembly/wasmx/getEnv() => ~lib/arraybuffer/ArrayBuffer
        return __lowerBuffer(__module0.getEnv()) || __notnull();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    main() {
      // assembly/index/main() => ~lib/array/Array<u8>
      return __liftArray(__getU8, 0, exports.main() >>> 0);
    },
  }, exports);
  function __liftBuffer(pointer) {
    if (!pointer) return null;
    return memory.buffer.slice(pointer, pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2]);
  }
  function __lowerBuffer(value) {
    if (value == null) return 0;
    const pointer = exports.__new(value.byteLength, 1) >>> 0;
    new Uint8Array(memory.buffer).set(new Uint8Array(value), pointer);
    return pointer;
  }
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      dataStart = __getU32(pointer + 4),
      length = __dataview.getUint32(pointer + 12, true),
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __getU8(pointer) {
    try {
      return __dataview.getUint8(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint8(pointer, true);
    }
  }
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  return adaptedExports;
}
export async function getExports(wasmxImport) {
    const exports = await (async url => instantiate(
        await (async () => {
          try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
          catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
        })(), {
          wasmx: __maybeDefault(wasmxImport),
        }
    ))(new URL("../build/debug.wasm", import.meta.url));
    return exports
}
function __maybeDefault(module) {
  return typeof module.default === "object" && Object.keys(module).length == 1
    ? module.default
    : module;
}
