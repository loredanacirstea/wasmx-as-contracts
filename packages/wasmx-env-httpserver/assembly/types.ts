import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-httpserver"

@json
export class WebsrvConfig {
    enable_oauth: bool = false;
    address: string = "";
    cors_allowed_origins: Array<string> = new Array<string>();
    cors_allowed_methods: Array<string> = new Array<string>();
    cors_allowed_headers: Array<string> = new Array<string>();
    max_open_connections: i32 = 0;
    route_to_contract_address: Map<string, string> | null = null;
    request_body_max_size: i64 = 0;

    constructor(
        enable_oauth: bool,
        address: string,
        cors_allowed_origins: Array<string>,
        cors_allowed_methods: Array<string>,
        cors_allowed_headers: Array<string>,
        max_open_connections: i32,
        route_to_contract_address: Map<string, string> | null,
        request_body_max_size: i64
    ) {
        this.enable_oauth = enable_oauth;
        this.address = address;
        this.cors_allowed_origins = cors_allowed_origins;
        this.cors_allowed_methods = cors_allowed_methods;
        this.cors_allowed_headers = cors_allowed_headers;
        this.max_open_connections = max_open_connections;
        this.route_to_contract_address = route_to_contract_address;
        this.request_body_max_size = request_body_max_size;
    }
}

@json
export class StartWebServerRequest {
    config: WebsrvConfig = new WebsrvConfig(false, "", new Array(), new Array(), new Array(), 0, null, 0);

    constructor(config: WebsrvConfig) {
        this.config = config;
    }
}

@json
export class StartWebServerResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class HttpRequestIncoming {
    method: string = "";
    url: string = ""; // use this, not request_uri
    header: Map<string, string[]> = new Map();
    content_length: i64 = 0;
    data: Base64String = "";
    remote_address: string = "";
    request_uri: string = "";

    constructor(
        method: string = "",
        url: string = "",
        header: Map<string, string[]> = new Map(),
        content_length: i64 = 0,
        data: Base64String = "",
        remote_address: string = "",
        request_uri: string = ""
    ) {
        this.method = method;
        this.url = url;
        this.header = header;
        this.content_length = content_length;
        this.data = data;
        this.remote_address = remote_address;
        this.request_uri = request_uri;
    }
}

@json
export class SetRouteHandlerRequest {
    route: string = "";
    contract_address: string = "";

    constructor(route: string = "", contract_address: string = "") {
        this.route = route;
        this.contract_address = contract_address;
    }
}

@json
export class SetRouteHandlerResponse {
    error: string = "";

    constructor(error: string = "") {
        this.error = error;
    }
}

@json
export class RemoveRouteHandlerRequest {
    route: string = "";

    constructor(route: string = "") {
        this.route = route;
    }
}

@json
export class RemoveRouteHandlerResponse {
    error: string = "";

    constructor(error: string = "") {
        this.error = error;
    }
}

@json
export class CloseRequest {}

@json
export class CloseResponse {
    error: string = "";

    constructor(error: string = "") {
        this.error = error;
    }
}


@json
export class HttpResponse {
    status: string = "";
    status_code: i32 = 0;
    header: Map<string, string[]> | null = null;
    data: Base64String = "";
    redirect_url: string = "";

    constructor(
        status: string,
        status_code: i32,
        header: Map<string, string[]> | null,
        data: Base64String,
        redirect_url: string
    ) {
        this.status = status;
        this.status_code = status_code;
        this.header = header;
        this.data = data;
        this.redirect_url = redirect_url
    }
}

@json
export class HttpResponseWrap {
    error: string = "";
    data: HttpResponse | null = null;

    constructor(error: string, data: HttpResponse | null) {
        this.error = error;
        this.data = data;
    }
}
