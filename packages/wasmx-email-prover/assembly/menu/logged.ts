export const LoggedMenu = `{
    "id": "1110",
    "name": "logged in",
    "type": "folder",
    "children": [
      {
        "id": "1111",
        "name": "email count",
        "icon": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.l54ICAiwopa2RCt7J2URWwHaHa%26pid%3DApi&f=1&ipt=a13a0717219ce256467f1fb9b55ab10c0872fadd9b5ee92264ce2ad03fedf8ac&ipo=images",
        "children": [],
        "open": false,
        "loaded": true,
        "url": "",
        "action": {
          "method": "GET",
          "url": "http://localhost:9999/email/count/INBOX"
        },
        "style": {
          "container": {},
          "inner": {}
        },
        "props": {
          "container": {},
          "inner": {}
        }
      },
      {
        "id": "1112",
        "name": "email list",
        "icon": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.l54ICAiwopa2RCt7J2URWwHaHa%26pid%3DApi&f=1&ipt=a13a0717219ce256467f1fb9b55ab10c0872fadd9b5ee92264ce2ad03fedf8ac&ipo=images",
        "children": [],
        "open": false,
        "loaded": true,
        "url": "",
        "action": {
          "url": "http://localhost:9999/email/emails",
          "request": {
            "method": "GET"
          }
        },
        "style": {
          "container": {},
          "inner": {}
        },
        "props": {
          "container": {},
          "inner": {}
        },
        "item": {
          "action": {
            "url": "http://localhost:9999/email/thread-email-with-menu/{id}",
            "request": {
              "method": "GET"
            },
            "itemUrlValues": {
              "{id}": "id"
            }
          }
        }
      },
      {
        "id": "11130",
        "name": "thread list",
        "icon": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.l54ICAiwopa2RCt7J2URWwHaHa%26pid%3DApi&f=1&ipt=a13a0717219ce256467f1fb9b55ab10c0872fadd9b5ee92264ce2ad03fedf8ac&ipo=images",
        "children": [],
        "open": false,
        "loaded": true,
        "url": "",
        "action": {
          "url": "http://localhost:9999/email/threads",
          "request": {
            "method": "GET"
          }
        },
        "style": {
          "container": {},
          "inner": {}
        },
        "props": {
          "container": {},
          "inner": {}
        },
        "item": {
          "action": {
            "url": "http://localhost:9999/email/thread-emails/{id}",
            "request": {
              "method": "GET"
            },
            "itemUrlValues": {
              "{id}": "id"
            }
          },
          "item": {
            "action": {
              "url": "http://localhost:9999/email/thread-email-with-menu/{id}",
              "request": {
                "method": "GET"
              },
              "itemUrlValues": {
                "{id}": "id"
              }
            }
          }
        }
      },
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
