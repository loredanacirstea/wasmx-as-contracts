import { JSON } from "json-as/assembly";
import * as smtpw from "wasmx-env-smtp/assembly/smtp_wrap";
import { SmtpBuildMailRequest, SmtpBuildMailResponse, SmtpCloseRequest, SmtpCloseResponse, SmtpConnectionOauth2Request, SmtpConnectionResponse, SmtpConnectionSimpleRequest, SmtpExtensionRequest, SmtpExtensionResponse, SmtpMaxMessageSizeRequest, SmtpMaxMessageSizeResponse, SmtpNoopRequest, SmtpNoopResponse, SmtpQuitRequest, SmtpQuitResponse, SmtpSendMailRequest, SmtpSendMailResponse, SmtpSupportsAuthRequest, SmtpSupportsAuthResponse, SmtpVerifyRequest, SmtpVerifyResponse } from "wasmx-env-smtp/assembly/types";

export function ConnectWithPassword(req: SmtpConnectionSimpleRequest): ArrayBuffer {
    const resp = smtpw.ConnectWithPassword(req)
    return String.UTF8.encode(JSON.stringify<SmtpConnectionResponse>(resp))
}

export function ConnectOAuth2(req: SmtpConnectionOauth2Request): ArrayBuffer {
    const resp = smtpw.ConnectOAuth2(req)
    return String.UTF8.encode(JSON.stringify<SmtpConnectionResponse>(resp))
}

export function Close(req: SmtpCloseRequest): ArrayBuffer {
    const resp = smtpw.Close(req)
    return String.UTF8.encode(JSON.stringify<SmtpCloseResponse>(resp))
}

export function Quit(req: SmtpQuitRequest): ArrayBuffer {
    const resp = smtpw.Quit(req)
    return String.UTF8.encode(JSON.stringify<SmtpQuitResponse>(resp))
}

export function Extension(req: SmtpExtensionRequest): ArrayBuffer {
    const resp = smtpw.Extension(req);
    return String.UTF8.encode(JSON.stringify<SmtpExtensionResponse>(resp));
}

export function Noop(req: SmtpNoopRequest): ArrayBuffer {
    const resp = smtpw.Noop(req);
    return String.UTF8.encode(JSON.stringify<SmtpNoopResponse>(resp));
}

export function SendMail(req: SmtpSendMailRequest): ArrayBuffer {
    const resp = smtpw.SendMail(req);
    return String.UTF8.encode(JSON.stringify<SmtpSendMailResponse>(resp));
}

export function Verify(req: SmtpVerifyRequest): ArrayBuffer {
    const resp = smtpw.Verify(req);
    return String.UTF8.encode(JSON.stringify<SmtpVerifyResponse>(resp));
}

export function SupportsAuth(req: SmtpSupportsAuthRequest): ArrayBuffer {
    const resp = smtpw.SupportsAuth(req);
    return String.UTF8.encode(JSON.stringify<SmtpSupportsAuthResponse>(resp));
}

export function MaxMessageSize(req: SmtpMaxMessageSizeRequest): ArrayBuffer {
    const resp = smtpw.MaxMessageSize(req);
    return String.UTF8.encode(JSON.stringify<SmtpMaxMessageSizeResponse>(resp));
}

export function BuildMail(req: SmtpBuildMailRequest): ArrayBuffer {
    const resp = smtpw.BuildMail(req);
    return String.UTF8.encode(JSON.stringify<SmtpBuildMailResponse>(resp));
}
