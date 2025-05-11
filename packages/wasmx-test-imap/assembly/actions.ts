import { JSON } from "json-as";
import * as imapw from "wasmx-env-imap/assembly/imap_wrap";
import { ImapCloseRequest, ImapCloseResponse, ImapConnectionOauth2Request, ImapConnectionResponse, ImapConnectionSimpleRequest, ImapCreateFolderRequest, ImapCreateFolderResponse, ImapFetchRequest, ImapFetchResponse, ImapListenRequest, ImapListenResponse } from "wasmx-env-imap/assembly/types";

export function ConnectWithPassword(req: ImapConnectionSimpleRequest): ArrayBuffer {
    const resp = imapw.ConnectWithPassword(req)
    return String.UTF8.encode(JSON.stringify<ImapConnectionResponse>(resp))
}

export function ConnectOAuth2(req: ImapConnectionOauth2Request): ArrayBuffer {
    const resp = imapw.ConnectOAuth2(req)
    return String.UTF8.encode(JSON.stringify<ImapConnectionResponse>(resp))
}

export function Close(req: ImapCloseRequest): ArrayBuffer {
    const resp = imapw.Close(req)
    return String.UTF8.encode(JSON.stringify<ImapCloseResponse>(resp))
}

export function Fetch(req: ImapFetchRequest): ArrayBuffer {
    const resp = imapw.Fetch(req)
    return String.UTF8.encode(JSON.stringify<ImapFetchResponse>(resp))
}

export function Listen(req: ImapListenRequest): ArrayBuffer {
    const resp = imapw.Listen(req)
    return String.UTF8.encode(JSON.stringify<ImapListenResponse>(resp))
}

export function CreateFolder(req: ImapCreateFolderRequest): ArrayBuffer {
    const resp = imapw.CreateFolder(req)
    return String.UTF8.encode(JSON.stringify<ImapCreateFolderResponse>(resp))
}
