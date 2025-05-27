import assert from "assert";
import {
    serializeDeserializedEmailMessage,
    parseEmailMessage,
    serializeEmailMessage,
    removeQuotes,
    parseNameEmail,
    parseAddresses,
    parseHeaderLine,
    extractMultipartContent,
    extractBoundary,
    extractContentType,
    extractFilename,
    removeWhitespace,
    isWhitespace,
    formatDateRFC1123Z,
    generateBoundary,
} from "../build/debug.js";
import { Email1 } from "./testdata/email1.js";

// const email = parseEmailMessage(Email1)
// const serialized = serializeEmailMessage(email)
// assert.strictEqual(Email1, serialized);

const serialized = serializeDeserializedEmailMessage(Email1)
console.log("====serialized=====")
console.log(serialized)
// assert.strictEqual(Email1, serialized);

console.log("ok");
