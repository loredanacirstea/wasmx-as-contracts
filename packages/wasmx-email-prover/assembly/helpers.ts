import { JSON } from "json-as";
import { Address, Email, Envelope } from "wasmx-env-imap/assembly/types";
import { EmailToWrite, LastKnownReferenceResult, MissingRefsWrap, RelationTypeIds, TableIds, ThreadToRead, ThreadToWrite } from "./types";
import { LoggerDebug, LoggerDebugExtended, revert } from "./utils";
import { TableEmailName, TableThreadName } from "./defs";
import { parseInt64, stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeNodeName, DTypeRelationName, tableNodeId, tableRelationId } from "wasmx-dtype/assembly/config";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";

// TODO store attachments
export function saveEmail(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, owner: string, email: Email): string | null {
    const envelope = email.envelope
    if (envelope == null) {
        return "failed to convert email, empty envelope";
    }

    let dbemail = EmailRecordfromEmail(email, owner);
    if (dbemail == null) return "failed to convert email";

    LoggerDebugExtended("save email", ["owner", owner, "summary", dbemail.name])

    const _ids = saveEmailWithNode(dtype, ids.email, dbemail);
    const emailId = _ids[0]
    const nodeIdEmail = _ids[1]
    let nodeIdThread: i64;

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
        );

        const _ids = saveThreadWithNode(dtype, ids.thread, dbthread);
        const threadId = _ids[0]
        nodeIdThread = _ids[1]

        saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
        return null;
    }

    // TODO subject changed => create new thread ? - remains the same thread for now

    // if email has > 2 references
	// look at previous email for thread id
	// if previous email not found, we look until we find one
	// update thread with current email id
    if (inReplyTo.length == 1 && refs.length >= 1) {
        let result = getLastKnownReference(dtype, ids, owner, refs);
        if (result.id > 0) {
            let prevEmailId = result.id;
            let missingRefs = result.missingRefs;

            const threadIds = getEmailThreadIds(dtype, ids, reltypeIds, prevEmailId);
            if (threadIds.length == 0) {
                revert(`missing thread for email id: ${prevEmailId}`)
            } else {
                // here we just get the last thread and add the email to it.
                let lastThreadId = threadIds[threadIds.length - 1];
                const threadPrevEmailIdStr = dtype.ReadField(ids.thread, TableThreadName, "last_email_message_id", `{"id":${lastThreadId}},"owner":"${owner}"`)
                const threadPrevEmailId = parseInt64(threadPrevEmailIdStr)

                if (threadPrevEmailId == prevEmailId) {
                    // we expand the thread with current email
                    dtype.Update(ids.thread, TableThreadName, `{"last_email_message_id":${emailId}}`, `{"id":${lastThreadId}},"owner":"${owner}"`)
                    addEmailThreadRelation(dtype, ids, reltypeIds, lastThreadId, nodeIdEmail)
                    return null;
                }
            }
        }

        // TODO:
		// if we introduce emails in reverse order
		// search if the messageId is part of missing_refs in an existing thread
        let existingThread = getThreadByMissingMessageId(dtype, ids, dbemail.owner, dbemail.envelope_MessageID);

        if (existingThread != null) {
            addEmailThreadRelation(dtype, ids, reltypeIds, existingThread.id, nodeIdEmail)
            let missingRefs = JSON.parse<Array<string>>(existingThread.missing_refs);
            let filtered = new Array<string>();
            for (let i = 0; i < missingRefs.length; i++) {
                if (missingRefs[i] != dbemail.envelope_MessageID) {
                    filtered.push(missingRefs[i]);
                }
            }
            missingRefs = filtered;

            dtype.Update(ids.thread, TableThreadName, JSON.stringify<MissingRefsWrap>(new MissingRefsWrap(JSON.stringify<string[]>(missingRefs))), `{"id":${existingThread.id}}`)
            return null;
        }

        // Fallback: create new thread with missing refs
        let dbthread = new ThreadToWrite(
            dbemail.name,
            emailId,
            owner,
            JSON.stringify<string[]>([envelope.MessageID]),
            JSON.stringify(refs),
        );

        const _ids = saveThreadWithNode(dtype, ids.thread, dbthread);
        const threadId = _ids[0]
        nodeIdThread = _ids[1]

        saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
    }
    return null;
}

export function addEmailThreadRelation(dtype: DTypeSdk, ids: TableIds, reltypeIds: RelationTypeIds, threadId: i64, nodeIdEmail: i64): void {
    const nodeIdThreadStr = dtype.ReadField(tableNodeId, DTypeNodeName, "id", `{"table_id":${ids.thread}},"record_id":${threadId}`)
    const nodeIdThread = parseInt64(nodeIdThreadStr)
    saveThreadRelation(dtype, nodeIdThread, nodeIdEmail, reltypeIds.contains)
}

export function getThreadByMissingMessageId(dtype: DTypeSdk, ids: TableIds, owner: string, messageId: string): ThreadToRead | null {
    // const values = getDTypeValues(ids.thread, TableThreadName, `{"owner":"${owner}"}`)

    const query = `SELECT * FROM ${TableThreadName}
WHERE owner_account = ?
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
        console.log("get db thread: not found");
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
        const resp = dtype.ReadFieldNoCheck(ids.email, TableEmailName, "id", `{"envelope_MessageID":"${messageId}","owner":"${ownerAccount}"}`)
        if (resp.error == "" && resp.data != "") {
            const id = parseInt64(resp.data)
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

export function EmailRecordfromEmail(email: Email, owner: string): EmailToWrite | null {
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
    )
}

export function getEmailSummary(email: Email): string {
	let name = email.envelope!.From[0].Name
	if (name == "") {
		name = email.envelope!.From[0].Mailbox
	}
	return `${name}: ${email.envelope!.Subject}`
}
