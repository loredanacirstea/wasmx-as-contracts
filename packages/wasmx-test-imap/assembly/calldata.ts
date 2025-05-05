import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { ImapCloseRequest, ImapConnectionOauth2Request, ImapConnectionSimpleRequest, ImapCreateFolderRequest, ImapFetchRequest, ImapListenRequest } from "wasmx-env-imap/assembly/types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    ConnectWithPassword: ImapConnectionSimpleRequest | null = null;
    ConnectOAuth2: ImapConnectionOauth2Request | null = null;
    Close: ImapCloseRequest | null = null;
    Fetch: ImapFetchRequest | null = null;
    Listen: ImapListenRequest | null = null;
    CreateFolder: ImapCreateFolderRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

