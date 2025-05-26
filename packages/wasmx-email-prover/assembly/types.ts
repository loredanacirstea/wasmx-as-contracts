import { JSON } from "json-as";
import { Email, Envelope, SeqSetRange, UidSetRange } from "wasmx-env-imap/assembly/types";
import { Base64String } from "wasmx-env/assembly/types";
import { EndpointToWrite, OAuth2ConfigToWrite } from "wasmx-httpserver-registry/assembly/types_oauth2";
import { HttpResponseWrap } from "wasmx-env-httpserver/assembly/types";
import { SessionToWrite } from "wasmx-httpserver-registry/assembly/types_oauth2";
import { base64ToString } from "wasmx-utils/assembly/utils";

export const MODULE_NAME = "email-prover"

@json
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

@json
export class RelationTypeIds {
    contains: i64 = 0
    constructor(contains: i64) {
        this.contains = contains
    }
}

@json
export class Config {
    session_expiration_ms: i64 = 0
    jwt_secret: Base64String = ""
    constructor(session_expiration_ms: i64, jwt_secret: Base64String) {
        this.session_expiration_ms = session_expiration_ms
        this.jwt_secret = jwt_secret
    }
}

@json
export class MsgInitializeRequest {
    config: Config = new Config(0, "")
    providers: Provider[] = []
    endpoints: EndpointToWrite[] = [];
    outh2_configs: OAuth2ConfigToWrite[] = []
    constructor(config: Config, providers: Provider[], endpoints: EndpointToWrite[], outh2_configs: OAuth2ConfigToWrite[]) {
        this.config = config
        this.providers = providers;
        this.endpoints = endpoints
        this.outh2_configs = outh2_configs
    }
}

@json
export class MsgInitializeResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

@json
export class RegisterOauth2ConfigsRequest {
    outh2_configs: OAuth2ConfigToWrite[] = []
    constructor(outh2_configs: OAuth2ConfigToWrite[]) {
        this.outh2_configs = outh2_configs
    }
}

@json
export class MsgRegisterProviderRequest {
    providers: Provider[] = [];
    endpoints: EndpointToWrite[] = [];
    constructor(providers: Provider[], endpoints: EndpointToWrite[]) {
        this.providers = providers
        this.endpoints = endpoints
    }
}

@json
export class MsgRegisterProviderResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

export type SecretType = string
export const SecretType_Password = "password"
export const SecretType_OAuth2 = "oauth2"

@json
export class MsgConnectUserRequest {
    username: string = ""
    secret: string = ""
    secret_type: SecretType = SecretType_OAuth2
    constructor(username: string, secret: string, secret_type: SecretType) {
        this.username = username
        this.secret = secret
        this.secret_type = secret_type
    }
}

@json
export class MsgConnectUserResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

@json
export class MsgCacheEmailRequest {
    user_id: i64 = 0
    username: string = ""
    email_folder: string = ""
    uid_range: UidSetRange[] | null = null
    seq_range: SeqSetRange[] | null = null
    constructor(user_id: i64, username: string, email_folder: string, uid_range: UidSetRange[] | null, seq_range: SeqSetRange[] | null) {
        this.user_id = user_id
        this.username = username
        this.email_folder = email_folder
        this.uid_range = uid_range
        this.seq_range = seq_range
    }
}

@json
export class MsgCacheEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

@json
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

@json
export class MsgListenEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

@json
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

@json
export class MsgSendEmailResponse {
    error: string = ""
    constructor(error: string) {
        this.error = error;
    }
}

@json
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

@json
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
    rfc822_size: i64 = 0
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
        rfc822_size: i64,
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
        this.rfc822_size = rfc822_size
    }
}

@json
export class EmailToRead extends EmailToWrite {
    id: i64 = 0
    constructor(
        id: i64,
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
        rfc822_size: i64,
    ) {
        super(
            uid,
            owner,
            raw,
            bh,
            body,
            timestamp,
            envelope,
            envelope_Subject,
            envelope_MessageID,
            header,
            header_References,
            flags,
            name,
            rfc822_size,
        )
        this.id = id
    }

    static fromWrite(id: i64, data: EmailToWrite): EmailToRead {
        return new EmailToRead(
            id,
            data.uid,
            data.owner,
            data.raw,
            data.bh,
            data.body,
            data.timestamp,
            data.envelope,
            data.envelope_Subject,
            data.envelope_MessageID,
            data.header,
            data.header_References,
            data.flags,
            data.name,
            data.rfc822_size,
        )
    }

    toEmail(): Email {
        return new Email(
            u32(this.uid),
            JSON.parse<string[]>(this.flags),
            new Date(this.timestamp),
            this.rfc822_size,
            JSON.parse<Envelope>(this.envelope),
            JSON.parse<Map<string, string[]>>(this.header),
            this.body,
            [], // TODO attachments
            base64ToString(this.raw),
            this.bh,
        )
    }
}

@json
export class ThreadToWrite {
    name: string = ""
    last_email_message_id: i64 = 0
    owner: string = ""
    email_message_ids: string = ""
    missing_refs: string = ""
    constructor(
        name: string,
        last_email_message_id: i64,
        owner: string,
        email_message_ids: string,
        missing_refs: string,
    ) {
        this.name = name
        this.last_email_message_id = last_email_message_id
        this.owner = owner
        this.email_message_ids = email_message_ids
        this.missing_refs = missing_refs
    }
}

@json
export class ThreadToRead {
    id: i64 = 0
    name: string = ""
    last_email_message_id: i64 = 0
    owner: string = ""
    email_message_ids: string = ""
    missing_refs: string = ""
    constructor(
        id: i64,
        name: string,
        last_email_message_id: i64,
        owner: string,
        email_message_ids: string,
        missing_refs: string,
    ) {
        this.id = id
        this.name = name
        this.last_email_message_id = last_email_message_id
        this.owner = owner
        this.email_message_ids = email_message_ids
        this.missing_refs = missing_refs
    }
}

@json
export class ThreadWithEmails extends ThreadToRead {
    id: i64 = 0
    name: string = ""
    last_email_message_id: i64 = 0
    owner: string = ""
    email_message_ids: string = ""
    missing_refs: string = ""
    children: Email[] = []
    constructor(
        id: i64,
        name: string,
        last_email_message_id: i64,
        owner: string,
        email_message_ids: string,
        missing_refs: string,
        children: Email[],
    ) {
        super(id, name, last_email_message_id, owner, email_message_ids, missing_refs)
        this.children = children
    }
}

@json
export class MissingRefsWrap {
    missing_refs: string = ""
    email_message_ids: string = ""
    constructor(
        missing_refs: string,
        email_message_ids: string
    ) {
        this.missing_refs = missing_refs
        this.email_message_ids = email_message_ids
    }
}

@json
export class UpdateThreadAddEmail {
    last_email_message_id: i64 = 0
    email_message_ids: string = ""
    constructor(
        last_email_message_id: i64,
        email_message_ids: string
    ) {
        this.last_email_message_id = last_email_message_id
        this.email_message_ids = email_message_ids
    }
}

@json
export class LastKnownReferenceResult {
    constructor(
        public id: i64,
        public missingRefs: Array<string>,
    ) {}
}

@json
export class MsgIncomingEmail {
    folder: string = ""
    owner: string = ""
    uid: u32 = 0
    seq_num: u32 = 0
    constructor(
        folder: string,
        owner: string,
        uid: u32,
        seq_num: u32,
    ) {
        this.folder = folder
        this.owner = owner
        this.uid = uid
        this.seq_num = seq_num
    }
}

@json
export class MsgExpunge {
    folder: string = ""
    owner: string = ""
    seq_num: u32 = 0
    constructor(
        folder: string,
        owner: string,
        seq_num: u32,
    ) {
        this.folder = folder
        this.owner = owner
        this.seq_num = seq_num
    }
}

@json
export class MsgMetadata {
    folder: string = ""
    owner: string = ""
    entries: string[] = []
    constructor(
        folder: string,
        owner: string,
        entries: string[],
    ) {
        this.folder = folder
        this.owner = owner
        this.entries = entries
    }
}

@json
export class SaveEmailResponse {
    email: EmailToRead | null
    error: string
    constructor(email: EmailToRead | null, error: string) {
        this.email = email
        this.error = error
    }
}

@json
export class HandleOAuth2CallbackResponse {
    error: HttpResponseWrap | null = null
    session: SessionToWrite | null = null
    constructor(error: HttpResponseWrap | null, session: SessionToWrite | null) {
        this.error = error
        this.session = session
    }
}

@json
export class ExtendedResponse {
    data: JSON.Raw | null = null
    menu: string = ""
    template: string = ""
    constructor(data: JSON.Raw | null = null, menu: string = "", template: string = "") {
        this.data = data
        this.menu = menu
        this.template = template
    }
}
