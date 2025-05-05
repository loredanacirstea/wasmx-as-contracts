import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-smtp"

// @ts-ignore
@serializable
export class SmtpConnectionSimpleRequest {
  id: string = "";
  smtp_server_url: string = "";
  username: string = "";
  password: string = "";

  constructor(id: string, smtp_server_url: string, username: string, password: string) {
    this.id = id;
    this.smtp_server_url = smtp_server_url;
    this.username = username;
    this.password = password;
  }
}

// @ts-ignore
@serializable
export class SmtpConnectionOauth2Request {
  id: string = "";
  smtp_server_url: string = "";
  username: string = "";
  access_token: string = "";

  constructor(id: string, smtp_server_url: string, username: string, access_token: string) {
    this.id = id;
    this.smtp_server_url = smtp_server_url;
    this.username = username;
    this.access_token = access_token;
  }
}

// @ts-ignore
@serializable
export class SmtpConnectionResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpCloseRequest {
  id: string = "";

  constructor(id: string) {
    this.id = id;
  }
}

// @ts-ignore
@serializable
export class SmtpCloseResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpQuitRequest {
  id: string = "";

  constructor(id: string) {
    this.id = id;
  }
}

// @ts-ignore
@serializable
export class SmtpQuitResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpSendMailRequest {
  id: string = "";
  from: string = "";
  to: Array<string> = new Array<string>();
  email: Array<u8> = new Array<u8>();

  constructor(id: string, from: string, to: Array<string>, email: Array<u8>) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.email = email;
  }
}

// @ts-ignore
@serializable
export class SmtpSendMailResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpVerifyRequest {
  id: string = "";
  address: string = "";

  constructor(id: string, address: string) {
    this.id = id;
    this.address = address;
  }
}

// @ts-ignore
@serializable
export class SmtpVerifyResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpNoopRequest {
  id: string = "";

  constructor(id: string) {
    this.id = id;
  }
}

// @ts-ignore
@serializable
export class SmtpNoopResponse {
  error: string = "";

  constructor(error: string) {
    this.error = error;
  }
}

// @ts-ignore
@serializable
export class SmtpExtensionRequest {
  id: string = "";
  name: string = "";

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

// @ts-ignore
@serializable
export class SmtpExtensionResponse {
  error: string = "";
  found: bool = false;
  params: string = "";

  constructor(error: string, found: bool, params: string) {
    this.error = error;
    this.found = found;
    this.params = params;
  }
}

// @ts-ignore
@serializable
export class SmtpMaxMessageSizeRequest {
  id: string = "";

  constructor(id: string) {
    this.id = id;
  }
}

// @ts-ignore
@serializable
export class SmtpMaxMessageSizeResponse {
  error: string = "";
  size: i64 = 0;
  ok: bool = false;

  constructor(error: string, size: i64, ok: bool) {
    this.error = error;
    this.size = size;
    this.ok = ok;
  }
}

// @ts-ignore
@serializable
export class SmtpSupportsAuthRequest {
  id: string = "";
  mechanism: string = "";

  constructor(id: string, mechanism: string) {
    this.id = id;
    this.mechanism = mechanism;
  }
}

// @ts-ignore
@serializable
export class SmtpSupportsAuthResponse {
  error: string = "";
  found: bool = false;

  constructor(error: string, found: bool) {
    this.error = error;
    this.found = found;
  }
}
