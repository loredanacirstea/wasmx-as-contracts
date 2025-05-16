import { JSON } from "json-as";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as imapw from "wasmx-env-imap/assembly/imap_wrap";
import * as smtpw from "wasmx-env-smtp/assembly/smtp_wrap";
import * as config from "wasmx-dtype/assembly/config";
import { MsgCacheEmailRequest, MsgInitializeRequest, MsgListenEmailRequest, MsgRegisterProviderRequest, MsgSendEmailRequest, MsgConnectUserRequest, TableIds, MODULE_NAME, Provider, RelationTypeIds, MsgIncomingEmail, MsgExpunge, MsgMetadata } from "./types";
import { createTable, getDTypeFieldValue, insertDTypeValues } from "./dtype";
import { EmailTables, getEmailFields, getProviderFields, getThreadFields, TableProviderName } from "./defs";
import { ImapConnectionOauth2Request, ImapConnectionSimpleRequest, ImapFetchRequest, ImapListenRequest, SeqSetRange, UidSetRange } from "wasmx-env-imap/assembly/types";
import { revert } from "./utils";
import { SmtpConnectionOauth2Request, SmtpConnectionSimpleRequest } from "wasmx-env-smtp/assembly/types";
import { saveEmail } from "./helpers";

export function Initialize(req: MsgInitializeRequest): ArrayBuffer {
    const ids = insertDTypeValues(config.tableTableId, config.DTypeTableName, EmailTables)
    const tableIds = new TableIds(ids[0], ids[1], ids[2])
    setTableIds(tableIds)
    const fieldsProvider = getProviderFields(tableIds.provider)
    const fieldsThread = getThreadFields(tableIds.thread)
    const fieldsEmail = getEmailFields(tableIds.email)
    insertDTypeValues(config.tableFieldsId, config.DTypeFieldName, fieldsProvider)
    insertDTypeValues(config.tableFieldsId, config.DTypeFieldName, fieldsThread)
    insertDTypeValues(config.tableFieldsId, config.DTypeFieldName, fieldsEmail)
    createTable(tableIds.provider)
    createTable(tableIds.thread)
    createTable(tableIds.email)

    if (req.providers.length > 0) {
        RegisterProviderInternal(req.providers)
    }

    // create relation type
    const reltypeObj =  `{"name":"contains","reverse_name":"containedIn","reversable":true}`
    const relIds = insertDTypeValues(config.tableRelationTypeId, config.DTypeRelationTypeName, reltypeObj)
    setRelationTypes(new RelationTypeIds(relIds[0]))

    return new ArrayBuffer(0)
}

export function RegisterProvider(req: MsgRegisterProviderRequest): ArrayBuffer {
    RegisterProviderInternal([req.provider])
    return new ArrayBuffer(0)
}

export function ConnectUser(req: MsgConnectUserRequest): ArrayBuffer {
    const ids = getTableIds()
    const connId = getConnectionId(req.username)
    if (!req.username.includes("@")) revert("invalid username");

    const domain = req.username.split("@")[1]
    const imapUrl = getDTypeFieldValue(ids.provider, TableProviderName, "imap_server_url", `{"domain":"${domain}"}`)
    const smtpUrl = getDTypeFieldValue(ids.provider, TableProviderName, "smtp_server_url_starttls", `{"domain":"${domain}"}`)
    if (req.secret_type == "password") {
        const resp = imapw.ConnectWithPassword(new ImapConnectionSimpleRequest(connId, imapUrl, req.username, req.secret))
        if (resp.error != "") revert(resp.error);

        const resp2 = smtpw.ConnectWithPassword(new SmtpConnectionSimpleRequest(connId, smtpUrl, "", req.username, req.secret))
        if (resp2.error != "") revert(resp2.error);
    } else {
        const resp = imapw.ConnectOAuth2(new ImapConnectionOauth2Request(connId, imapUrl, req.username, req.secret));
        if (resp.error != "") revert(resp.error);

        const resp2 = smtpw.ConnectOAuth2(new SmtpConnectionOauth2Request(connId, smtpUrl, "", req.username, req.secret))
        if (resp2.error != "") revert(resp2.error);
    }
    return new ArrayBuffer(0)
}

export function CacheEmail(req: MsgCacheEmailRequest): ArrayBuffer {
    CacheEmailInternal(req.username, req.email_folder, req.seq_range, req.uid_range)
    return new ArrayBuffer(0)
}

export function ListenEmail(req: MsgListenEmailRequest): ArrayBuffer {
    const connId = getConnectionId(req.username)
    const resp = imapw.Listen(new ImapListenRequest(connId, req.email_folder))
    if (resp.error != "") {
        revert(`cannot listen on IMAP: ${resp.error}`)
    }
    return new ArrayBuffer(0)
}

export function SendEmail(req: MsgSendEmailRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function IncomingEmail(req: MsgIncomingEmail): void {
    console.log("-email_prover.IncomingEmail-" + JSON.stringify<MsgIncomingEmail>(req))
}

export function Expunge(req: MsgExpunge): void {
    console.log("-email_prover.Expunge-" + JSON.stringify<MsgExpunge>(req))
}

export function Metadata(req: MsgMetadata): void {
    console.log("-email_prover.Metadata-" + JSON.stringify<MsgMetadata>(req))
}

export function RegisterProviderInternal(providers: Provider[]): void {
    const ids = getTableIds()
    for (let i = 0 ; i < providers.length; i++) {
        const data = JSON.stringify<Provider>(providers[i])
        insertDTypeValues(ids.provider, TableProviderName, data)
    }
}

export function CacheEmailInternal(
    username: string,
    email_folder: string,
    seq_range: SeqSetRange[] | null,
    uid_range: UidSetRange[] | null,
): void {
    if (username == "") revert(`empty username`);
    const ids = getTableIds()
    const relationTypeIds = getRelationTypes();
    const connId = getConnectionId(username)
    const fetchReq = new ImapFetchRequest(
        connId,
        email_folder,
        seq_range,
        uid_range,
        null, null, null, false,
    )
    const resp = imapw.Fetch(fetchReq, MODULE_NAME)
    if (resp.error != "") {
        revert(`Fetch failed for email: ${resp.error}`)
    }
    if (resp.data.length == 0) {
        revert(`Fetch email response empty`)
    }
    for (let i = 0; i < resp.data.length; i++) {
        saveEmail(ids, relationTypeIds, username, resp.data[i]);
    }
}

function getConnectionId(username: string): string {
    return "conn_" + username
}

function setTableIds(ids: TableIds): void {
    wasmxw.sstore("tableids", JSON.stringify<TableIds>(ids))
}

function getTableIds(): TableIds {
    return JSON.parse<TableIds>(wasmxw.sload("tableids"))
}

function setRelationTypes(ids: RelationTypeIds): void {
    wasmxw.sstore("relationtypeids", JSON.stringify<RelationTypeIds>(ids))
}

function getRelationTypes(): RelationTypeIds {
    return JSON.parse<RelationTypeIds>(wasmxw.sload("relationtypeids"))
}
