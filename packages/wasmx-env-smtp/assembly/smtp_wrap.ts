import { JSON } from "json-as/assembly";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap"
import * as smtp from './smtp';
import { SmtpCloseRequest, SmtpCloseResponse, SmtpConnectionOauth2Request, SmtpConnectionResponse, SmtpConnectionSimpleRequest, MODULE_NAME, SmtpQuitRequest, SmtpQuitResponse, SmtpExtensionRequest, SmtpExtensionResponse, SmtpNoopRequest, SmtpNoopResponse, SmtpSendMailRequest, SmtpSendMailResponse, SmtpVerifyRequest, SmtpVerifyResponse, SmtpSupportsAuthRequest, SmtpSupportsAuthResponse, SmtpMaxMessageSizeRequest, SmtpMaxMessageSizeResponse, SmtpBuildMailRequest, SmtpBuildMailResponse } from "./types";

export function ConnectWithPassword(req: SmtpConnectionSimpleRequest, moduleName: string = ""): SmtpConnectionResponse {
    const requestStr = JSON.stringify<SmtpConnectionSimpleRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "ConnectWithPassword", ["request", requestStr])
    const responsebz = smtp.ConnectWithPassword(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpConnectionResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function ConnectOAuth2(req: SmtpConnectionOauth2Request, moduleName: string = ""): SmtpConnectionResponse {
    const requestStr = JSON.stringify<SmtpConnectionOauth2Request>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "ConnectOAuth2", ["request", requestStr])
    const responsebz = smtp.ConnectOAuth2(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpConnectionResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(req: SmtpCloseRequest, moduleName: string = ""): SmtpCloseResponse {
    const requestStr = JSON.stringify<SmtpCloseRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Close", ["request", requestStr])
    const responsebz = smtp.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpCloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Quit(req: SmtpQuitRequest, moduleName: string = ""): SmtpQuitResponse {
    const requestStr = JSON.stringify<SmtpQuitRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Quit", ["request", requestStr])
    const responsebz = smtp.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpQuitResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Extension(req: SmtpExtensionRequest, moduleName: string = ""): SmtpExtensionResponse {
    const requestStr = JSON.stringify<SmtpExtensionRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Extension", ["request", requestStr]);
    const responsebz = smtp.Extension(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpExtensionResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function Noop(req: SmtpNoopRequest, moduleName: string = ""): SmtpNoopResponse {
    const requestStr = JSON.stringify<SmtpNoopRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Noop", ["request", requestStr]);
    const responsebz = smtp.Noop(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpNoopResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function SendMail(req: SmtpSendMailRequest, moduleName: string = ""): SmtpSendMailResponse {
    const requestStr = JSON.stringify<SmtpSendMailRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "SendMail", ["request", requestStr]);
    const responsebz = smtp.SendMail(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpSendMailResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function Verify(req: SmtpVerifyRequest, moduleName: string = ""): SmtpVerifyResponse {
    const requestStr = JSON.stringify<SmtpVerifyRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Verify", ["request", requestStr]);
    const responsebz = smtp.Verify(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpVerifyResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function SupportsAuth(req: SmtpSupportsAuthRequest, moduleName: string = ""): SmtpSupportsAuthResponse {
    const requestStr = JSON.stringify<SmtpSupportsAuthRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "SupportsAuth", ["request", requestStr]);
    const responsebz = smtp.SupportsAuth(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpSupportsAuthResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function MaxMessageSize(req: SmtpMaxMessageSizeRequest, moduleName: string = ""): SmtpMaxMessageSizeResponse {
    const requestStr = JSON.stringify<SmtpMaxMessageSizeRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "MaxMessageSize", ["request", requestStr]);
    const responsebz = smtp.MaxMessageSize(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpMaxMessageSizeResponse>(String.UTF8.decode(responsebz));
    return resp;
}

export function BuildMail(req: SmtpBuildMailRequest, moduleName: string = ""): SmtpBuildMailResponse {
    const requestStr = JSON.stringify<SmtpBuildMailRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "BuildMail", ["request", requestStr]);
    const responsebz = smtp.BuildMail(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SmtpBuildMailResponse>(String.UTF8.decode(responsebz));
    return resp;
}
