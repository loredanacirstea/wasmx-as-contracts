import { JSON } from "json-as/assembly";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import { Address, Email, Envelope } from "wasmx-env-imap/assembly/types";
import { EmailToWrite, LastKnownReferenceResult, RelationTypeIds, TableIds, ThreadToWrite } from "./types";
import { revert } from "./utils";
import { getDTypeFieldValue, getDTypeFieldValueNoCheck, getDTypeValues, getRecordsByRelationType, insertDTypeValues, updateFieldValues } from "./dtype";
import { TableEmailName, TableThreadName } from "./defs";
import { parseInt64, stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeNodeName, DTypeRelationName, tableNodeId, tableRelationId } from "wasmx-dtype/assembly/config";


// TODO store attachments
export function saveEmail(ids: TableIds, reltypeIds: RelationTypeIds, owner: string, email: Email): string | null {
    console.log("--saveEmail--")
    const envelope = email.envelope
    if (envelope == null) {
        return "failed to convert email, empty envelope";
    }
    console.log("* save email " + JSON.stringify<Address[]>(envelope.From) + "--" + envelope.Subject);

    let dbemail = EmailRecordfromEmail(email, owner);
    if (dbemail == null) return "failed to convert email";

    // console.log("* save email dbemail " +JSON.stringify<EmailToWrite>(dbemail));

    const _ids = saveEmailWithNode(ids.email, dbemail);
    const emailId = _ids[0]
    const nodeIdEmail = _ids[1]
    let nodeIdThread: i64;

    console.log("--SaveEmail-- emailId=" + emailId.toString() + " messageId=" + dbemail.envelope_MessageID);


    let refs: Array<string> = JSON.parse<Array<string>>(dbemail.header_References);
    let inReplyTo = envelope.InReplyTo;
    let inReplyTo2 = email.header.has("In-Reply-To") ? email.header.get("In-Reply-To") : new Array<string>();
    if (inReplyTo == null || inReplyTo.length == 0) inReplyTo = inReplyTo2;


    // every email is part of a thread
	// a thread can have >=1 emails
    if (refs.length == 0) {
        let dbthread = new ThreadToWrite(
            dbemail.name,
            envelope.MessageID,
            owner,
            JSON.stringify<string[]>([envelope.MessageID]),
            `[]`,
        );

        const _ids = saveThreadWithNode(ids.thread, dbthread);
        const threadId = _ids[0]
        nodeIdThread = _ids[1]

        console.log("--SaveThread-- threadId=" + threadId.toString());

        saveThreadRelation(nodeIdThread, nodeIdEmail, reltypeIds.contains)
    }

    // if email has > 2 references
	// look at previous email for thread id
	// if previous email not found, we look until we find one
	// update thread with current email id
    if (inReplyTo.length == 1 && refs.length >= 1) {
        let result = getLastKnownReference(ids, owner, refs);
        if (result.id == 0) return "error getting last known reference";
        let prevEmailId = result.id;
        let missingRefs = result.missingRefs;

        const threadIds = getEmailThreadIds(ids, reltypeIds, prevEmailId);
        if (threadIds.length == 0) {
            revert(`missing thread for email id: ${prevEmailId}`)
        } else {
            // here we just get the last thread and add the email to it.
            let lastThreadId = threadIds[threadIds.length - 1];
            const threadPrevEmailIdStr = getDTypeFieldValue(ids.thread, TableThreadName, "last_email_message_id", `{"id":${lastThreadId}},"owner":"${owner}"`)
            const threadPrevEmailId = parseInt64(threadPrevEmailIdStr)

            if (threadPrevEmailId == prevEmailId) {
                // we expand the thread with current email
                updateFieldValues(ids.thread, TableThreadName, `{"last_email_message_id":${emailId}}`, `{"id":${lastThreadId}},"owner":"${owner}"`)

                const nodeIdThreadStr = getDTypeFieldValue(tableNodeId, DTypeNodeName, "id", `{"table_id":${ids.thread}},"record_id":${lastThreadId}`)
                const nodeIdThread = parseInt64(nodeIdThreadStr)
                saveThreadRelation(nodeIdThread, nodeIdEmail, reltypeIds.contains)
                return null;
            }
        }

        // TODO:
		// if we introduce emails in reverse order
		// search if the messageId is part of missing_refs in an existing thread
        let existingThread = getThreadByMissingMessageId(ids, dbemail.owner, dbemail.envelope_MessageID);

    //     if (existingThread != null) {
    //         if (!UpdateEmailAppendThread(emailId, existingThread.id)) return "failed to update email thread";
    //         let missingRefs = JSON.parse<Array<string>>(existingThread.missingRefs);
    //         missingRefs = missingRefs.filter((s: string) => s != dbemail.envelopeMessageID);
    //         if (!UpdateThreadMissingRefs(existingThread.id, missingRefs)) return "failed to update missing refs";
    //         return null;
    //     }

    //     // Fallback: create new thread with missing refs
    //     let dbthread = new ThreadRecord(
    //         email.ownerAccount,
    //         emailId,
    //         JSON.stringify(refs),
    //         JSON.stringify([emailId])
    //     );
    //     let threadId = SetThread(dbthread);
    //     if (threadId < 0) return "failed to save thread";
    //     if (!UpdateEmailAppendThread(emailId, threadId)) return "failed to update email thread";

    //     for (let i = 0; i < refs.length; i++) {
    //         if (!UpdateEmailAppendThreadByMessageId(email.ownerAccount, refs[i], threadId)) {
    //         return "failed to update reference email thread";
    //         }
    //     }
    }
    return null;
}

export function getThreadByMissingMessageId(ids: TableIds, owner: string, messageId: string): string {
    return ""

//     const values = getDTypeValues(ids.thread, TableThreadName, `{"owner":"${owner}"}`)

//     const query = `SELECT id, last_email_id, owner_account, email_ids, missing_refs FROM threads
// WHERE owner_account = ?
//     AND EXISTS (
//     SELECT 1
//     FROM json_each(threads.missing_refs)
//     WHERE json_each.value = ?
// )
//     `;

//     const result = db.query(query, [owner, messageId]);

//     if (result.length == 0) {
//         console.log("get db thread: not found");
//         return null;
//     }

//     const row = result[0];
//     const dbthread = new ThreadRecord(
//         row[0].toInt(),        // id
//         row[1].toInt(),        // last_email_id
//         row[2].toString(),     // owner_account
//         row[3].toString(),     // email_ids (JSON string)
//         row[4].toString()      // missing_refs (JSON string)
//     );

//     console.log("get db thread: found " + dbthread.toString());
//     return dbthread;
}

export function getEmailThreadIds(ids: TableIds, reltypeIds: RelationTypeIds, emailId: i64): i64[] {
    const threads = getRecordsByRelationType(reltypeIds.contains, "", ids.email, emailId, "target")
    const threadIds: i64[] = []
    for (let i = 0; i < threads.length; i ++) {
        const id = threads[i].get("target_record_id")
        if (id == null) {
            revert(`result does not contain target_record_id`)
            return [];
        }
        threadIds.push(parseInt64(id.toString()))
    }
    return threadIds;
}

export function getLastKnownReference(
    ids: TableIds,
    ownerAccount: string,
    refs: Array<string>
): LastKnownReferenceResult {
    refs.reverse();
    let missingRefs = new Array<string>();
    console.log("--GetLastKnownReference refs-- " + ownerAccount + " " + refs.join(","));

    for (let i = 0; i < refs.length; i++) {
        let messageId = refs[i];
        const resp = getDTypeFieldValueNoCheck(ids.email, TableEmailName, "id", `{"envelope_MessageID":"${messageId}","owner":"${ownerAccount}"}`)
        if (resp.error == "" && resp.data != "") {
            const id = parseInt64(resp.data)
            return new LastKnownReferenceResult(id, missingRefs)
        }
        missingRefs.push(messageId);
    }
    return new LastKnownReferenceResult(0, missingRefs);
}

export function saveThreadRelation(nodeIdThread: i64, nodeIdEmail: i64, relationTypeId: i64): i64 {
    const relObj = `{"relation_type_id":${relationTypeId},"source_node_id":${nodeIdThread},"target_node_id":${nodeIdEmail},"order_index":0}`
    const relIds = insertDTypeValues(tableRelationId, DTypeRelationName, relObj)
    if (relIds.length == 0) revert("failed to save email node");
    return relIds[0]
}

export function saveThreadWithNode(threadTableId: i64, dbthread: ThreadToWrite): i64[] {
    const threadIds = insertDTypeValues(threadTableId, TableThreadName, JSON.stringify<ThreadToWrite>(dbthread))
    if (threadIds.length == 0) revert("failed to save thread");
    const threadId = threadIds[0]

    // node
    const nodeObj = `{"table_id":${threadTableId},"record_id":${threadId},"name":"${dbthread.name}"}`
    const nodeIds = insertDTypeValues(tableNodeId, DTypeNodeName, nodeObj)
    if (nodeIds.length == 0) revert("failed to save email node");
    const nodeId = nodeIds[0]

    return [threadId, nodeId]
}

export function saveEmailWithNode(emailTableId: i64, dbemail: EmailToWrite): i64[] {
    const emailIds = insertDTypeValues(emailTableId, TableEmailName, JSON.stringify<EmailToWrite>(dbemail))
    console.log("* save email emailIds " + JSON.stringify<i64[]>(emailIds));
    if (emailIds.length == 0) revert("failed to save email");
    const emailId = emailIds[0]

    // node
    const nodeObj = `{"table_id":${emailTableId},"record_id":${emailId},"name":"${dbemail.name}"}`
    const nodeIds = insertDTypeValues(tableNodeId, DTypeNodeName, nodeObj)
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
    const references = email.header.get("References")
    if (references != null) {
        for (let i = 0; i < references.length; i++) {
            console.log("-EmailRecordfromEmail References-" + i.toString() + "----" + references[i])
            const parts = references[i].split(" ")
            for (let i = 0; i < parts.length; i++) {
                console.log("--parts--" + i.toString() + "--" + parts[i])
            }
        }
        header_References = JSON.stringify<string[]>(email.header.get("References"))
    }
    return new EmailToWrite(
        email.uid,
        owner,
        stringToBase64(email.raw),
        email.bh,
        email.body,
        email.internal_date.getTime(),
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
