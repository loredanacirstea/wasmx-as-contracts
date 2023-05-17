import assert from "assert";
import { main } from "../build/debug.js";
assert.strictEqual(main().toString(), [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee].toString());
console.log("ok");
