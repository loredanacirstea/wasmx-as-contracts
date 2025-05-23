import { JSON } from "json-as";
import { HttpRequestIncoming, HttpResponse, HttpResponseWrap } from "wasmx-env-httpserver/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { getProvider, getEndpoint, HttpServerRegistrySdk, setUserInfo, getUserInfo } from "wasmx-httpserver-registry/assembly/sdk";
import { SetRouteRequest } from "wasmx-httpserver-registry/assembly/types";
import { ParsedUrl, parseUrl } from "wasmx-httpserver-registry/assembly/url";
import { OAuth2UserInfo, UserInfoToWrite } from "wasmx-httpserver-registry/assembly/types_oauth2";
import * as oauth2cw from "wasmx-env-oauth2client/assembly/oauth2client_wrap";
import { getDtypeSdk, LoggerDebugExtended, revert } from "./utils";
import { AuthUrlParam, Endpoint, ExchangeCodeForTokenRequest, GetRedirectUrlRequest, Oauth2ClientGetRequest, OAuth2Config, Token } from "wasmx-env-oauth2client/assembly/types";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";
import { UserInfo } from "wasmx-env-imap/assembly/types";

// "/login/web/{provider}"
const routeOAuth2Web = "/login/web"
const templateOAuth2Web = `${routeOAuth2Web}/{provider}`
// "/login/ios/{provider}"
const routeOAuth2IOS = "/login/ios"
const templateOAuth2IOS = `${routeOAuth2IOS}/{provider}`
// "/auth/callback/web/{provider}"
const routeOAuth2CallbackWeb = "/auth/callback/web"
const templateOAuth2CallbackWeb = `${routeOAuth2CallbackWeb}/{provider}`
// "/auth/callback/ios/{provider}"
const routeOAuth2CallbackIOS = "/auth/callback/ios"
const templateOAuth2CallbackIOS = `${routeOAuth2CallbackIOS}/{provider}`
// "/session/exchange/{id}"
const routeExchangeSessionId = "/session/exchange"
const templateExchangeSessionId = `${routeOAuth2Web}/{id}`

// r.HandleFunc("/session", authMiddleware(sessionHandler))

// content paths
const routeUserInfo = "/email/user"
const templateRouteUserInfo = `${routeUserInfo}/{email}`

const routeCacheEmail = "/email/search"
const templateRouteCacheEmail = routeCacheEmail

const baseRoutes: string[] = [
    routeOAuth2Web, routeOAuth2IOS,
    routeOAuth2CallbackWeb, routeOAuth2CallbackIOS,
    routeExchangeSessionId,
    routeUserInfo,
    routeCacheEmail,
]

export function registerOAuth2(httpserver: HttpServerRegistrySdk, dtype: DTypeSdk): void {
    const addr = wasmxw.getAddress()
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2Web, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2IOS, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2CallbackWeb, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2CallbackIOS, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeExchangeSessionId, addr, false, ""))

    // content
    httpserver.SetRoute(new SetRouteRequest(routeUserInfo, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeCacheEmail, addr, false, ""))
}

export function HttpRequestHandler(req: HttpRequestIncoming): ArrayBuffer {
    const resp = HttpRequestHandlerInternal(req)
    return String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
}

export function HttpRequestHandlerInternal(req: HttpRequestIncoming): HttpResponseWrap {
    for (let i = 0; i < baseRoutes.length; i++) {
        if (req.url.includes(baseRoutes[i])) {
            return handleRoute(baseRoutes[i], req)
        }
    }
    return notFoundResponse()
}

export function handleRoute(baseUrl: string, req: HttpRequestIncoming): HttpResponseWrap {
    if (baseUrl == routeOAuth2Web) return handleOAuth2Web(req);
    if (baseUrl == routeOAuth2IOS) return handleOAuth2IOS(req);
    if (baseUrl == routeOAuth2CallbackWeb) return handleOAuth2CallbackWeb(req);
    if (baseUrl == routeOAuth2CallbackIOS) return handleOAuth2CallbackIOS(req);
    if (baseUrl == routeExchangeSessionId) return handleExchangeSessionId(req);

    // content
    if (baseUrl == routeUserInfo) return handleUserInfo(req);
    if (baseUrl == routeCacheEmail) return handleCacheEmail(req);

    return notFoundResponse()
}

export function handleOAuth2Web(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateOAuth2Web)
    return handleOAuth2(req, "web", url);
}

export function handleOAuth2IOS(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateOAuth2IOS)
    return handleOAuth2(req, "ios", url);
}

export function handleOAuth2(req: HttpRequestIncoming, clientType: string, url: ParsedUrl): HttpResponseWrap {
    LoggerDebugExtended("handleOAuth2", ["url", req.url])
    const dtype = getDtypeSdk()

    if (!url.routeParams.has("provider")) {
        return simpleResponse("400 Bad Request", 400, "empty provider")
    }
    const provider = url.routeParams.get("provider")
    const config = getProvider(dtype, provider);
    if (config == null) {
        return simpleResponse("400 Bad Request", 400, "invalid provider")
    }
    config.redirect_url = loginRedirectUrl(provider, clientType)
    const endpoint = getEndpoint(dtype, provider);
    if (endpoint == null) {
        return simpleResponse("400 Bad Request", 400, "provider endpoint not found")
    }

    const configWithEndpoint = new OAuth2Config(
        config.client_id,
        config.client_secret,
        config.redirect_url,
        JSON.parse<string[]>(config.scopes),
        new Endpoint(endpoint.auth_url, endpoint.device_auth_url, endpoint.token_url, endpoint.auth_style),
    )
    const resp = oauth2cw.GetRedirectUrl(new GetRedirectUrlRequest(
        configWithEndpoint,
        getRandomState(),
        [new AuthUrlParam("access_type", "offline")],
    ))
    if (resp.error != "") {
        return simpleResponse("500 Internal Server Error", 500, resp.error)
    }

    // http.StatusTemporaryRedirect
    return wrapResp(new HttpResponse("307 REDIRECT", 307, null, "", resp.url))
}

export function handleOAuth2CallbackWeb(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateOAuth2CallbackWeb)
    return handleOAuth2Callback(req, "web", url)
}

export function handleOAuth2CallbackIOS(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateOAuth2CallbackIOS)
    return handleOAuth2Callback(req, "ios", url)
}

// /auth/callback/web/google?state=somenewstate&code=somecode&scope=...
export function handleOAuth2Callback(req: HttpRequestIncoming, clientType: string, url: ParsedUrl): HttpResponseWrap {
    LoggerDebugExtended("handleOAuth2Callback", ["url", req.url])
    const dtype = getDtypeSdk()
    if (!url.routeParams.has("provider")) {
        return simpleResponse("400 Bad Request", 400, "empty provider")
    }
    const provider = url.routeParams.get("provider")
    const config = getProvider(dtype, provider);
    if (config == null) {
        return simpleResponse("400 Bad Request", 400, "invalid provider")
    }
    config.redirect_url = loginRedirectUrl(provider, clientType)
    const endpoint = getEndpoint(dtype, provider);
    if (endpoint == null) {
        return simpleResponse("400 Bad Request", 400, "provider endpoint not found")
    }

    const configWithEndpoint = new OAuth2Config(
        config.client_id,
        config.client_secret,
        config.redirect_url,
        JSON.parse<string[]>(config.scopes),
        new Endpoint(endpoint.auth_url, endpoint.device_auth_url, endpoint.token_url, endpoint.auth_style),
    )

    let state = ""
    if (url.queryParams.has("state")) {
        state = url.queryParams.get("state")
    }
    // if (state == "" && req.data.length > 0) {
    //     const formData = JSON.parse<JSON.Obj>(base64ToString(req.data));
    //     console.log("--handleOAuth2Callback formData--" + formData.keys().join(" "));
    //     if (formData.has("state")) {
    //         const s = formData.get("state")
    //         if (s != null) {
    //             state = s.get<string>()
    //         }
    //     }
    // }

    if (state != getRandomState()) {
        return simpleResponse("401 HTTP Unauthorized", 401, "state parameter does not match")
    }
    let code = ""
    if (url.queryParams.has("code")) {
        code = url.queryParams.get("code")
    } else {
        return simpleResponse("401 HTTP Unauthorized", 401, "code not found")
    }
    const resp = oauth2cw.ExchangeCodeForToken(new ExchangeCodeForTokenRequest(
        configWithEndpoint,
        code,
    ))
    if (resp.error != "") {
        return simpleResponse("401 HTTP Unauthorized", 500, resp.error)
    }
    // console.log("--ExchangeCodeForToken access_token--" + resp.token.access_token)
    // console.log("--ExchangeCodeForToken refresh_token--" + resp.token.refresh_token)
    // console.log("--ExchangeCodeForToken token_type--" + resp.token.token_type)
    // console.log("--ExchangeCodeForToken expiry--" + resp.token.expiry)

    const getresp = oauth2cw.Get(new Oauth2ClientGetRequest(configWithEndpoint, resp.token, endpoint.user_info_url))
    if (getresp.error != "") {
        revert(`could not get user info`)
    }

    const info = JSON.parse<OAuth2UserInfo>(base64ToString(getresp.data))
    const userInfo = new UserInfoToWrite(info.email, info.name, info.sub, info.given_name, info.family_name, info.picture, provider, info.email_verified, JSON.stringify<Token>(resp.token));

    setUserInfo(dtype, userInfo);

    return simpleResponse("200 OK", 200, `logged in: ${userInfo.email}`)
}

export function handleExchangeSessionId(req: HttpRequestIncoming): HttpResponseWrap {
    // const url = parseUrl(req.url, templateExchangeSessionId)
    return notFoundResponse();
}

export function handleUserInfo(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteUserInfo)
    const dtype = getDtypeSdk()
    if (!url.routeParams.has("email")) {
        return simpleResponse("400 Bad Request", 400, "email account not provided")
    }
    const account = url.routeParams.get("email")
    const ui = getUserInfo(dtype, account)
    if (ui == null) {
        return simpleResponse("400 Bad Request", 400, "email account not found")
    }
    const info = new UserInfo(ui.email, ui.name, ui.sub, ui.given_name, ui.family_name, ui.picture, ui.email_verified)
    return simpleResponse("200 OK", 200, JSON.stringify<UserInfo>(info))
}

export function handleCacheEmail(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteCacheEmail)
    const dtype = getDtypeSdk()
    return simpleResponse("400 Bad Request", 400, "not implemented")
}

export function wrapResp(data: HttpResponse): HttpResponseWrap {
    return new HttpResponseWrap("", data);
}

export function simpleResponse(status: string, code: i32, data: string): HttpResponseWrap {
    return wrapResp(new HttpResponse(status, code, null, stringToBase64(data), ""))
}

// TODO random state
export function getRandomState(): string {
    return "somenewstate"
}

// TODO based on config
export function loginRedirectUrl(provider: string, clientType: string): string {
    const port = "9999"
    return `http://localhost:${port}/auth/callback/${clientType}/${provider}`
}

function notFoundResponse(): HttpResponseWrap {
    return wrapResp(new HttpResponse(
        "404 Not Found",
        404,
        null,
        "",
        "",
    ))
}
