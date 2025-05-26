export const TemplateEmail = `{data.envelope.Date}
From: {data.header.From[0]}
To: {data.header.To[0]}

\`\`\`
BH: {data.bh}
MessageID: {data.envelope.MessageID}
\`\`\`

# {data.envelope.Subject}

{data.body}
`
