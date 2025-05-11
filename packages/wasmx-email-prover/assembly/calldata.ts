import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { SmtpBuildMailRequest, SmtpCloseRequest, SmtpConnectionOauth2Request, SmtpConnectionSimpleRequest, SmtpExtensionRequest, SmtpMaxMessageSizeRequest, SmtpNoopRequest, SmtpQuitRequest, SmtpSendMailRequest, SmtpSupportsAuthRequest, SmtpVerifyRequest } from "wasmx-env-smtp/assembly/types";
import { MsgCacheEmailRequest, MsgInitializeRequest, MsgInitializeResponse, MsgListenEmailRequest, MsgRegisterProviderRequest, MsgSendEmailRequest, MsgConnectUserRequest } from "./types";

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

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

