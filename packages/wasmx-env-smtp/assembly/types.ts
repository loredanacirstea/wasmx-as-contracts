import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-smtp"

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class SmtpConnectionResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpCloseRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

// @ts-ignore
@serializable
export class SmtpCloseResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpQuitRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

// @ts-ignore
@serializable
export class SmtpQuitResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpSendMailRequest {
    id: string = "";
    from: string = "";
    to: Array<string> = new Array<string>();
    email: Array<u8> = new Array<u8>();

    constructor(id: string, from: string, to: Array<string>, email: Array<u8>) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.email = email;
    }
}

// @ts-ignore
@serializable
export class SmtpSendMailResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpVerifyRequest {
    id: string = "";
    address: string = "";

    constructor(id: string, address: string) {
        this.id = id;
        this.address = address;
    }
}

// @ts-ignore
@serializable
export class SmtpVerifyResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpNoopRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

// @ts-ignore
@serializable
export class SmtpNoopResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class SmtpExtensionRequest {
    id: string = "";
    name: string = "";

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class SmtpMaxMessageSizeRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class SmtpSupportsAuthRequest {
    id: string = "";
    mechanism: string = "";

    constructor(id: string, mechanism: string) {
        this.id = id;
        this.mechanism = mechanism;
    }
}

// @ts-ignore
@serializable
export class SmtpSupportsAuthResponse {
    error: string = "";
    found: bool = false;

    constructor(error: string, found: bool) {
        this.error = error;
        this.found = found;
    }
}

// @ts-ignore
@serializable
export class Attachment {
    filename: string = "";
    content_type: string = "";
    data: Base64String = "";

    constructor(filename: string, content_type: string, data: Base64String) {
        this.filename = filename;
        this.content_type = content_type;
        this.data = data;
    }
}

export type Flag = string;

@serializable
export class Address {
    Name: string = "";
    Mailbox: string = "";
    Host: string = "";
    constructor(
        name: string,
        mailbox: string,
        host: string,
    ) {
        this.Name = name
        this.Name = mailbox
        this.Name = host
    }
}

// @ts-ignore
@serializable
export class Envelope {
    Date: Date = new Date(0);
    Subject: string = "";
    From: Array<Address> = [];
    Sender: Array<Address> = [];
    ReplyTo: Array<Address> = [];
    To: Array<Address> = [];
    Cc: Array<Address> | null = null;
    Bcc: Array<Address>| null = null;
    InReplyTo: Array<string>| null = null;
    MessageID: string = "";

    constructor(
        date: Date,
        subject: string,
        from: Array<Address>,
        sender: Array<Address>,
        reply_to: Array<Address>,
        to: Array<Address>,
        cc: Array<Address> | null,
        bcc: Array<Address> | null,
        in_reply_to: Array<string> | null,
        message_id: string,
    ) {
        this.Date = date;
        this.Subject = subject;
        this.From = from;
        this.Sender = sender;
        this.ReplyTo = reply_to;
        this.To = to;
        this.Cc = cc;
        this.Bcc = bcc;
        this.InReplyTo = in_reply_to;
        this.MessageID = message_id;
    }
}

// @ts-ignore
@serializable
export class Email {
    envelope: Envelope | null = null;
    header: Map<string, Array<string>> = new Map<string, Array<string>>();
    body: string = "";
    attachments: Array<Attachment> = [];
    constructor(
        envelope: Envelope | null,
        header: Map<string, Array<string>>,
        body: string,
        attachments: Array<Attachment>,
    ) {
        this.envelope = envelope;
        this.header = header;
        this.body = body;
        this.attachments = attachments;
    }
}

// @ts-ignore
@serializable
export class SmtpBuildMailRequest {
    email: Email;
    constructor(email: Email) {
        this.email = email
    }
}

// @ts-ignore
@serializable
export class SmtpBuildMailResponse {
    error: string = "";
    data: Base64String = "";

    constructor(error: string,  data: Base64String) {
        this.error = error;
        this.data = data;
    }
}
