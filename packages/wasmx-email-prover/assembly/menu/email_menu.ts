export const EmailMenu = `{
    "id": "230",
    "name": "{summary}",
    "type": "folder",
    "children": [
        {
        "id": "223",
        "name": "forward email",
        "icon": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.cg1a8lXNeD5DQgf4OOk0BAHaH5%26pid%3DApi&f=1&ipt=53ac9eda5c25b3c9626198f2d8e4eda6838dbffc91c4b43a32be306e11225f88&ipo=images",
        "children": [],
        "open": false,
        "loaded": true,
        "url": "",
        "action": {
            "url": "http://localhost:9999/email/forward/{id}",
            "request": {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                }
            },
            "form": {
                "body": {
                    "title": "Body",
                    "type": "object",
                    "properties": {
                        "additionalSubject": {
                            "type": "string",
                            "title": "Additional Subject",
                            "ui:widget": "input"
                        },
                        "to": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "To",
                            "description": "A list of recipients"
                        }
                    }
                }
            }
        },
        "style": {
            "container": {},
            "inner": {}
        },
        "props": {
            "container": {},
            "inner": {}
        }
    }
],
"open": true,
"loaded": true,
"url": "",
"style": {
  "container": {},
  "inner": {}
},
"props": {
  "container": {},
  "inner": {}
}
}
`
