import { JSON } from "json-as";
import { SDK } from "wasmx-env/assembly/sdk";
import { Endpoint, OAuth2ConfigToRead } from "wasmx-env-oauth2client/assembly/types";
import { GetRoutesResponse, RemoveRouteRequest, ROLE, RouteToRead, SetRouteRequest } from "./types";
import { TableNameOauth2Endpoint, TableNameOauth2Providers, TableNameOAuth2UserInfo } from "./defs_oauth2";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";
import { EndpointToRead, UserInfoToWrite } from "./types_oauth2";

export class HttpServerRegistrySdk extends SDK {
    constructor(
        caller_module_name: string,
        revert: (message: string) => void,
        LoggerInfo: (msg: string, parts: string[]) => void,
        LoggerError: (msg: string, parts: string[]) => void,
        LoggerDebug: (msg: string, parts: string[]) => void,
        LoggerDebugExtended: (msg: string, parts: string[]) => void,
    ) {
        super(caller_module_name, revert, LoggerInfo, LoggerError, LoggerDebug, LoggerDebugExtended);
        this.roleOrAddress = ROLE;
    }

    SetRoute(req: SetRouteRequest): void {
        const calld = `{"SetRoute":${JSON.stringify<SetRouteRequest>(req)}}`
        this.executeSafe(calld)
    }

    RemoveRoute(route: string): void {
        const calld = `{"RemoveRoute":${JSON.stringify<RemoveRouteRequest>(new RemoveRouteRequest(route))}}`
        this.executeSafe(calld)
    }

    GetRoutes(): RouteToRead[] {
        const calld = `{"GetRoutes":{}}`
        const resp = this.querySafe(calld)
        const routes = JSON.parse<GetRoutesResponse>(resp)
        return routes.routes
    }

    GetRoute(): RouteToRead | null {
        const calld = `{"GetRoute":{}}`
        const resp = this.querySafe(calld)
        const route = JSON.parse<RouteToRead[]>(resp)
        if (route.length == 0) return null;
        return route[0];
    }
}

export function getProvider(dtype: DTypeSdk, provider: string): OAuth2ConfigToRead | null {
    const config = dtype.Read(0, TableNameOauth2Providers, `{"provider":"${provider}"}`)
    const response = JSON.parse<OAuth2ConfigToRead[]>(config)
    if (response.length == 0) return null;
    return response[0]
}

export function getEndpoint(dtype: DTypeSdk, provider: string): EndpointToRead | null {
    const config = dtype.Read(0, TableNameOauth2Endpoint, `{"name":"${provider}"}`)
    const response = JSON.parse<EndpointToRead[]>(config)
    if (response.length == 0) return null;
    return response[0]
}

export function getUserInfo(dtype: DTypeSdk, email: string): UserInfoToWrite | null {
    const resp = dtype.Read(0, TableNameOAuth2UserInfo, `{"email":"${email}"}`)
    const response = JSON.parse<UserInfoToWrite[]>(resp)
    if (response.length == 0) return null;
    return response[0]
}

export function setUserInfo(dtype: DTypeSdk, info: UserInfoToWrite): i64 {
    const ids = dtype.Insert(0, TableNameOAuth2UserInfo, JSON.stringify<UserInfoToWrite>(info))
    if (ids.length == 0) return 0;
    return ids[0]
}
