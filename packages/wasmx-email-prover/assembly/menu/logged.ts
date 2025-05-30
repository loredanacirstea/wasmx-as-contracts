export const LoggedMenu = `{
  "id": "1110",
  "name": "logged in",
  "type": "folder",
  "open": true,
  "loaded": false,
  "url": "http://localhost:9999/email/folders-menu",
  "style": {
    "container": {},
    "inner": {}
  },
  "props": {
    "container": {},
    "inner": {}
  },
  "children": [
    {
      "id": "1113",
      "name": "compose email",
      "icon": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.cg1a8lXNeD5DQgf4OOk0BAHaH5%26pid%3DApi&f=1&ipt=53ac9eda5c25b3c9626198f2d8e4eda6838dbffc91c4b43a32be306e11225f88&ipo=images",
      "children": [],
      "open": false,
      "loaded": true,
      "url": "",
      "action": {
        "url": "http://localhost:9999/email/new",
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
                  "subject": {
                      "type": "string",
                      "title": "Subject",
                      "ui:widget": "input"
                  },
                  "to": {
                      "type": "array",
                      "items": {
                          "type": "string"
                      },
                      "title": "To",
                      "description": "A list of recipients"
                  },
                  "body": {
                      "type": "string",
                      "title": "Body",
                      "ui:widget": "textarea"
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
  ]
}
`
