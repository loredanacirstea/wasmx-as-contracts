import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { SignedTransaction } from "wasmx-env/assembly/types";
import { MsgCreateValidator, TypeUrl_MsgCreateValidator } from "./types";

export function extractCreateValidatorMsg(tx: SignedTransaction): MsgCreateValidator | null {
    const msgany = tx.body.messages[0]
    if (msgany.type_url != TypeUrl_MsgCreateValidator) {
        return null;
    }
    const msgstr = String.UTF8.decode(base64.decode(msgany.value).buffer)
    const msg = JSON.parse<MsgCreateValidator>(msgstr)
    return msg;
}
