import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCacheEmailRequest, MsgInitializeRequest, MsgListenEmailRequest, MsgRegisterProviderRequest, MsgSendEmailRequest, MsgConnectUserRequest, MsgIncomingEmail, MsgExpunge, MsgMetadata } from "./types";

@json
export class MsgEmpty {}

@json
export class CallData {
    Initialize: MsgInitializeRequest | null = null;
    RegisterProvider: MsgRegisterProviderRequest | null = null;
    ConnectUser: MsgConnectUserRequest | null = null;
    CacheEmail: MsgCacheEmailRequest | null = null;
    ListenEmail: MsgListenEmailRequest | null = null;
    SendEmail: MsgSendEmailRequest | null = null;
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

export function getCallDataWrapReentry(): ReentryCalldata {
    const calldraw = wasmx.getCallData();
    return JSON.parse<ReentryCalldata>(String.UTF8.decode(calldraw));
}
