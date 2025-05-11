import { JSON } from "json-as/assembly";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import { Address, Email, Envelope } from "wasmx-env-imap/assembly/types";
import { EmailToWrite, RelationTypeIds, TableIds, ThreadToWrite } from "./types";
import { revert } from "./utils";
import { insertDTypeValues } from "./dtype";
import { TableEmailName, TableThreadName } from "./defs";
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeNodeName, DTypeRelationName, tableNodeId, tableRelationId } from "wasmx-dtype/assembly/config";


// TODO store attachments
export function saveEmail(ids: TableIds, reltypeIds: RelationTypeIds, owner: string, email: Email): string | null {
    console.log("--saveEmail--")
    const envelope = email.envelope
    if (envelope == null) {
        return "failed to convert email, empty envelope";
    }
    console.log("* save email " + JSON.stringify<Address[]>(envelope.From));

    let dbemail = EmailRecordfromEmail(email);
    if (dbemail == null) return "failed to convert email";

    console.log("* save email dbemail " +JSON.stringify<EmailToWrite>(dbemail));

    const _ids = saveEmailWithNode(ids.email, dbemail);
    const emailId = _ids[0]
    const nodeIdEmail = _ids[1]

    console.log("--SaveEmail-- emailId=" + emailId.toString() + " messageId=" + dbemail.envelope_MessageID);


    let refs: Array<string> = JSON.parse<Array<string>>(dbemail.header_References);
    let inReplyTo = envelope.InReplyTo;
    let inReplyTo2 = email.header.has("In-Reply-To") ? email.header.get("In-Reply-To") : new Array<string>();
    if (inReplyTo == null || inReplyTo.length == 0) inReplyTo = inReplyTo2;

    console.log("--inReplyTo-- " + inReplyTo.length.toString() + " " + inReplyTo.join(""));
    console.log("--refs-- " + refs.length.toString() + " " + refs.join(""));

    if (refs.length == 0) {
        // let thread = new Thread(email.ownerAccount, emailId, [emailId]);
        let dbthread = new ThreadToWrite(
            dbemail.name,
            envelope.MessageID,
            owner,
            JSON.stringify<string[]>([envelope.MessageID]),
            `[]`,
        );

        const _ids = saveThreadWithNode(ids.thread, dbthread);
        const threadId = _ids[0]
        const nodeIdThread = _ids[1]

        console.log("--SaveThread-- threadId=" + threadId.toString());

        saveThreadRelation(nodeIdThread, nodeIdEmail, reltypeIds.contains)

        // if (!UpdateEmailAppendThread(emailId, threadId)) return "failed to update email thread";
        // return null;
    }

    // if (inReplyTo.length == 1 && refs.length >= 1) {
    //     log("--email 2 references--");

    //     let result = GetLastKnownReference(email.ownerAccount, refs);
    //     if (result == null) return "error getting last known reference";
    //     let prevEmail = result.prevEmail;
    //     let missingRefs = result.missingRefs;

    //     if (prevEmail != null) {
    //         let threadIds = JSON.parse<Array<i64>>(prevEmail.threadIds);
    //         if (threadIds.length == 0) {
    //         let dbthread = new ThreadRecord(email.ownerAccount, prevEmail.id, "[" + prevEmail.id.toString() + "]", "[]");
    //         let threadId = SetThread(dbthread);
    //         if (threadId < 0) return "failed to save thread";
    //         if (!UpdateEmailAppendThread(emailId, threadId)) return "failed to update email thread";
    //         return null;
    //         } else {
    //             let lastThreadId = threadIds[threadIds.length - 1];
    //             let dbthread = GetThread(email.ownerAccount, lastThreadId);
    //             if (dbthread == null) return "failed to get thread";

    //             if (dbthread.lastEmailId == prevEmail.id) {
    //                 if (!dbthread.addEmailId(emailId)) return "failed to add email to thread";
    //                 if (!UpdateThreadLastEmail(dbthread.id, emailId, dbthread.emailIds)) return "failed to update thread last email";
    //                 if (!UpdateEmailAppendThread(emailId, dbthread.id)) return "failed to update email thread";
    //                 return null;
    //             }
    //         }
    //     }

    //     let existingThread = GetThreadByMissingMessageId(dbemail.ownerAccount, dbemail.envelopeMessageID);
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
    // }
    return null;
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

export function EmailRecordfromEmail(email: Email): EmailToWrite | null {
    let envelope = ""
    if (email.envelope == null) {
        revert(`email envelope missing`)
        return null
    }
    envelope = JSON.stringify<Envelope>(email.envelope!)
    const header = JSON.stringify<Map<string, string[]>>(email.header);
    let header_References = `[]`
    if (email.header.has("References")) {
        header_References = JSON.stringify<string[]>(email.header.get("References"))
    }
    return new EmailToWrite(
        email.uid,
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
