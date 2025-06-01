import { JSON } from "json-as";
import { HttpRequestIncoming, HttpResponse, HttpResponseWrap } from "wasmx-env-httpserver/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as imapw from "wasmx-env-imap/assembly/imap_wrap";
import * as smtpw from "wasmx-env-smtp/assembly/smtp_wrap";
import { formatDateRFC1123Z, parseEmailMessage, serializeEmailMessage } from "wasmx-env-imap/assembly/utils";
import { Address, Email, EmailExtended, EmailPartial, Envelope, ListMailboxesRequest } from "wasmx-env-imap/assembly/types";
import { EmailToSend, SmtpBuildMailRequest, SmtpSendMailRequest } from "wasmx-env-smtp/assembly/types";
import { getProvider, getEndpoint, HttpServerRegistrySdk, setUserInfo, getUserInfo, setSession, getSession } from "wasmx-httpserver-registry/assembly/sdk";
import { SetRouteRequest } from "wasmx-httpserver-registry/assembly/types";
import { ParsedUrl, parseUrl } from "wasmx-httpserver-registry/assembly/url";
import { SessionToRead, SessionToWrite, UserInfoToWrite } from "wasmx-httpserver-registry/assembly/types_oauth2";
import { createSession, GenerateToken, NewExpirationTime, VerifyJWT } from "wasmx-httpserver-registry/assembly/session";
import * as oauth2cw from "wasmx-env-oauth2client/assembly/oauth2client_wrap";
import { getDtypeSdk, LoggerDebugExtended, revert } from "./utils";
import { AuthUrlParam, Endpoint, ExchangeCodeForTokenRequest, GetRedirectUrlRequest, Oauth2ClientGetRequest, OAuth2Config, Token } from "wasmx-env-oauth2client/assembly/types";
import { base64ToString, parseInt32, parseInt64, stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";
import { ImapCountRequest, UidSetRange, UserInfo } from "wasmx-env-imap/assembly/types";
import { CacheEmailInternal, ConnectUserInternal } from "./actions";
import { EmailToRead, EmailToWrite, SecretType_OAuth2, SecretType_Password, ThreadToRead, HandleOAuth2CallbackResponse, ExtendedResponse, ThreadWithEmails, HttpEmailNewRequest, HttpEmailForwardRequest, ThreadToDisplay } from "./types";
import { getConnectionId, getEmailById, getEmails, getThreadById, getThreadEmails, getThreadEmailsInternal, getThreads, getThreadWithEmailsById } from "./helpers";
import { getConfig, getRelationTypes, getTableIds } from "./storage";
import { LoggedMenu } from "./menu/logged";
import { EmailMenu } from "./menu/email_menu";
import { TemplateEmail } from "./menu/template_email";
import { EmailFolder, EmailFoldersHead } from "./menu/email_folders";

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
const templateRouteUserInfo = `${routeUserInfo}`

const routeFolders = "/email/folders"
const routeFoldersMenu = "/email/folders-menu"

// /email/cache/{account}?uid=&folder=&messageID=
const routeCacheEmail = "/email/cache"
const templateRouteCacheEmail = `${routeCacheEmail}`

// /email/email/{account}?id=&folder=
const routeEmail = `/email/email`
const templateRouteEmail = `${routeEmail}`

// /email/thread/{account}?id=
const routeThread = "/email/thread"
const templateRouteThread = `${routeThread}/{id}`

const routeThreads = "/email/threads"
const templateRouteThreads = `${routeThreads}/{folder}`


// const routeSession = "/email/session"
const routeCount = "/email/count"
const templateCount = `${routeCount}/{folder}`
const routeThreadWithMenu = `/email/thread-emails`
const templateThreadWithMenu = `${routeThreadWithMenu}/{id}`
const routeThreadEmail = `/email/thread-email-with-menu`
const templateThreadEmail = `${routeThreadEmail}/{id}`

const routeEmailNew = "/email/new"
const routeEmailForward = `/email/forward`
const templateEmailForward = `${routeEmailForward}/{id}`
// /email/{id}/forward

const routeEmails = "/email/emails"
const templateRouteEmails = `${routeEmails}/{folder}`

// const routeEmailWithMenu = `/email/email-with-menu`
// const routeDbThreads = `/email/db/threads`
// const routeDbThread = `/email/db/thread-with-menu`
// const routeEmailForward =  `/email/email-forward`

// TODO
// logout

const baseRoutes: string[] = [
    routeOAuth2Web, routeOAuth2IOS,
    routeOAuth2CallbackWeb, routeOAuth2CallbackIOS,
    routeExchangeSessionId,
    routeUserInfo,
    routeCacheEmail,

    routeEmails,
    routeEmail,

    routeFoldersMenu,
    routeFolders,

    routeCount,
    routeThreadWithMenu,
    routeThreadEmail,
    routeThreads,
    routeThread, // last

    routeEmailNew,
    routeEmailForward,


    // routeDbThreads,
    // routeDbThread,
]

// TODO auth middleware with JWT tokens!!
export function registerOAuth2(httpserver: HttpServerRegistrySdk, dtype: DTypeSdk): void {
    const addr = wasmxw.getAddress()
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2Web, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2IOS, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2CallbackWeb, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeOAuth2CallbackIOS, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeExchangeSessionId, addr, false, ""))

    // content
    httpserver.SetRoute(new SetRouteRequest(routeFoldersMenu, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeFolders, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeUserInfo, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeCacheEmail, addr, false, ""))

    httpserver.SetRoute(new SetRouteRequest(routeEmails, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeEmail, addr, false, ""))

    httpserver.SetRoute(new SetRouteRequest(routeThread, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeThreads, addr, false, ""))

    httpserver.SetRoute(new SetRouteRequest(routeCount, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeThreadWithMenu, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeThreadEmail, addr, false, ""))

    httpserver.SetRoute(new SetRouteRequest(routeEmailNew, addr, false, ""))
    httpserver.SetRoute(new SetRouteRequest(routeEmailForward, addr, false, ""))
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
    if (baseUrl == routeFoldersMenu) return handleRouteFoldersMenu(req);
    if (baseUrl == routeFolders) return handleRouteFolders(req);
    if (baseUrl == routeUserInfo) return handleUserInfo(req);
    if (baseUrl == routeCacheEmail) return handleCacheEmail(req);

    if (baseUrl == routeEmails) return handleRouteEmails(req);
    if (baseUrl == routeEmail) return handleRouteEmail(req);
    if (baseUrl == routeCount) return handleRouteCount(req);

    if (baseUrl == routeThreads) return handleRouteThreads(req);
    if (baseUrl == routeThreadWithMenu) return handleRouteThreadWithMenu(req);
    if (baseUrl == routeThreadEmail) return handleRouteThreadEmailWithMenu(req);
    if (baseUrl == routeThread) return handleRouteThread(req);

    if (baseUrl == routeEmailNew) return handleEmailNew(req);
    if (baseUrl == routeEmailForward) return handleEmailForward(req);

    return notFoundResponse()
}

export function validateSession(session: SessionToRead | null): string {
    if (session == null) return `unauthorized: session not found`;
    const cfg = getConfig()
    const claims = session.parseClaims()
    if (claims == null) return `unauthorized: claims not found`;
    const resp = VerifyJWT(cfg.jwt_secret, session.jwttoken, claims)
    if (resp.error != "") return `unauthorized: ${resp.error}`;
    if (resp.valid == false) return `unauthorized: JWT invalid`;
    return ""
}

export function validateSessionOAuth2(session: SessionToRead | null): string {
    let haserr = validateSession(session)
    if (haserr != "") return haserr
    if (session!.token == "") return "user is not logged in"
    if (session!.claims == "") return "claims not found"
    return ""
}

export function validateSessionPassw(session: SessionToRead | null): string {
    let haserr = validateSession(session)
    if (haserr != "") return haserr
    if (session!.password == "") return "user is not logged in"
    return ""
}

export function getAuthSession(dtype: DTypeSdk, req: HttpRequestIncoming): SessionToRead | null {
    let jwttoken = getAuthJWT(req)
    if (jwttoken == "") {
        // TODO disable this in production; used only for testing
        jwttoken = getAuthJWTFromUrl(req)
    }
    if (jwttoken == "") return null;
    return getSession(dtype, jwttoken)
}

export function getAuthJWT(req: HttpRequestIncoming): string {
    if (!req.header.has("Authorization")) {
        return ""
    }
    const authh = req.header.get("Authorization")
    if (authh.length == 0) return ""
    for (let i = 0; i < authh.length; i++) {
        const token = extractBearerToken(authh[i])
        if (token != "") return token;
    }
    return ""
}

export function getAuthJWTFromUrl(req: HttpRequestIncoming): string {
    const url = parseUrl(req.url, "/")
    if (!url.queryParams.has("token")) return ""
    return url.queryParams.get("token")
}

function extractBearerToken(authHeader: string): string {
    const prefix = "Bearer ";
    if (authHeader.startsWith(prefix)) {
      return authHeader.substr(prefix.length);
    }
    return "";
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
    const res = handleOAuth2Callback(req, "web", url)
    if (res.error != null) return res.error!
    const session = res.session!
    return jsonResponse(`{"JWTtoken":"${session.jwttoken}","username":"${session.username}"}`)
}

export function handleOAuth2CallbackIOS(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateOAuth2CallbackIOS)
    const res = handleOAuth2Callback(req, "ios", url)
    if (res.error != null) return res.error!
    const session = res.session!

    const SERVER_URL = "http://localhost:9999" // TODO get from http server
    const callbackUrl = encodeURIComponent(`${SERVER_URL}/session/exchange/${session.jwttoken}`)
    const redirectURL = `menutest://login?token=${session.jwttoken}&username=${session.username}&callback_url=${callbackUrl}`

    return wrapResp(new HttpResponse("307 REDIRECT", 307, null, "", redirectURL))
}

// /auth/callback/web/google?state=somenewstate&code=somecode&scope=...
export function handleOAuth2Callback(req: HttpRequestIncoming, clientType: string, url: ParsedUrl): HandleOAuth2CallbackResponse {
    const response = new HandleOAuth2CallbackResponse(null, null);
    LoggerDebugExtended("handleOAuth2Callback", ["url", req.url])
    const dtype = getDtypeSdk()
    if (!url.routeParams.has("provider")) {
        response.error = simpleResponse("400 Bad Request", 400, "empty provider")
        return response;
    }
    const provider = url.routeParams.get("provider")
    const config = getProvider(dtype, provider);
    if (config == null) {
        response.error = simpleResponse("400 Bad Request", 400, "invalid provider")
        return response;
    }
    config.redirect_url = loginRedirectUrl(provider, clientType)
    const endpoint = getEndpoint(dtype, provider);
    if (endpoint == null) {
        response.error = simpleResponse("400 Bad Request", 400, "provider endpoint not found")
        return response;
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
        response.error = simpleResponse("401 HTTP Unauthorized", 401, "state parameter does not match")
        return response
    }
    let code = ""
    if (url.queryParams.has("code")) {
        code = url.queryParams.get("code")
    } else {
        response.error = simpleResponse("401 HTTP Unauthorized", 401, "code not found")
        return response
    }
    const resp = oauth2cw.ExchangeCodeForToken(new ExchangeCodeForTokenRequest(
        configWithEndpoint,
        code,
    ))
    if (resp.error != "") {
        response.error = simpleResponse("401 HTTP Unauthorized", 500, resp.error)
        return response
    }

    const getresp = oauth2cw.Get(new Oauth2ClientGetRequest(configWithEndpoint, resp.token, endpoint.user_info_url))
    if (getresp.error != "") {
        revert(`could not get user info`)
    }

    // store user info
    const info = JSON.parse<UserInfoToWrite>(base64ToString(getresp.data))
    const userInfo = new UserInfoToWrite(info.email, info.name, info.sub, info.given_name, info.family_name, info.picture, provider, info.email_verified);
    setUserInfo(dtype, userInfo);

    // create session
    const cfg = getConfig()
    const session = createSession(cfg.jwt_secret, cfg.session_expiration_ms, provider, info.email, "", resp.token)
    setSession(dtype, session)

    response.session = session
    return response
}

export function handleExchangeSessionId(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateExchangeSessionId)
    if (!url.routeParams.has("id")) {
        return simpleResponse("400 Bad Request", 400, "empty id")
    }
    const id = url.routeParams.get("id")
    if (id == "") {
        return simpleResponse("400 Bad Request", 400, "empty id")
    }
    const dtype = getDtypeSdk()
    const session = getSession(dtype, id)
    const haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const cfg = getConfig()
    const newsession = createSession(cfg.jwt_secret, cfg.session_expiration_ms, session!.provider, session!.username, "", session!.parseToken())
    setSession(dtype, newsession)

    const resp = new ExtendedResponse(new JSON.Raw(`{"JWTtoken":"${newsession.jwttoken}"}`), LoggedMenu, "")

    return jsonResponse(JSON.stringify<ExtendedResponse>(resp))
}

export function handleUserInfo(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteUserInfo)
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    const haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const ui = getUserInfo(dtype, session!.username)
    if (ui == null) {
        return simpleResponse("400 Bad Request", 400, "email account not found")
    }
    const info = new UserInfo(ui.email, ui.name, ui.sub, ui.given_name, ui.family_name, ui.picture, ui.email_verified)
    return jsonResponse(JSON.stringify<UserInfo>(info))
}

export function handleCacheEmail(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteCacheEmail)
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const account = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    let uid = 0;
    let messageId = "";
    let folder = "INBOX"
    if (url.queryParams.has("uid")) {
        const uidstr = url.queryParams.get("uid")
        if (uidstr != "") uid = parseInt32(uidstr)
    }
    if (url.queryParams.has("messageID")) {
        messageId = url.queryParams.get("messageID")
    }
    if (url.queryParams.has("folder")) {
        folder = decodeURIComponent(url.queryParams.get("folder"))
    }
    if (uid == 0) simpleResponse("400 Bad Request", 400, "empty UID")

    const emails = CacheEmailInternal(account, folder, null, [new UidSetRange(uid, uid)])
    let data = ""
    if (emails.length > 0) {
        data = JSON.stringify<EmailToRead>(emails[0])
    }
    return jsonResponse(data)
}

export function handleRouteEmail(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteEmail)
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const account = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    const ids = getTableIds()
    let id: i64 = 0;
    if (url.queryParams.has("id")) {
        const uidstr = url.queryParams.get("id")
        if (uidstr != "") id = parseInt64(uidstr)
    }
    if (id == 0) simpleResponse("400 Bad Request", 400, "empty ID")
    const email = getEmailById(ids, dtype, account, id);
    if (email == null) {
        return simpleResponse("404 NOT FOUND", 404, "not found")
    }
    return jsonResponse(JSON.stringify<EmailToRead>(email))
}

export function handleRouteThread(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteThread)
    const dtype = getDtypeSdk()

    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const account = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    const ids = getTableIds()
    let id: i64 = 0;
    if (url.routeParams.has("id")) {
        const uidstr = url.routeParams.get("id")
        if (uidstr != "") id = parseInt64(uidstr)
    }
    if (id == 0) simpleResponse("400 Bad Request", 400, "empty ID")
    const thread = getThreadById(ids, dtype, account, id);
    if (thread == null) {
        return simpleResponse("404 NOT FOUND", 404, "not found")
    }
    return jsonResponse(JSON.stringify<ThreadToDisplay>(ThreadToDisplay.fromThreadToRead(thread)))
}

export function handleRouteThreads(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteThreads)
    const dtype = getDtypeSdk()

    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    let folder = "INBOX"
    if (url.routeParams.has("folder") && url.routeParams.get("folder") != "") {
        folder = decodeURIComponent(url.routeParams.get("folder"))
    }
    const account = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    const ids = getTableIds()
    const threads = getThreads(ids, dtype, account, folder);
    return jsonResponse(JSON.stringify<ThreadToDisplay[]>(ThreadToDisplay.fromThreadsToRead(threads)))
}

export function handleRouteFolders(req: HttpRequestIncoming): HttpResponseWrap {
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const connId = getConnectionId(username)
    const resp = imapw.ListMailboxes(new ListMailboxesRequest(connId))
    if (resp.error != "") {
        return simpleResponse("500 Internal Server Error", 500, resp.error)
    }
    return jsonResponse(JSON.stringify<string[]>(resp.mailboxes))
}

export function handleRouteFoldersMenu(req: HttpRequestIncoming): HttpResponseWrap {
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const connId = getConnectionId(username)
    const resp = imapw.ListMailboxes(new ListMailboxesRequest(connId))
    if (resp.error != "") {
        return simpleResponse("500 Internal Server Error", 500, resp.error)
    }
    const foldersMenu: string[] = []
    for (let i = 0; i < resp.mailboxes.length; i++) {
        foldersMenu.push(EmailFolder(i.toString(), resp.mailboxes[i]))
    }
    const menu = EmailFoldersHead(foldersMenu.join(","))
    return jsonResponse(menu)
}

export function handleRouteCount(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateCount)
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const connId = getConnectionId(username)
    let folder = "INBOX"
    if (url.routeParams.has("folder") && url.routeParams.get("folder") != "") {
        folder = decodeURIComponent(url.routeParams.get("folder"))
    }

    const resp = imapw.Count(new ImapCountRequest(connId, folder))
    if (resp.error != "") {
        return simpleResponse("500 Internal Server Error", 500, resp.error)
    }
    return jsonResponse(`{"count":${resp.count}}`)
}

export function handleRouteThreadWithMenu(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateThreadWithMenu)
    const dtype = getDtypeSdk()

    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    if (!url.routeParams.has("id")) {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const idstr = url.routeParams.get("id")
    if (idstr == "") {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const id = parseInt64(idstr)
    const ids = getTableIds()
    const reltypeIds = getRelationTypes()

    const data = getThreadEmailsInternal(dtype, ids, reltypeIds, id, ["id", "name"])
    return jsonResponse(data)
}

export function handleRouteThreadEmailWithMenu(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateThreadEmail)
    const dtype = getDtypeSdk()

    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    if (!url.routeParams.has("id")) {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const idstr = url.routeParams.get("id")
    if (idstr == "") {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const id = parseInt64(idstr)
    const ids = getTableIds()

    const email = getEmailById(ids, dtype, username, id)
    if (email == null) {
        return simpleResponse("404 Not Found", 404, "not found")
    }
    const menu = EmailMenu.replaceAll("{id}", id.toString()).replaceAll("{summary}", email.name)

    const resp = new ExtendedResponse(
        new JSON.Raw(JSON.stringify<Email>(email.toEmail())),
        menu,
        TemplateEmail,
    )
    return jsonResponse(JSON.stringify<ExtendedResponse>(resp))
}

export function handleRouteEmails(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateRouteEmails)
    const dtype = getDtypeSdk()

    let folder = ""
    if (url.routeParams.has("folder")) {
        folder = decodeURIComponent(url.routeParams.get("folder"))
    }

    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    const ids = getTableIds()
    // TODO pagination from url queries

    const emails = getEmails(ids, dtype, username, folder)
    const emails_: EmailPartial[] = []
    for (let i = 0; i < emails.length; i++) {
        emails_.push(new EmailPartial(emails[i].id, emails[i].name))
    }
    return jsonResponse(JSON.stringify<EmailPartial[]>(emails_))
}

export function handleEmailNew(req: HttpRequestIncoming): HttpResponseWrap {
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const connId = getConnectionId(username)
    const emailPart = JSON.parse<HttpEmailNewRequest>(base64ToString(req.data))

    const ui = getUserInfo(dtype, username)
    let name = ""
    if (ui && ui.name) {
        name = ui.name
    }

    const to: Address[] = []
    for (let i = 0; i < emailPart.to.length; i++) {
        to.push(Address.fromString(emailPart.to[i], ""))
    }
    let cc: Address[] | null = null;
    if (emailPart.cc != null) {
        cc = [];
        for (let i = 0; i < emailPart.cc!.length; i++) {
            cc.push(Address.fromString(emailPart.cc![i], ""))
        }
    }
    let bcc: Address[] | null = null;
    if (emailPart.bcc != null) {
        bcc = [];
        for (let i = 0; i < emailPart.bcc!.length; i++) {
            bcc.push(Address.fromString(emailPart.bcc![i], ""))
        }
    }

    const envelope =  new Envelope(
        new Date(Date.now()),
        emailPart.subject,
        [Address.fromString(username, name)],
        [Address.fromString(username, name)],
        [],
        to,
        cc,
        bcc,
        null,
        "",
    )
    const header = new Map<string, Array<string>>()
    const email = new EmailToSend(
        envelope,
        header,
        emailPart.body,
        [], // TODO attachments
    )
    // TODO build should be in the contract

    const emailstr = serializeEmailMessage(email.toEmailExtended(), true)
    const encoded = stringToBase64(emailstr)

    const response = smtpw.SendMail(new SmtpSendMailRequest(connId, username, emailPart.to, encoded))
    if (response.error != "") {
        return simpleResponse("500 Internal Server Error", 500, response.error)
    }
    return jsonResponse(`{"success":true}`)
}

export function handleEmailForward(req: HttpRequestIncoming): HttpResponseWrap {
    const url = parseUrl(req.url, templateEmailForward)
    const dtype = getDtypeSdk()
    const session = getAuthSession(dtype, req)
    let haserr = validateSession(session)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }
    const username = session!.username
    haserr = connectUser(session!)
    if (haserr != "") {
        return simpleResponse("401 HTTP Unauthorized", 401, haserr)
    }

    if (!url.routeParams.has("id")) {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const idstr = url.routeParams.get("id")
    if (idstr == "") {
        return simpleResponse("400 Bad Request", 400, "no id provider")
    }
    const id = parseInt64(idstr)

    const connId = getConnectionId(username)
    const ids = getTableIds()
    const email = getEmailById(ids, dtype, username, id)
    if (email == null) {
        return notFoundResponse()
    }

    const emailPart = JSON.parse<HttpEmailForwardRequest>(base64ToString(req.data))

    const ui = getUserInfo(dtype, username)
    let name = ""
    if (ui && ui.name) {
        name = ui.name
    }

    const to: Address[] = []
    for (let i = 0; i < emailPart.to.length; i++) {
        to.push(Address.fromString(emailPart.to[i], ""))
    }

    const emailFull = parseEmailMessage(base64ToString(email.raw));
    // change envelope
    const newsubject = "Fwd: " + emailFull.envelope!.Subject + ": " + emailPart.additionalSubject
    const fromAddress = Address.fromString(username, name)

    // emailFull.envelope!.Subject = newsubject
    // emailFull.envelope!.From = [fromAddress]
    // emailFull.envelope!.To = to

    // change headers too
    if (emailFull.header.has("From")) {
        emailFull.header.set("From", Address.toStrings([fromAddress]))
    }
    if (emailFull.header.has("To")) {
        emailFull.header.set("To", Address.toStrings(to))
    }
    if (emailFull.header.has("Subject")) {
        emailFull.header.set("Subject", [newsubject])
    }
    const serialized = serializeEmailMessage(emailFull, false);

    const response = smtpw.SendMail(new SmtpSendMailRequest(connId, username, emailPart.to, stringToBase64(serialized)))
    if (response.error != "") {
        return simpleResponse("500 Internal Server Error", 500, response.error)
    }
    return jsonResponse(`{"success":true}`)
}

export function connectUser(session: SessionToRead): string {
    if (session.token != "") {
        const token = session.parseToken()
        ConnectUserInternal(session.username, token!.access_token, SecretType_OAuth2)
        return ""
    } else if (session.password != "") {
        ConnectUserInternal(session.username, session.password, SecretType_Password)
        return ""
    }
    return "unauthorized: user is not logged in"
}

export function wrapResp(data: HttpResponse): HttpResponseWrap {
    return new HttpResponseWrap("", data);
}

export function jsonResponse(data: string): HttpResponseWrap {
    const header = new Map<string,string[]>()
    header.set("Content-Type", ["application/json"])
    return wrapResp(new HttpResponse("200 OK", 200, null, stringToBase64(data), ""))
}

export function textResponse(data: string): HttpResponseWrap {
    const header = new Map<string,string[]>()
    header.set("Content-Type", ["text/plain"])
    return wrapResp(new HttpResponse("200 OK", 200, null, stringToBase64(data), ""))
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
        "route not found",
    ))
}
