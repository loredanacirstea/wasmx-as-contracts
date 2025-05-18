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
    route_to_contract_address: Map<string, string> = new Map();
    request_body_max_size: i64 = 0;

    constructor(
        enable_oauth: bool,
        address: string,
        cors_allowed_origins: Array<string>,
        cors_allowed_methods: Array<string>,
        cors_allowed_headers: Array<string>,
        max_open_connections: i32,
        route_to_contract_address: Map<string, string>,
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
    config: WebsrvConfig = new WebsrvConfig(false, "", new Array(), new Array(), new Array(), 0, new Map(), 0);

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
    url: string = "";
    header: Map<string, string[]> = new Map();
    content_length: i64 = 0;
    data: Array<u8> = new Array<u8>();
    remote_address: string = "";
    request_uri: string = "";

    constructor(
        method: string = "",
        url: string = "",
        header: Map<string, string[]> = new Map(),
        content_length: i64 = 0,
        data: Array<u8> = new Array<u8>(),
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
    content_length: i64 = 0;
    uncompressed: bool = false;
    header: Map<string, string[]> | null = null;
    data: Base64String = "";

    constructor(
        status: string,
        status_code: i32,
        content_length: i64,
        uncompressed: bool,
        header: Map<string, string[]> | null,
        data: Base64String
    ) {
        this.status = status;
        this.status_code = status_code;
        this.content_length = content_length;
        this.uncompressed = uncompressed;
        this.header = header;
        this.data = data;
    }
}

@json
export class HttpResponseWrap {
    error: string = "";
    data: HttpResponse = new HttpResponse("", 0, 0, false, null, "");

    constructor(error: string, data: HttpResponse) {
        this.error = error;
        this.data = data;
    }
}
