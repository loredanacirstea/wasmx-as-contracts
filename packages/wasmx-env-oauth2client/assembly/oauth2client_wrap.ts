import { JSON } from "json-as";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap"
import { HttpResponseWrap} from "wasmx-env-httpclient/assembly/types";
import * as oauth2c from './oauth2client';
import { ExchangeCodeForTokenRequest, ExchangeCodeForTokenResponse, GetRedirectUrlRequest, GetRedirectUrlResponse, MODULE_NAME, Oauth2ClientDoRequest, Oauth2ClientGetRequest, Oauth2ClientGetResponse, Oauth2ClientPostRequest, RefreshTokenRequest, RefreshTokenResponse } from "./types";

export function GetRedirectUrl(req: GetRedirectUrlRequest, moduleName: string = ""): GetRedirectUrlResponse {
    const requestStr = JSON.stringify<GetRedirectUrlRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "GetRedirectUrl", ["request", requestStr])
    const responsebz = oauth2c.GetRedirectUrl(String.UTF8.encode(requestStr));
    const resp = JSON.parse<GetRedirectUrlResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function ExchangeCodeForToken(req: ExchangeCodeForTokenRequest, moduleName: string = ""): ExchangeCodeForTokenResponse {
    const requestStr = JSON.stringify<ExchangeCodeForTokenRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "ExchangeCodeForToken", ["request", requestStr])
    const responsebz = oauth2c.ExchangeCodeForToken(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ExchangeCodeForTokenResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function RefreshToken(req: RefreshTokenRequest, moduleName: string = ""): RefreshTokenResponse {
    const requestStr = JSON.stringify<RefreshTokenRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "RefreshToken", ["request", requestStr])
    const responsebz = oauth2c.RefreshToken(String.UTF8.encode(requestStr));
    const resp = JSON.parse<RefreshTokenResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Get(req: Oauth2ClientGetRequest, moduleName: string = ""): Oauth2ClientGetResponse {
    const requestStr = JSON.stringify<Oauth2ClientGetRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Get", ["request", requestStr])
    const responsebz = oauth2c.Get(String.UTF8.encode(requestStr));
    const resp = JSON.parse<Oauth2ClientGetResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Do(req: Oauth2ClientDoRequest, moduleName: string = ""): HttpResponseWrap {
    const requestStr = JSON.stringify<Oauth2ClientDoRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Do", ["request", requestStr])
    const responsebz = oauth2c.Do(String.UTF8.encode(requestStr));
    const resp = JSON.parse<HttpResponseWrap>(String.UTF8.decode(responsebz));
    return resp
}

export function Post(req: Oauth2ClientPostRequest, moduleName: string = ""): HttpResponseWrap {
    const requestStr = JSON.stringify<Oauth2ClientPostRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Post", ["request", requestStr])
    const responsebz = oauth2c.Post(String.UTF8.encode(requestStr));
    const resp = JSON.parse<HttpResponseWrap>(String.UTF8.decode(responsebz));
    return resp
}
