import { JSON } from "json-as";
import { WebsrvConfig } from "wasmx-env-httpserver/assembly/types";

export const MODULE_NAME = "httpserver-registry"

@json
export class TableIds {
    registry: i64 = 0
    constructor(registry: i64) {
        this.registry = registry
    }
}

@json
export class RouteToRead {
    id: i64 = 0
    route: string = ""
    contract_address: string = ""
    constructor(id: i64, route: string, contract_address: string) {
        this.id = id
        this.route = route
        this.contract_address = contract_address
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
    constructor(route: string, contract_address: string) {
        this.route = route
        this.contract_address = contract_address
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
    routes: Map<string,string> = new Map<string,string>()
    constructor(routes: Map<string,string>) {
        this.routes = routes
    }
}

@json
export class GetRouteResponse {
    route: string = ""
    contract_address: string = ""
    constructor(route: string, contract_address: string) {
        this.route = route
        this.contract_address = contract_address
    }
}
