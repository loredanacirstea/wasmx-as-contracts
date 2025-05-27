export * from "./utils";
export function main(): void {}

import { JSON } from "json-as";
import { Email } from "./types";
import { parseEmailMessage, serializeEmailMessage } from "./utils";

export function serializeDeserializedEmailMessage(emailstr: string): string {
    const email = parseEmailMessage(emailstr)
    console.log("--parseEmailMessage--" + JSON.stringify<Email>(email))
    return serializeEmailMessage(email, false)
}
