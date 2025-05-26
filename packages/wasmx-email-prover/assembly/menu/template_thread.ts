export const TemplateThread = `{data.children[0].envelope.Date}
From: {data.children[0].header.From[0]}
To: {data.children[0].header.To[0]}

\`\`\`
BH: {data.children[0].bh}
MessageID: {data.children[0].envelope.MessageID}
\`\`\`

# {data.children[0].envelope.Subject}

{data.children[0].body}
`
