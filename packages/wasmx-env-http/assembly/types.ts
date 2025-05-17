import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-http"

@json
export class HttpRequest {
    method: string = "";
    url: string = "";
    header: Map<string, string[]> | null= null;
    data: Base64String = "";

    constructor(method: string, url: string, header: Map<string, string[]> | null, data: Base64String) {
        this.method = method;
        this.url = url;
        this.header = header;
        this.data = data;
    }
}

@json
export class ResponseHandler {
    max_size: i64 = 0;
    file_path: string = "";

    constructor(max_size: i64, file_path: string) {
        this.max_size = max_size;
        this.file_path = file_path;
    }
}

@json
export class HttpRequestWrap {
    request: HttpRequest = new HttpRequest("", "", null, "");
    response_handler: ResponseHandler = new ResponseHandler(0, "");

    constructor(request: HttpRequest, response_handler: ResponseHandler) {
        this.request = request;
        this.response_handler = response_handler;
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
