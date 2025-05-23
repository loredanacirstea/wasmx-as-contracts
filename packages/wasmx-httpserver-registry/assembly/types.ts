import { JSON } from "json-as";
import { WebsrvConfig } from "wasmx-env-httpserver/assembly/types";

export const MODULE_NAME = "httpserver-registry"
export const ROLE = "httpserver_registry"

@json
export class TableIds {
    registry: i64 = 0
    oauth2_provider: i64 = 0
    oauth2_endpoint: i64 = 0
    oauth2_session: i64 = 0
    oauth2_userinfo: i64 = 0
    constructor(registry: i64, oauth2_provider: i64, oauth2_endpoint: i64, oauth2_userinfo: i64, oauth2_session: i64) {
        this.registry = registry
        this.oauth2_provider = oauth2_provider
        this.oauth2_endpoint = oauth2_endpoint
        this.oauth2_userinfo = oauth2_userinfo
        this.oauth2_session = oauth2_session
    }
}

@json
export class RouteToWrite {
    route: string = ""
    contract_address: string = ""
    authorization: boolean = false
    authorization_type: string = "" // "Bearer" | "mac" | "basic"
    constructor(route: string, contract_address: string, authorization: boolean, authorization_type: string) {
        this.route = route
        this.contract_address = contract_address
        this.authorization = authorization
        this.authorization_type = authorization_type
    }
}

@json
export class RouteToRead extends RouteToWrite {
    id: i64 = 0
    constructor(id: i64, route: string, contract_address: string, authorization: boolean, authorization_type: string) {
        super(route, contract_address, authorization, authorization_type);
        this.id = id
    }
}

@json
export class ResponseWithError {
    error: string = ""
    constructor(error: string) {
        this.error = error
    }
}

@json
export class InitializationRequest {
    config: WebsrvConfig = new WebsrvConfig(false, "", new Array(), new Array(), new Array(), 0, new Map(), 0);
    constructor(config: WebsrvConfig) {
        this.config = config
    }
}

@json
export class SetRouteRequest {
    route: string = ""
    contract_address: string = ""
    authorization: boolean = false
    authorization_type: string = "" // "Bearer" | "mac" | "basic"
    constructor(route: string, contract_address: string, authorization: boolean, authorization_type: string) {
        this.route = route
        this.contract_address = contract_address
        this.authorization = authorization
        this.authorization_type = authorization_type
    }
}

@json
export class RemoveRouteRequest {
    route: string = ""
    constructor(route: string) {
        this.route = route
    }
}

@json
export class GetRoutesRequest {}

@json
export class GetRouteRequest {
    route: string = ""
    constructor(route: string) {
        this.route = route
    }
}

@json
export class GetRoutesResponse {
    routes: RouteToRead[] = []
    constructor(routes: RouteToRead[]) {
        this.routes = routes
    }
}
