import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { RolesChangedHook } from "wasmx-roles/assembly/types";
import { MsgCacheEmailRequest, MsgInitializeRequest, MsgListenEmailRequest, MsgRegisterProviderRequest, MsgSendEmailRequest, MsgConnectUserRequest, MsgIncomingEmail, MsgExpunge, MsgMetadata } from "./types";
import { HttpRequestIncoming } from "wasmx-env-httpserver/assembly/types";

@json
export class MsgEmpty {}

@json
export class CallData {
    RoleChanged: RolesChangedHook | null = null;
    RegisterProviders: MsgRegisterProviderRequest | null = null;
    ConnectUser: MsgConnectUserRequest | null = null;
    CacheEmail: MsgCacheEmailRequest | null = null;
    ListenEmail: MsgListenEmailRequest | null = null;
    SendEmail: MsgSendEmailRequest | null = null;

    HttpRequestHandler: HttpRequestIncoming | null = null;
}

@json
export class ReentryCalldata {
    IncomingEmail: MsgIncomingEmail | null = null;
    Expunge: MsgExpunge | null = null;
    Metadata: MsgMetadata | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataWrapInitialize(): MsgInitializeRequest {
    const calldraw = wasmx.getCallData();
    return JSON.parse<MsgInitializeRequest>(String.UTF8.decode(calldraw));
}

export function getCallDataWrapRoleChanged(): RolesChangedHook {
    const calldraw = wasmx.getCallData();
    return JSON.parse<RolesChangedHook>(String.UTF8.decode(calldraw));
}

export function getCallDataWrapReentry(): ReentryCalldata {
    const calldraw = wasmx.getCallData();
    return JSON.parse<ReentryCalldata>(String.UTF8.decode(calldraw));
}

export function getCallDataWrapIncomingRequest(): HttpRequestIncoming {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<HttpRequestIncoming>(calldstr);
}
