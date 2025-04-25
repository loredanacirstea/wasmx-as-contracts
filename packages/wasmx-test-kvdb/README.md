# test wasmx SQL

* commands

```

{"Connect":{"driver":"sqlite3","connection":"test.db","id":"conn1"}}

{"Close":{"id":"conn1"}}

{"Execute":{"id":"conn1","query":"CREATE TABLE IF NOT EXISTS kvstore (key VARCHAR PRIMARY KEY, value VARCHAR)","params":""}}

{"Execute":{"id":"conn1","query":"INSERT OR REPLACE INTO kvstore(key, value) VALUES (\"helloo\", \"samm\")","params":""}}

{"Query":{"id":"conn1","query":"SELECT value FROM kvstore WHERE key = \"hello\"","params":""}}

```
