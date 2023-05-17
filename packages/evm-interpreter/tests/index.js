import assert from "assert";
import { main } from "../build/debug.js";
assert.strictEqual(main(1, 2), 3);
console.log("ok");
