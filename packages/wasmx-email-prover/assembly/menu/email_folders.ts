export const EmailFoldersHead = function (children: string): string {
    return `{
    "id": "1119",
    "name": "email folders",
    "type": "folder",
    "children": [${children}],
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
}`}

export const EmailFolder = function(id: string, folder: string): string {
    const encoded = encodeURIComponent(folder);
    return `{
    "id": "1119_${id}",
    "name": "${folder}",
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
          "url": "http://localhost:9999/email/count/${encoded}",
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
          "url": "http://localhost:9999/email/emails/${encoded}",
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
          "url": "http://localhost:9999/email/threads/${encoded}",
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
`}
