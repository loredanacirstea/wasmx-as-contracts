import { JSON } from "json-as";
import * as imapw from "wasmx-env-imap/assembly/imap_wrap";
import * as smtpw from "wasmx-env-smtp/assembly/smtp_wrap";
import * as config from "wasmx-dtype/assembly/config";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";
import { MsgCacheEmailRequest, MsgInitializeRequest, MsgListenEmailRequest, MsgRegisterProviderRequest, MsgSendEmailRequest, MsgConnectUserRequest, TableIds, MODULE_NAME, Provider, RelationTypeIds, MsgIncomingEmail, MsgExpunge, MsgMetadata, RegisterOauth2ConfigsRequest, EmailToWrite, EmailToRead } from "./types";
import { EmailTables, getEmailFields, getProviderFields, getThreadFields, TableProviderName } from "./defs";
import { ImapConnectionOauth2Request, ImapConnectionSimpleRequest, ImapFetchRequest, ImapListenRequest, SeqSetRange, UidSetRange } from "wasmx-env-imap/assembly/types";
import { getHttpServerSdk, LoggerDebug, LoggerDebugExtended, LoggerError, LoggerInfo, revert } from "./utils";
import { SmtpConnectionOauth2Request, SmtpConnectionSimpleRequest } from "wasmx-env-smtp/assembly/types";
import { saveEmail } from "./helpers";
import { getRelationTypes, getTableIds, setConfig, setRelationTypes, setTableIds } from "./storage";
import { registerOAuth2 } from "./http";
import { EndpointToWrite, OAuth2ConfigToWrite } from "wasmx-httpserver-registry/assembly/types_oauth2";
import { TableNameOauth2Endpoint, TableNameOauth2Providers } from "wasmx-httpserver-registry/assembly/defs_oauth2";

export function Initialize(req: MsgInitializeRequest): ArrayBuffer {
    setConfig(req.config)
    const dtype = getDtypeSdk();
    const ids = dtype.Insert(config.tableTableId, config.DTypeTableName, EmailTables)
    const tableIds = new TableIds(ids[0], ids[1], ids[2])
    setTableIds(tableIds)
    const fieldsProvider = getProviderFields(tableIds.provider)
    const fieldsThread = getThreadFields(tableIds.thread)
    const fieldsEmail = getEmailFields(tableIds.email)
    dtype.Insert(config.tableFieldsId, config.DTypeFieldName, fieldsProvider)
    dtype.Insert(config.tableFieldsId, config.DTypeFieldName, fieldsThread)
    dtype.Insert(config.tableFieldsId, config.DTypeFieldName, fieldsEmail)
    dtype.CreateTable(tableIds.provider)
    dtype.CreateTable(tableIds.thread)
    dtype.CreateTable(tableIds.email)

    if (req.providers.length > 0) {
        RegisterProviderInternal(req.providers)
        RegisterOAuth2EndpointInternal(req.endpoints)
        RegisterOauth2ConfigsInternal(req.outh2_configs)
    }

    // create relation type
    const reltypeObj =  `{"name":"contains","reverse_name":"containedIn","reversable":true}`
    const relIds = dtype.Insert(config.tableRelationTypeId, config.DTypeRelationTypeName, reltypeObj)
    setRelationTypes(new RelationTypeIds(relIds[0]))

    registerOAuth2(getHttpServerSdk(), dtype)

    return new ArrayBuffer(0)
}

export function RegisterProviders(req: MsgRegisterProviderRequest): ArrayBuffer {
    RegisterProviderInternal(req.providers)
    RegisterOAuth2EndpointInternal(req.endpoints)
    return new ArrayBuffer(0)
}

export function RegisterOauth2Configs(req: RegisterOauth2ConfigsRequest): ArrayBuffer {
    RegisterOauth2ConfigsInternal(req.outh2_configs)
    return new ArrayBuffer(0)
}

export function ConnectUser(req: MsgConnectUserRequest): ArrayBuffer {
    ConnectUserInternal(req.username, req.secret, req.secret_type)
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

export function ConnectUserInternal(username: string, secret: string, secret_type: string): void {
    const dtype = getDtypeSdk();
    const ids = getTableIds()
    const connId = getConnectionId(username)
    if (!username.includes("@")) revert("invalid username");

    const domain = username.split("@")[1]
    const values = dtype.ReadFields(ids.provider, TableProviderName, ["imap_server_url", "smtp_server_url_starttls"], `{"domain":"${domain}"}`)
    const imapUrl = values[0]
    const smtpUrl = values[1]
    if (imapUrl == "") {
        revert(`provider IMAP url not found for ${domain}`)
    }
    if (smtpUrl == "") {
        revert(`provider SMTP url not found for ${domain}`)
    }
    if (secret_type == "password") {
        const resp = imapw.ConnectWithPassword(new ImapConnectionSimpleRequest(connId, imapUrl, username, secret))
        if (resp.error != "") revert(resp.error);

        const resp2 = smtpw.ConnectWithPassword(new SmtpConnectionSimpleRequest(connId, smtpUrl, "", username, secret))
        if (resp2.error != "") revert(resp2.error);
    } else {
        const resp = imapw.ConnectOAuth2(new ImapConnectionOauth2Request(connId, imapUrl, username, secret));
        if (resp.error != "") revert(resp.error);

        const resp2 = smtpw.ConnectOAuth2(new SmtpConnectionOauth2Request(connId, smtpUrl, "", username, secret))
        if (resp2.error != "") revert(resp2.error);
    }
}

export function RegisterProviderInternal(providers: Provider[]): void {
    const dtype = getDtypeSdk();
    const ids = getTableIds()
    const data = JSON.stringify<Provider[]>(providers)
    dtype.Insert(ids.provider, TableProviderName, data)
}

export function RegisterOAuth2EndpointInternal(endpoints: EndpointToWrite[]): void {
    const dtype = getDtypeSdk();
    const data = JSON.stringify<EndpointToWrite[]>(endpoints)
    dtype.Insert(0, TableNameOauth2Endpoint, data)
}

export function RegisterOauth2ConfigsInternal(configs: OAuth2ConfigToWrite[]): void {
    const dtype = getDtypeSdk();
    const data = JSON.stringify<OAuth2ConfigToWrite[]>(configs)
    dtype.Insert(0, TableNameOauth2Providers, data)
}

export function CacheEmailInternal(
    username: string,
    email_folder: string,
    seq_range: SeqSetRange[] | null,
    uid_range: UidSetRange[] | null,
): EmailToRead[] {
    if (username == "") revert(`empty username`);
    const dtype = getDtypeSdk();
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
    const emails: EmailToRead[] = []
    for (let i = 0; i < resp.data.length; i++) {
        const respsave = saveEmail(dtype, ids, relationTypeIds, username, resp.data[i]);
        if (respsave.error != "") {
            // revert(respsave.error);
            continue;
        }
        emails.push(respsave.email!);
    }
    return emails;
}

function getConnectionId(username: string): string {
    return "conn_" + username
}

function getDtypeSdk(): DTypeSdk {
    return new DTypeSdk(MODULE_NAME, revert, LoggerInfo, LoggerError, LoggerDebug, LoggerDebugExtended);
}
