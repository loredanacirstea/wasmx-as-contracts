import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-imap"

// Placeholder IMAP types
@json
export class SearchCriteria {
    // define search logic here
}

@json
export class FetchOptions {
    // flags, headers, etc.
}

@json
export class FetchItemBodySection {
    section: string = "";
}

type MailboxAttr = string

@json
export class CreateOptions {
    // IMAP create options
    SpecialUse: MailboxAttr[] = []
    constructor(SpecialUse: MailboxAttr[]) {
        this.SpecialUse = SpecialUse
    }
}

@json
export class ImapConnectionSimpleRequest {
    id: string = "";
    imap_server_url: string = "";
    username: string = "";
    password: string = "";

    constructor(id: string, imap_server_url: string, username: string, password: string) {
        this.id = id;
        this.imap_server_url = imap_server_url;
        this.username = username;
        this.password = password;
    }
}

@json
export class ImapConnectionOauth2Request {
    id: string = "";
    imap_server_url: string = "";
    username: string = "";
    access_token: string = "";

    constructor(id: string, imap_server_url: string, username: string, access_token: string) {
        this.id = id;
        this.imap_server_url = imap_server_url;
        this.username = username;
        this.access_token = access_token;
    }
}

@json
export class ImapConnectionResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class ImapCloseRequest {
    id: string = "";

    constructor(id: string) {
        this.id = id;
    }
}

@json
export class ImapCloseResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class ImapListenRequest {
    id: string = "";
    folder: string = "";

    constructor(id: string, folder: string) {
        this.id = id;
        this.folder = folder;
    }
}

@json
export class ImapListenResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class ImapCountRequest {
    id: string = "";
    folder: string = "";
    constructor(id: string, folder: string) {
        this.id = id;
        this.folder = folder;
    }
}

@json
export class ImapCountResponse {
    error: string = "";
    count: i64 = 0
    constructor(error: string, count: i64) {
        this.error = error;
        this.count = count;
    }
}

@json
export class FetchFilter {
    limit: u32 = 0;
    start: u32 = 0;
    search: SearchCriteria | null = null;
    from: string = "";
    to: string = "";
    subject: string = "";
    content: string = "";

    constructor(
        limit: u32,
        start: u32,
        search: SearchCriteria | null,
        from: string,
        to: string,
        subject: string,
        content: string
    ) {
        this.limit = limit;
        this.start = start;
        this.search = search;
        this.from = from;
        this.to = to;
        this.subject = subject;
        this.content = content;
    }
}

@json
export class SeqSetRange {
    Start: u32 = 0;
    Stop: u32 = 0;
    constructor(start: u32, stop: u32) {
        this.Start = start
        this.Stop = stop
    }
}

@json
export class UidSetRange {
    Start: u32 = 0;
    Stop: u32 = 0;
    constructor(start: u32, stop: u32) {
        this.Start = start
        this.Stop = stop
    }
}

@json
export class ImapFetchRequest {
    id: string = "";
    folder: string = "";
    seq_set: SeqSetRange[] | null = null
    uid_set: UidSetRange[] | null = null
    fetch_filter: FetchFilter | null = null;
    options: FetchOptions | null = null;
    bodySection: FetchItemBodySection  | null = null;
    reverse: bool = false;

    constructor(
        id: string,
        folder: string,
        seq_set: SeqSetRange[] | null,
        uid_set: UidSetRange[] | null,
        fetch_filter: FetchFilter | null,
        options: FetchOptions | null,
        bodySection: FetchItemBodySection | null,
        reverse: bool
    ) {
        this.id = id;
        this.folder = folder;
        this.seq_set = seq_set;
        this.uid_set = uid_set;
        this.fetch_filter = fetch_filter;
        this.options = options;
        this.bodySection = bodySection;
        this.reverse = reverse;
    }
}

@json
export class ImapFetchResponse {
    error: string = "";
    data: Array<Email> = [];
    count: i64 = 0;

    constructor(error: string, data: Array<Email>, count: i64) {
        this.error = error;
        this.data = data;
        this.count = count;
    }
}

@json
export class ImapCreateFolderRequest {
    id: string = "";
    path: string = "";
    options: CreateOptions | null = null

    constructor(id: string, path: string, options: CreateOptions | null) {
        this.id = id;
        this.path = path;
        this.options = options;
    }
}

@json
export class ImapCreateFolderResponse {
    error: string = "";

    constructor(error: string) {
        this.error = error;
    }
}

@json
export class UserInfo {
    email: string = "";
    name: string = "";
    sub: string = "";
    given_name: string = "";
    family_name: string = "";
    picture: string = "";
    email_verified: bool = false;

    constructor(
        email: string,
        name: string,
        sub: string,
        given_name: string,
        family_name: string,
        picture: string,
        email_verified: bool
    ) {
        this.email = email;
        this.name = name;
        this.sub = sub;
        this.given_name = given_name;
        this.family_name = family_name;
        this.picture = picture;
        this.email_verified = email_verified;
    }
}

@json
export class Attachment {
    filename: string = "";
    content_type: string = "";
    data: Base64String = "";

    constructor(filename: string, content_type: string, data: Base64String) {
        this.filename = filename;
        this.content_type = content_type;
        this.data = data;
    }

    static empty(): Attachment {
        return new Attachment("", "", "");
    }
}

export type Flag = string;

@json
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
        this.Mailbox = mailbox
        this.Host = host
    }

    static empty(): Address {
        return new Address("", "", "");
    }

    static fromString(account: string, name: string): Address {
        const parts = account.split("@")
        return new Address(name, parts[0], parts[1])
    }

    toString(): string {
        if (this.Name.length > 0) {
            return `${this.Name} <${this.Mailbox}@${this.Host}>`;
        }
        return `${this.Mailbox}@${this.Host}`;
    }
}

@json
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

    static empty(): Envelope {
        return new Envelope(new Date(0), "", [], [], [], [], null, null, null, "");
    }
}

@json
export class Email {
    uid: u32 = 0;
    flags: Array<Flag> = [];
    internalDate: Date = new Date(0);
    rfc822Size: i64 = 0;
    envelope: Envelope | null = null;
    header: Map<string, Array<string>> = new Map<string, Array<string>>();
    body: string = "";
    attachments: Array<Attachment> = [];
    raw: string = "";
    bh: string = "";

    constructor(
        uid: u32,
        flags: Array<Flag>,
        internalDate: Date,
        rfc822Size: i64,
        envelope: Envelope | null,
        header: Map<string, Array<string>>,
        body: string,
        attachments: Array<Attachment>,
        raw: string,
        bh: string,
    ) {
        this.uid = uid;
        this.flags = flags;
        this.internalDate = internalDate;
        this.rfc822Size = rfc822Size;
        this.envelope = envelope;
        this.header = header;
        this.body = body;
        this.attachments = attachments;
        this.raw = raw;
        this.bh = bh;
    }

    static empty(): Email {
        return new Email(0, [], new Date(0), 0, Envelope.empty(), new Map<string, Array<string>>(), "", [], "", "");
    }
}

@json
export class EmailPartial {
    id: string = "";
    title: string = "";

    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }
}
