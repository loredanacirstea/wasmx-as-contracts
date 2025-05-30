import { JSON } from "json-as";
import { Address, Email, Envelope } from "wasmx-env-imap/assembly/types";
import { EmailToRead, EmailToWrite, LastKnownReferenceResult, MissingRefsWrap, MsgSendEmailRequest, RelationTypeIds, SaveEmailResponse, TableIds, ThreadToRead, ThreadToWrite, ThreadWithEmails, UpdateThreadAddEmail } from "./types";
import { LoggerDebug, LoggerDebugExtended, revert } from "./utils";
import { TableEmailName, TableThreadName } from "./defs";
import { parseInt64, stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeNodeName, DTypeRelationName, tableNodeId, tableRelationId } from "wasmx-dtype/assembly/config";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";

export function getConnectionId(username: string): string {
    return "conn_" + username
}

// TODO store attachments
export function saveEmail(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, owner: string, folder: string, email: Email): SaveEmailResponse {
    const resp = new SaveEmailResponse(null, "");
    const envelope = email.envelope
    if (envelope == null) {
        resp.error = "failed to convert email, empty envelope";
        return resp;
    }

    let dbemail = EmailRecordfromEmail(email, owner, folder);
    if (dbemail == null)  {
        resp.error = "failed to convert email";
        return resp;
    }

    LoggerDebugExtended("save email", ["owner", owner, "summary", dbemail.name])

    const _ids = saveEmailWithNode(dtype, ids.email, dbemail);
    const emailId = _ids[0]
    const nodeIdEmail = _ids[1]
    let nodeIdThread: i64;

    resp.email = EmailToRead.fromWrite(emailId, dbemail);

    let refs: Array<string> = JSON.parse<Array<string>>(dbemail.header_References);
    let inReplyTo = envelope.InReplyTo;
    let inReplyTo2 = email.header.has("In-Reply-To") ? email.header.get("In-Reply-To") : new Array<string>();
    if (inReplyTo == null || inReplyTo.length == 0) inReplyTo = inReplyTo2;


    // every email is part of a thread
	// a thread can have >=1 emails
    if (refs.length == 0) {
        let dbthread = new ThreadToWrite(
            dbemail.name,
            emailId,
            owner,
            JSON.stringify<string[]>([envelope.MessageID]),
            `[]`,
            folder,
        );

        const _ids = saveThreadWithNode(dtype, ids.thread, dbthread);
        const threadId = _ids[0]
        nodeIdThread = _ids[1]

        saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
        return resp;
    }

    // TODO subject changed => create new thread ? - remains the same thread for now

    // if email has > 2 references
	// look at previous email for thread id
	// if previous email not found, we look until we find one
	// update thread with current email id
    if (inReplyTo.length == 1 && refs.length >= 1) {
        let result = getLastKnownReference(dtype, ids, owner, refs);
        let lastThread: ThreadToRead | null = null;

        if (result.id > 0) {
            let prevEmailId = result.id;
            let missingRefs = result.missingRefs;

            const threadIds = getEmailThreadIds(dtype, ids, reltypeIds, prevEmailId);
            if (threadIds.length == 0) {
                revert(`missing thread for email id: ${prevEmailId}`)
            } else {
                // here we just get the last thread and add the email to it.
                const lastThreadId = threadIds[threadIds.length - 1];

                const threadStr = dtype.Read(ids.thread, TableThreadName, `{"id":${lastThreadId}},"owner":"${owner}"`)
                const threads = JSON.parse<ThreadToRead[]>(threadStr);
                if (threads.length == 0) {
                    revert(`missing thread for thread id: ${lastThreadId}`)
                }
                lastThread = threads[0]

                const messageIds = JSON.parse<string[]>(lastThread.email_message_ids)

                if (lastThread.last_email_message_id == prevEmailId) {
                    messageIds.push(dbemail.envelope_MessageID)
                    const messageIdsStr = JSON.stringify<string[]>(messageIds)
                    const q = JSON.stringify<UpdateThreadAddEmail>(new UpdateThreadAddEmail(emailId, messageIdsStr))
                    // we expand the thread with current email
                    dtype.Update(ids.thread, TableThreadName, q, `{"id":${lastThreadId}},"owner":"${owner}"`)
                    addEmailThreadRelation(dtype, ids, reltypeIds, lastThreadId, nodeIdEmail)
                    return resp;
                }
            }
        }

		// if we introduce emails in reverse order
		// search if the messageId is part of missing_refs in an existing thread
        if (lastThread == null) {
            lastThread = getThreadByMissingMessageId(dtype, ids, dbemail.owner, dbemail.envelope_MessageID);
        }
        if (lastThread != null) {
            addEmailThreadRelation(dtype, ids, reltypeIds, lastThread.id, nodeIdEmail)
            let missingRefs = JSON.parse<Array<string>>(lastThread.missing_refs);
            let messageIds = JSON.parse<Array<string>>(lastThread.email_message_ids);
            let filtered = new Array<string>();
            for (let i = 0; i < missingRefs.length; i++) {
                if (missingRefs[i] != dbemail.envelope_MessageID) {
                    filtered.push(missingRefs[i]);
                }
            }
            missingRefs = filtered;
            messageIds.push(dbemail.envelope_MessageID);

            dtype.Update(ids.thread, TableThreadName, JSON.stringify<MissingRefsWrap>(new MissingRefsWrap(JSON.stringify<string[]>(messageIds), JSON.stringify<string[]>(missingRefs))), `{"id":${lastThread.id}}`)
            return resp;
        }

        // Fallback: create new thread with missing refs
        let dbthread = new ThreadToWrite(
            dbemail.name,
            emailId,
            owner,
            JSON.stringify<string[]>([envelope.MessageID]),
            JSON.stringify(refs),
            folder,
        );

        const _ids = saveThreadWithNode(dtype, ids.thread, dbthread);
        const threadId = _ids[0]
        nodeIdThread = _ids[1]

        saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
    }
    return resp;
}

export function addEmailThreadRelation(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, threadId: i64, nodeIdEmail: i64): void {
    const values = dtype.ReadFields(tableNodeId, DTypeNodeName, ["id"], `{"table_id":${ids.thread}},"record_id":${threadId}`)
    const nodeIdThread = parseInt64(values[0])
    saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
}

export function getThreadByMissingMessageId(dtype: DTypeSdk, ids: TableIds, owner: string, messageId: string): ThreadToRead | null {
    // const values = getDTypeValues(ids.thread, TableThreadName, `{"owner":"${owner}"}`)

    const query = `SELECT * FROM ${TableThreadName}
WHERE owner = ?
    AND EXISTS (
    SELECT 1
    FROM json_each(${TableThreadName}.missing_refs)
    WHERE json_each.value = ?
)
    `;

    const params = [
        `{"type":"VARCHAR","value":"${owner}"}`,
        `{"type":"VARCHAR","value":"${messageId}"}`
    ]
    const result = dtype.ReadRaw(ids.thread, TableThreadName, query, params)
    const threads = JSON.parse<ThreadToRead[]>(result)
    if (threads.length == 0) {
        LoggerDebugExtended("get db thread: not found", ["query", query, "params", params.join(",")])
        console.log("get db thread: not found: " + query + "--" + params.join(","));
        return null;
    }
    return threads[0];
}

export function getEmailThreadIds(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, emailId: i64): i64[] {
    const threads = dtype.GetRecordsByRelationType(reltypeIds.contains, "", ids.email, emailId, "target")
    const threadIds: i64[] = []
    for (let i = 0; i < threads.length; i ++) {
        const id = threads[i].get("source_record_id")
        if (id == null) {
            revert(`result does not contain source_record_id`)
            return [];
        }
        threadIds.push(parseInt64(id.toString()))
    }
    return threadIds;
}

export function getThreadEmailsInternal(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, threadId: i64, fields: string[] = []): string {
    return dtype.GetFullRecordsByRelationType(reltypeIds.contains, "", ids.thread, threadId, fields, "source")
}

export function getThreadEmails(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, threadId: i64): Email[] {
    const response = dtype.GetFullRecordsByRelationType(reltypeIds.contains, "", ids.thread, threadId, [], "source")
    const emailsRead = JSON.parse<EmailToRead[]>(response)
    const emails: Email[] = [];
    for (let i = 0; i < emailsRead.length; i ++) {
        emails.push(emailsRead[i].toEmail())
    }
    return emails;
}

export function getLastKnownReference(
    dtype: DTypeSdk,
    ids: TableIds,
    ownerAccount: string,
    refs: Array<string>
): LastKnownReferenceResult {
    refs.reverse();
    let missingRefs = new Array<string>();

    for (let i = 0; i < refs.length; i++) {
        let messageId = refs[i];
        const resp = dtype.ReadFieldsNoCheck(ids.email, TableEmailName, ["id"], `{"envelope_MessageID":"${messageId}","owner":"${ownerAccount}"}`)
        if (resp.error == "" && resp.data.length > 0) {
            const id = parseInt64(resp.data[0])
            return new LastKnownReferenceResult(id, missingRefs)
        }
        missingRefs.push(messageId);
    }
    return new LastKnownReferenceResult(0, missingRefs);
}

export function saveThreadRelation(dtype: DTypeSdk, nodeIdThread: i64, nodeIdEmail: i64, relationTypeId: i64): i64 {
    const relObj = `{"relation_type_id":${relationTypeId},"source_node_id":${nodeIdThread},"target_node_id":${nodeIdEmail},"order_index":0}`
    const relIds = dtype.Insert(tableRelationId, DTypeRelationName, relObj)
    if (relIds.length == 0) revert("failed to save email node");
    return relIds[0]
}

export function saveThreadWithNode(dtype: DTypeSdk, threadTableId: i64, dbthread: ThreadToWrite): i64[] {
    LoggerDebugExtended("save thread", ["summary", dbthread.name])
    const threadIds = dtype.Insert(threadTableId, TableThreadName, JSON.stringify<ThreadToWrite>(dbthread))
    if (threadIds.length == 0) revert("failed to save thread");
    const threadId = threadIds[0]

    // node
    const nodeObj = `{"table_id":${threadTableId},"record_id":${threadId},"name":"${dbthread.name}"}`
    const nodeIds = dtype.Insert(tableNodeId, DTypeNodeName, nodeObj)
    if (nodeIds.length == 0) revert("failed to save email node");
    const nodeId = nodeIds[0]

    return [threadId, nodeId]
}

export function saveEmailWithNode(dtype: DTypeSdk, emailTableId: i64, dbemail: EmailToWrite): i64[] {
    const emailIds = dtype.Insert(emailTableId, TableEmailName, JSON.stringify<EmailToWrite>(dbemail))
    if (emailIds.length == 0) revert("failed to save email");
    const emailId = emailIds[0]

    // node
    const nodeObj = `{"table_id":${emailTableId},"record_id":${emailId},"name":"${dbemail.name}"}`
    const nodeIds = dtype.Insert(tableNodeId, DTypeNodeName, nodeObj)
    if (nodeIds.length == 0) revert("failed to save email node");
    const nodeId = nodeIds[0]

    return [emailId, nodeId]
}

export function getEmailById(ids: TableIds, dtype: DTypeSdk, owner: string, id: i64): EmailToRead | null {
    const resp = dtype.Read(ids.email, TableEmailName, `{"owner":"${owner}","id":${id}}`)
    const emails = JSON.parse<EmailToRead[]>(resp)
    if (emails.length == 0) return null;
    return emails[0]
}

export function getEmails(ids: TableIds, dtype: DTypeSdk, owner: string, folder: string): EmailToRead[] {
    const q = `{"owner":"${owner}"${folder != "" ? `,"folder":"${folder}"` : ""}}`
    const resp = dtype.Read(ids.email, TableEmailName, q)
    return JSON.parse<EmailToRead[]>(resp)
}

export function getThreadWithEmailsById(ids: TableIds, dtype: DTypeSdk, reltypeIds: RelationTypeIds, owner: string, id: i64): ThreadWithEmails | null {
    const thread = getThreadById(ids, dtype, owner, id)
    if (thread == null) return null;

    const resp = getThreadEmails(dtype, ids, reltypeIds, id)

    return new ThreadWithEmails(
        thread.id,
        thread.name,
        thread.last_email_message_id,
        thread.owner,
        thread.email_message_ids,
        thread.missing_refs,
        thread.folder,
        resp,
    )
}

export function getThreadById(ids: TableIds, dtype: DTypeSdk, owner: string, id: i64): ThreadToRead | null {
    const resp = dtype.Read(ids.thread, TableThreadName, `{"owner":"${owner}","id":${id}}`)
    const data = JSON.parse<ThreadToRead[]>(resp)
    if (data.length == 0) return null;
    return data[0]
}

export function getThreads(ids: TableIds, dtype: DTypeSdk, owner: string, folder: string): ThreadToRead[] {
    const resp = dtype.Read(ids.thread, TableThreadName, `{"owner":"${owner}","folder":"${folder}"}`)
    const data = JSON.parse<ThreadToRead[]>(resp)
    return data
}

export function EmailRecordfromEmail(email: Email, owner: string, folder: string): EmailToWrite | null {
    let envelope = ""
    if (email.envelope == null) {
        revert(`email envelope missing`)
        return null
    }
    envelope = JSON.stringify<Envelope>(email.envelope!)
    const header = JSON.stringify<Map<string, string[]>>(email.header);
    let header_References = `[]`
    if (email.header.has("References")) {
        const references = email.header.get("References")
        if (references != null) {
            const refs: string[] = []
            for (let i = 0; i < references.length; i++) {
                const parts = references[i].split(" ")
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i].trim()
                    if (part.at(0) == "<") part = part.substring(1)
                    if (part.at(part.length - 1) == ">") part = part.substring(0, part.length - 1)
                    refs.push(part)
                }
            }
            header_References = JSON.stringify<string[]>(refs)
        }
    }

    return new EmailToWrite(
        email.uid,
        owner,
        stringToBase64(email.raw),
        email.bh,
        email.body,
        email.internalDate.getTime(),
        envelope,
        email.envelope!.Subject,
        email.envelope!.MessageID,
        header,
        header_References,
        JSON.stringify<string[]>(email.flags),
        getEmailSummary(email),
        email.rfc822Size,
        folder,
    )
}

export function getEmailSummary(email: Email): string {
	let name = email.envelope!.From[0].Name
	if (name == "") {
		name = email.envelope!.From[0].Mailbox
	}
	return `${name}: ${email.envelope!.Subject}`
}
