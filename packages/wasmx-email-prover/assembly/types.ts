import { JSON } from "json-as/assembly";
import { SeqSetRange, UidSetRange } from "wasmx-env-imap/assembly/types";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "email-prover"

// @ts-ignore
@serializable
export class TableIds {
    provider: i64 = 0
    thread: i64 = 0
    email: i64 = 0
    constructor(provider: i64, thread: i64, email: i64) {
        this.provider = provider
        this.thread = thread;
        this.email = email;
    }
}

// @ts-ignore
@serializable
export class RelationTypeIds {
    contains: i64 = 0
    constructor(contains: i64) {
        this.contains = contains
    }
}

// @ts-ignore
@serializable
export class MsgInitializeRequest {
    providers: Provider[] = []
    constructor(providers: Provider[]) {
        this.providers = providers;
    }
}

// @ts-ignore
@serializable
export class MsgInitializeResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MsgRegisterProviderRequest {
    provider: Provider;
    constructor(provider: Provider) {
        this.provider = provider
    }
}

// @ts-ignore
@serializable
export class MsgRegisterProviderResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MsgConnectUserRequest {
    username: string = ""
    secret: string = ""
    secret_type: string = "oauth2" // password | oauth2
    constructor(username: string, secret: string, secret_type: string) {
        this.username = username
        this.secret = secret
        this.secret_type = secret_type
    }
}

// @ts-ignore
@serializable
export class MsgConnectUserResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MsgCacheEmailRequest {
    user_id: i64 = 0
    username: string = ""
    email_folder: string = ""
    uid_range: UidSetRange[] = []
    seq_range: SeqSetRange[] = []
    constructor(user_id: i64, username: string, email_folder: string, uid_range: UidSetRange[], seq_range: SeqSetRange[]) {
        this.user_id = user_id
        this.username = username
        this.email_folder = email_folder
        this.uid_range = uid_range
        this.seq_range = seq_range
    }
}

// @ts-ignore
@serializable
export class MsgCacheEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MsgListenEmailRequest {
    user_id: i64 = 0
    username: string = ""
    email_folder: string = ""
    constructor(user_id: i64, username: string, email_folder: string) {
        this.user_id = user_id
        this.username = username
        this.email_folder = email_folder
    }
}

// @ts-ignore
@serializable
export class MsgListenEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MsgSendEmailRequest {
    user_id: i64 = 0
    username: string = ""
    subject: string = ""
    body: string = ""
    to: string[] = []
    cc: string[] = []
    bcc: string[] = []
    constructor(
        user_id: i64,
        username: string,
        subject: string,
        body: string,
        to: string[],
        cc: string[],
        bcc: string[],
    ) {
        this.user_id = user_id
        this.username = username
        this.subject = subject
        this.body = body
        this.to = to
        this.cc = cc
        this.bcc = bcc
    }
}

// @ts-ignore
@serializable
export class MsgSendEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class Provider {
    name: string = "";
    domain: string = "";
    imap_server_url: string = "";
    smtp_server_url_starttls: string = "";
    smtp_server_url_tls: string = "";
    constructor(name: string, domain: string, imap_server_url: string, smtp_server_url_starttls: string, smtp_server_url_tls: string) {
        this.name = name
        this.domain = domain
        this.imap_server_url = imap_server_url;
        this.smtp_server_url_starttls = smtp_server_url_starttls;
        this.smtp_server_url_tls = smtp_server_url_tls;
    }
}

// @ts-ignore
@serializable
export class EmailToWrite {
    uid: i64 = 0
    owner: string = ""
    raw: Base64String = ""
    bh: Base64String = ""
    body: Base64String = ""
    timestamp: i64 = 0
    envelope: Base64String = ""
    envelope_Subject: string = ""
    envelope_MessageID: string = ""
    header: Base64String = ""
    header_References: string = ""
    flags: string = ""
    name: string = ""
    constructor(
        uid: i64,
        owner: string,
        raw: Base64String,
        bh: Base64String,
        body: Base64String,
        timestamp: i64,
        envelope: Base64String,
        envelope_Subject: string,
        envelope_MessageID: string,
        header: Base64String,
        header_References: string,
        flags: string,
        name: string,
    ) {
        this.uid = uid
        this.owner = owner
        this.raw = raw
        this.bh = bh
        this.body = body
        this.timestamp = timestamp
        this.envelope = envelope
        this.envelope_Subject = envelope_Subject
        this.envelope_MessageID = envelope_MessageID
        this.header = header
        this.header_References = header_References
        this.flags = flags
        this.name = name
    }
}

// @ts-ignore
@serializable
export class ThreadToWrite {
    name: string = ""
    last_email_message_id: string = ""
    owner_account: string = ""
    email_message_ids: string = ""
    missing_refs: string = ""
    constructor(
        name: string,
        last_email_message_id: string,
        owner_account: string,
        email_message_ids: string,
        missing_refs: string,
    ) {
        this.name = name
        this.last_email_message_id = last_email_message_id
        this.owner_account = owner_account
        this.email_message_ids = email_message_ids
        this.missing_refs = missing_refs
    }
}

// @ts-ignore
@serializable
export class ResponseStringWithError {
    constructor(
        public error: string,
        public data: string,
    ) {}
}

// @ts-ignore
@serializable
export class LastKnownReferenceResult {
    constructor(
        public id: i64,
        public missingRefs: Array<string>,
    ) {}
}
