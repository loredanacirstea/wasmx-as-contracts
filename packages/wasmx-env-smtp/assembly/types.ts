import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";
import { Attachment, EmailExtended, Envelope, Headers } from "wasmx-env-imap/assembly/types";

export const MODULE_NAME = "wasmx-env-smtp"

@json
export class SmtpConnectionSimpleRequest {
    id: string = "";
    smtp_server_url_starttls: string = "";
    smtp_server_url_tls: string = "";
    username: string = "";
    password: string = "";

    constructor(id: string, smtp_server_url_starttls: string, smtp_server_url_tls: string, username: string, password: string) {
        this.id = id;
        this.smtp_server_url_starttls = smtp_server_url_starttls;
        this.smtp_server_url_tls = smtp_server_url_tls;
        this.username = username;
        this.password = password;
    }
}

@json
export class SmtpConnectionOauth2Request {
    id: string = "";
    smtp_server_url_starttls: string = "";
    smtp_server_url_tls: string = "";
    username: string = "";
    access_token: string = "";

    constructor(id: string, smtp_server_url_starttls: string, smtp_server_url_tls: string, username: string, access_token: string) {
        this.id = id;
        this.smtp_server_url_starttls = smtp_server_url_starttls;
        this.smtp_server_url_tls = smtp_server_url_tls;
        this.username = username;
        this.access_token = access_token;
    }
}

@json
export class SmtpConnectionResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpCloseRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

@json
export class SmtpCloseResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpQuitRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

@json
export class SmtpQuitResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpSendMailRequest {
    id: string = "";
    from: string = "";
    to: Array<string> = new Array<string>();
    email: Base64String = "";

    constructor(id: string, from: string, to: Array<string>, email: Base64String) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.email = email;
    }
}

@json
export class SmtpSendMailResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpVerifyRequest {
    id: string = "";
    address: string = "";

    constructor(id: string, address: string) {
        this.id = id;
        this.address = address;
    }
}

@json
export class SmtpVerifyResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpNoopRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

@json
export class SmtpNoopResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class SmtpExtensionRequest {
    id: string = "";
    name: string = "";

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

@json
export class SmtpExtensionResponse {
    error: string = "";
    found: bool = false;
    params: string = "";

    constructor(error: string, found: bool, params: string) {
        this.error = error;
        this.found = found;
        this.params = params;
    }
}

@json
export class SmtpMaxMessageSizeRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

@json
export class SmtpMaxMessageSizeResponse {
    error: string = "";
    size: i64 = 0;
    ok: bool = false;

    constructor(error: string, size: i64, ok: bool) {
        this.error = error;
        this.size = size;
        this.ok = ok;
    }
}

@json
export class SmtpSupportsAuthRequest {
    id: string = "";
    mechanism: string = "";

    constructor(id: string, mechanism: string) {
        this.id = id;
        this.mechanism = mechanism;
    }
}

@json
export class SmtpSupportsAuthResponse {
    error: string = "";
    found: bool = false;

    constructor(error: string, found: bool) {
        this.error = error;
        this.found = found;
    }
}

@json
export class EmailToSend {
    envelope: Envelope | null = null;
    headers: Headers = new Headers;
    body: string = "";
    attachments: Array<Attachment> = [];
    constructor(
        envelope: Envelope | null,
        headers: Headers,
        body: string,
        attachments: Array<Attachment>,
    ) {
        this.envelope = envelope;
        this.headers = headers;
        this.body = body;
        this.attachments = attachments;
    }

    toEmailExtended(): EmailExtended {
        return new EmailExtended(
            0, [], new Date(Date.now()), 0, this.envelope, this.headers, this.body, this.attachments, "", "", "", "",
        )
    }
}

@json
export class SmtpBuildMailRequest {
    email: EmailToSend;
    constructor(email: EmailToSend) {
        this.email = email
    }
}

@json
export class SmtpBuildMailResponse {
    error: string = "";
    data: Base64String = "";

    constructor(error: string,  data: Base64String) {
        this.error = error;
        this.data = data;
    }
}
