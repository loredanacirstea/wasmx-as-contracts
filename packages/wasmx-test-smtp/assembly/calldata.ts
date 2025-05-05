import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { SmtpBuildMailRequest, SmtpCloseRequest, SmtpConnectionOauth2Request, SmtpConnectionSimpleRequest, SmtpExtensionRequest, SmtpMaxMessageSizeRequest, SmtpNoopRequest, SmtpQuitRequest, SmtpSendMailRequest, SmtpSupportsAuthRequest, SmtpVerifyRequest } from "wasmx-env-smtp/assembly/types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    ConnectWithPassword: SmtpConnectionSimpleRequest | null = null;
    ConnectOAuth2: SmtpConnectionOauth2Request | null = null;
    Close: SmtpCloseRequest | null = null;
    Quit: SmtpQuitRequest | null = null;
    Extension: SmtpExtensionRequest | null = null;
    Noop: SmtpNoopRequest | null = null;
    SendMail: SmtpSendMailRequest | null = null;
    Verify: SmtpVerifyRequest | null = null;
    SupportsAuth: SmtpSupportsAuthRequest | null = null;
    MaxMessageSize: SmtpMaxMessageSizeRequest | null = null;
    BuildMail: SmtpBuildMailRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

