import { JSON } from "json-as";
import { Address, Attachment, EmailExtended, Envelope } from "./types";

export function parseEmailMessage(rawMessage: string): EmailExtended {
    const email = EmailExtended.empty();
    const lines = rawMessage.split('\n');

    let headerEndIndex = -1;
    let currentHeaderKey = "";
    let currentHeaderValue = "";

    // Parse headers
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Empty line indicates end of headers
        if (line.trim().length === 0) {
            // Save last header if exists

            if (currentHeaderKey.length > 0) {
                let values: string[] = email.header.has(currentHeaderKey)
                    ? email.header.get(currentHeaderKey)
                    : [];
                values.push(currentHeaderValue);
                email.header.set(currentHeaderKey, values);
            }
            headerEndIndex = i;
            break;
        }

        // Check if line starts with whitespace (continuation)
        if (line.charAt(0) === ' ' || line.charAt(0) === '\t') {
            currentHeaderValue += " " + line.trim();
            continue;
        }

        // Save previous header if exists
        if (currentHeaderKey.length > 0) {
            const values = email.header.has(currentHeaderKey) ? email.header.get(currentHeaderKey) : [];
            values.push(currentHeaderValue);
            email.header.set(currentHeaderKey, values);
        }

        // Parse new header
        const headerParts = parseHeaderLine(line);
        if (headerParts) {
            currentHeaderKey = headerParts[0];
            currentHeaderValue = headerParts[1];
        }
    }

    // Extract body
    let bodyContent = "";
    if (headerEndIndex >= 0 && headerEndIndex + 1 < lines.length) {
        bodyContent = lines.slice(headerEndIndex + 1).join('\n');
        email.rawBody = bodyContent
    }

    // Populate envelope from headers
    let envelope = email.envelope;
    if (envelope == null) {
        envelope = Envelope.empty();
    }

    if (email.header.has("Date")) {
        const dateValues = email.header.get("Date");
        if (dateValues && dateValues.length > 0) {
            envelope.Date = Date.fromString(dateValues[0]);
        }
    }

    if (email.header.has("Subject")) {
        const subjectValues = email.header.get("Subject");
        if (subjectValues && subjectValues.length > 0) {
            envelope.Subject = subjectValues[0];
        }
    }

    if (email.header.has("From")) {
        const fromValues = email.header.get("From");
        if (fromValues && fromValues.length > 0) {
            envelope.From = parseAddresses(fromValues[0]);
        }
    }

    if (email.header.has("To")) {
        const toValues = email.header.get("To");
        if (toValues && toValues.length > 0) {
            envelope.To = parseAddresses(toValues[0]);
        }
    }

    if (email.header.has("Cc")) {
        const ccValues = email.header.get("Cc");
        if (ccValues && ccValues.length > 0) {
            envelope.Cc = parseAddresses(ccValues[0]);
        }
    }

    if (email.header.has("Message-ID")) {
        const msgIdValues = email.header.get("Message-ID");
        if (msgIdValues && msgIdValues.length > 0) {
            envelope.MessageID = msgIdValues[0];
        }
    }

    // Handle multipart content
    let contentType = "";
    if (email.header.has("Content-Type")) {
        const ctValues = email.header.get("Content-Type");
        if (ctValues && ctValues.length > 0) {
            contentType = ctValues[0];
        }
    }

    if (contentType.includes("multipart/")) {
        // Extract boundary
        const boundary = extractBoundary(contentType);
        email.boundary = boundary;
        if (boundary.length > 0) {
            const parts = extractMultipartContent(bodyContent, boundary);
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const partLines = part.split('\n');

                // Find headers/body split in this part
                let partHeaderEnd = -1;
                for (let j = 0; j < partLines.length; j++) {
                    if (partLines[j].trim().length === 0) {
                        partHeaderEnd = j;
                        break;
                    }
                }

                if (partHeaderEnd >= 0) {
                    const partHeaders = partLines.slice(0, partHeaderEnd);
                    const partBody = partLines.slice(partHeaderEnd + 1).join('\n');

                    // Check if this is an attachment
                    let isAttachment = false;
                    let filename = "";
                    let partContentType = "text/plain";

                    for (let k = 0; k < partHeaders.length; k++) {
                        const headerLine = partHeaders[k];
                        if (headerLine.toLowerCase().startsWith("content-disposition:")) {
                            if (headerLine.includes("attachment")) {
                                isAttachment = true;
                                filename = extractFilename(headerLine);
                            }
                        } else if (headerLine.toLowerCase().startsWith("content-type:")) {
                            partContentType = extractContentType(headerLine);
                        }
                    }

                    if (isAttachment) {
                        // keep base64 encoding of attachment data
                        const attachment = new Attachment(filename, partContentType, removeWhitespace(partBody));
                        email.attachments.push(attachment);
                    } else {
                        // This is the main body
                        if (email.body.length === 0) {
                            email.body = partBody;
                        }
                    }
                }
            }
        }
    } else {
        // Simple single-part message
        email.body = bodyContent;
    }
    email.raw = rawMessage;
    email.bh = extractBodyHashFromHeaders(email.header)

    return email;
}

export function serializeEmailMessage(email: EmailExtended, writeEnvelope: boolean): string {
    let result = "";

     // Build headers
    const headerKeys = email.header.keys();
    for (let i = 0; i < headerKeys.length; i++) {
        const key = headerKeys[i];
        const lowerKey = key.toLowerCase();

        // Skip headers we've already added
        if (writeEnvelope) {
            if (lowerKey === "from" || lowerKey === "to" || lowerKey === "cc" || lowerKey === "bcc" ||
                lowerKey === "subject" || lowerKey === "date" || lowerKey === "message-id") {
                continue;
            }
        }

        if (email.header.has(key)) {
            const values = email.header.get(key);
            for (let j = 0; j < values.length; j++) {
                result += `${key}: ${values[j]}\r\n`;
            }
        }
    }

    if (writeEnvelope) {
        let envelope = email.envelope;
        if (envelope == null) {
            envelope = Envelope.empty();
        }

        // Message-ID
        if (envelope.MessageID.length > 0) {
            result += `Message-ID: ${envelope.MessageID}\r\n`;
        }

        // From
        if (envelope.From.length > 0) {
            const fromAddrs: string[] = [];
            for (let i = 0; i < envelope.From.length; i++) {
                fromAddrs.push(envelope.From[i].toString());
            }
            result += `From: ${fromAddrs.join(", ")}\r\n`;
        }

        // To
        if (envelope.To.length > 0) {
            const toAddrs: string[] = [];
            for (let i = 0; i < envelope.To.length; i++) {
                toAddrs.push(envelope.To[i].toString());
            }
            result += `To: ${toAddrs.join(", ")}\r\n`;
        }

        const cc = envelope.Cc;
        if (cc != null && cc.length > 0) {
            const ccAddrs: string[] = [];
            for (let i = 0; i < cc.length; i++) {
                ccAddrs.push(cc[i].toString());
            }
            result += `Cc: ${ccAddrs.join(", ")}\r\n`;
        }

        const bcc = envelope.Bcc;
        if (bcc != null && bcc.length > 0) {
            const bccAddrs: string[] = [];
            for (let i = 0; i < bcc.length; i++) {
                bccAddrs.push(bcc[i].toString());
            }
            result += `Bcc: ${bccAddrs.join(", ")}\r\n`;
        }

        // Subject
        if (envelope.Subject.length > 0) {
            result += `Subject: ${envelope.Subject}\r\n`;
        }

        // Date
        if (envelope.Date.getTime() > 0) {
            result += `Date: ${formatDateRFC1123Z(envelope.Date)}\r\n`;
        } else {
            result += `Date: ${formatDateRFC1123Z(new Date(Date.now()))}\r\n`;
        }
    }

    if (email.rawBody.length > 0) {
        result += email.rawBody;
    } else {

        // Handle multipart vs single part
        if (email.attachments.length > 0) {
            // Multipart message
            const boundary = email.boundary
            result += `MIME-Version: 1.0\r\n`;
            result += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
            result += `\r\n`;

            // Main body part
            result += `--${boundary}\r\n`;
            result += `Content-Type: text/plain; charset=UTF-8\r\n`;
            result += `\r\n`;
            result += email.body;
            result += `\r\n`;

            // Attachment parts
            for (let i = 0; i < email.attachments.length; i++) {
                const attachment = email.attachments[i];
                result += `--${boundary}\r\n`;
                result += `Content-Type: ${attachment.content_type}\r\n`;
                result += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
                result += `Content-Transfer-Encoding: base64\r\n`;
                result += `\r\n`;

                const encoded = attachment.data; // base64
                // Break base64 into 76-character lines
                for (let j = 0; j < encoded.length; j += 76) {
                    result += encoded.substring(j, i32(Math.min(j + 76, encoded.length))) + `\r\n`;
                }
            }

            result += `--${boundary}--\r\n`;
        } else {
            // Simple single-part message
            result += `Content-Type: text/plain; charset=UTF-8\r\n`;
            result += `\r\n`;
            result += email.body;
        }
    }

    return result;
}

// Remove quotes from start and end of string
export function removeQuotes(str: string): string {
    if (str.length >= 2) {
        const first = str.charAt(0);
        const last = str.charAt(str.length - 1);
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
            return str.substring(1, str.length - 1);
        }
    }
    return str;
}

// Parse "Name <email@domain>" format manually
export function parseNameEmail(str: string): Address | null {
    const ltIndex = str.indexOf('<');
    const gtIndex = str.indexOf('>');

    if (ltIndex > 0 && gtIndex > ltIndex) {
        const name = str.substring(0, ltIndex).trim();
        const email = str.substring(ltIndex + 1, gtIndex).trim();

        const atIndex = email.indexOf('@');
        if (atIndex > 0) {
            const addr = new Address(
                removeQuotes(name),
                email.substring(0, atIndex),
                email.substring(atIndex + 1),
            );
            return addr;
        }
    }

    return null;
}

// Parse email addresses from header value
export function parseAddresses(addressStr: string): Address[] {
    if (!addressStr || addressStr.length === 0) {
        return [];
    }

    const addresses: Address[] = [];
    const parts = addressStr.split(',');

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.length === 0) continue;

        // Try to parse "Name <email@domain>" format first
        const nameEmailAddr = parseNameEmail(part);
        if (nameEmailAddr !== null) {
            addresses.push(nameEmailAddr);
            continue;
        }

        // Simple email format
        const atIndex = part.indexOf('@');
        if (atIndex > 0) {
            const addr = new Address(
                "",
                part.substring(0, atIndex),
                part.substring(atIndex + 1),
            );
            addresses.push(addr);
        }
    }
    return addresses;
}

// Parse header line
export function parseHeaderLine(line: string): string[] | null {
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) return null;

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    return [key, value];
}

// Extract content between boundaries
export function extractMultipartContent(body: string, boundary: string): string[] {
    const parts: string[] = [];
    const boundaryMarker = `--${boundary}`;
    const endMarker = `--${boundary}--`;

    let startIndex = body.indexOf(boundaryMarker);
    while (startIndex !== -1) {
        startIndex += boundaryMarker.length;

        // Skip CRLF after boundary if present
        if (body.charAt(startIndex) == '\r' && body.charAt(startIndex + 1) == '\n') {
            startIndex += 2;
        } else if (body.charAt(startIndex) == '\n') {
            startIndex += 1;
        }

        // Find next boundary or end marker
        let nextBoundary = body.indexOf(boundaryMarker, startIndex);
        let endBoundary = body.indexOf(endMarker, startIndex);

        let endIndex = -1;
        if (nextBoundary !== -1 && (endBoundary === -1 || nextBoundary < endBoundary)) {
            endIndex = nextBoundary;
        } else if (endBoundary !== -1) {
            endIndex = endBoundary;
        }

        if (endIndex === -1) {
            // No more boundaries — take the rest of the message
            endIndex = body.length;
        }

        const part = body.substring(startIndex, endIndex);
        parts.push(part.trim());

        // Set up next iteration
        startIndex = body.indexOf(boundaryMarker, endIndex);
    }

    return parts;
}

// Extract boundary value from Content-Type header
export function extractBoundary(contentType: string): string {
    // Look for boundary= (case insensitive)
    const lowerContentType = contentType.toLowerCase();
    const boundaryIndex = lowerContentType.indexOf("boundary=");

    if (boundaryIndex === -1) {
        return "";
    }

    let start = boundaryIndex + 9; // length of "boundary="
    let end = start;

    // Check if value is quoted
    let isQuoted = false;
    if (start < contentType.length) {
        const firstChar = contentType.charAt(start);
        if (firstChar === '"' || firstChar === "'") {
            isQuoted = true;
            start++; // skip opening quote
            // Find closing quote
            for (let i = start; i < contentType.length; i++) {
                if (contentType.charAt(i) === firstChar) {
                    end = i;
                    break;
                }
            }
        }
    }

    // If not quoted, find end by semicolon or end of string
    if (!isQuoted) {
        for (let i = start; i < contentType.length; i++) {
            const char = contentType.charAt(i);
            if (char === ';' || char === ' ' || char === '\t') {
                end = i;
                break;
            }
        }
        if (end === start) {
            end = contentType.length;
        }
    }

    if (end > start) {
      return contentType.substring(start, end);
    }

    return "";
}

// Extract content type value from Content-Type header
export function extractContentType(headerLine: string): string {
    // Find the colon
    const colonIndex = headerLine.indexOf(':');
    if (colonIndex === -1) {
        return "text/plain";
    }

    let start = colonIndex + 1;

    // Skip whitespace
    while (start < headerLine.length && isWhitespace(headerLine.charCodeAt(start))) {
        start++;
    }

    // Find end (semicolon or end of string)
    let end = start;
    for (let i = start; i < headerLine.length; i++) {
        if (headerLine.charAt(i) === ';') {
            end = i;
            break;
        }
    }
    if (end === start) {
        end = headerLine.length;
    }

    if (end > start) {
        return headerLine.substring(start, end).trim();
    }

    return "text/plain";
}

// Extract filename from Content-Disposition header
export function extractFilename(headerLine: string): string {
    // Look for filename= (case insensitive)
    const lowerHeader = headerLine.toLowerCase();
    const filenameIndex = lowerHeader.indexOf("filename=");

    if (filenameIndex === -1) {
        return "";
    }

    let start = filenameIndex + 9; // length of "filename="
    let end = start;

    // Check if value is quoted
    let isQuoted = false;
    if (start < headerLine.length) {
        const firstChar = headerLine.charAt(start);
        if (firstChar === '"' || firstChar === "'") {
            isQuoted = true;
            start++; // skip opening quote
            // Find closing quote
            for (let i = start; i < headerLine.length; i++) {
                if (headerLine.charAt(i) === firstChar) {
                    end = i;
                    break;
                }
            }
        }
    }

    // If not quoted, find end by semicolon or end of string
    if (!isQuoted) {
        for (let i = start; i < headerLine.length; i++) {
            const char = headerLine.charAt(i);
            if (char === ';' || char === ' ' || char === '\t') {
                end = i;
                break;
            }
        }
        if (end === start) {
            end = headerLine.length;
        }
    }

    if (end > start) {
        return headerLine.substring(start, end);
    }

    return "";
}

// Remove all whitespace from string
export function removeWhitespace(str: string): string {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (!isWhitespace(charCode)) {
            result += str.charAt(i);
        }
    }
    return result;
}

export function isWhitespace(charCode: u32): bool {
    return charCode === 32 ||  // space
           charCode === 9 ||   // tab
           charCode === 10 ||  // newline
           charCode === 13 ||  // carriage return
           charCode === 11 ||  // vertical tab
           charCode === 12;    // form feed
}

// Generate unique boundary for multipart messages
export function generateBoundary(): string {
    return "----=_NextPart_000_" + Math.floor(Math.random() * 1000000).toString();
}

// Mon, 26 May 2025 15:21:04 +0200
export function formatDateRFC1123Z(date: Date, offsetMinutes: i32 = 0): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const weekday = days[date.getUTCDay()];
    const day = pad2(date.getUTCDate());
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hour = pad2(date.getUTCHours());
    const min = pad2(date.getUTCMinutes());
    const sec = pad2(date.getUTCSeconds());

    // Apply timezone offset
    const offsetH = Math.floor(offsetMinutes / 60);
    const offsetM = offsetMinutes % 60;
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const tz = `${offsetSign}${pad2(i32(Math.abs(offsetH)))}${pad2(i32(Math.abs(offsetM)))}`;

    return `${weekday}, ${day} ${month} ${year} ${hour}:${min}:${sec} ${tz}`;
}

function pad2(n: i32): string {
    return n < 10 ? "0" + n.toString() : n.toString();
}

export function extractBodyHashFromHeaders(header: Map<string, string[]>): string {
    const dkimKeys: string[] = ["DKIM-Signature", "X-Google-DKIM-Signature"];

    for (let i = 0; i < dkimKeys.length; i++) {
        const key = dkimKeys[i];
        if (header.has(key)) {
            const values = header.get(key)!;
            for (let j = 0; j < values.length; j++) {
                const val = values[j];
                const bhIndex = val.indexOf("bh=");
                if (bhIndex != -1) {
                    let start = bhIndex + 3;
                    let end = val.indexOf(";", start);
                    if (end == -1) end = val.length;
                    return val.substring(start, end).trim();
                }
            }
        }
    }

    return ""; // Not found
}
