import { JSON } from "json-as";
import { ResponseHandler } from "wasmx-env-httpclient/assembly/types";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-oauth2client"

@json
export class AuthUrlParam {
  constructor(
    public key: string = "",
    public value: string = ""
  ) {}
}

export type AuthStyle = i32
// AuthStyleAutoDetect means to auto-detect which authentication
// style the provider wants by trying both ways and caching
// the successful way for the future.
export const AuthStyleAutoDetect: AuthStyle = 0

// AuthStyleInParams sends the "client_id" and "client_secret"
// in the POST body as application/x-www-form-urlencoded parameters.
export const AuthStyleInParams: AuthStyle = 1

// AuthStyleInHeader sends the client_id and client_password
// using HTTP Basic Authorization. This is an optional style
// described in the OAuth2 RFC 6749 section 2.3.1.
export const AuthStyleInHeader: AuthStyle = 2

@json
export class Endpoint {
	auth_url: string = ""
	device_auth_url: string = ""
	token_url: string = ""
	auth_style: AuthStyle = 0
    constructor(
        auth_url: string,
        device_auth_url: string,
        token_url: string,
        auth_style: AuthStyle,
    ) {
        this.auth_url = auth_url
        this.device_auth_url = device_auth_url
        this.token_url = token_url
        this.auth_style = auth_style
    }
}

@json
export class OAuth2Config {
  constructor(
    public client_id: string = "",
    public client_secret: string = "",
    public redirect_url: string = "",
    public scopes: Array<string> = [],
    public endpoint: Endpoint = new Endpoint("","","",0),
  ) {}
}

@json
export class OAuth2ConfigToRead {
  constructor(
    public client_id: string = "",
    public client_secret: string = "",
    public redirect_url: string = "",
    public scopes: string = "",
    public endpoint: string = "",
  ) {}
}

@json
export class Token {
  constructor(
    public access_token: string = "",
    public token_type: string = "",
    public refresh_token: string = "",
    public expiry: string = "",
    public expires_in: i64 = 0
  ) {}
}

@json
export class GetRedirectUrlRequest {
  constructor(
    public config: OAuth2Config = new OAuth2Config(),
    public random_state: string = "",
    public auth_url_params: Array<AuthUrlParam> = []
  ) {}
}

@json
export class GetRedirectUrlResponse {
  constructor(
    public error: string = "",
    public url: string = ""
  ) {}
}

@json
export class ExchangeCodeForTokenRequest {
  constructor(
    public config: OAuth2Config = new OAuth2Config(),
    public authorization_code: string = ""
  ) {}
}

@json
export class ExchangeCodeForTokenResponse {
  constructor(
    public error: string = "",
    public token: Token = new Token()
  ) {}
}

@json
export class RefreshTokenRequest {
  constructor(
    public config: OAuth2Config = new OAuth2Config(),
    public refresh_token: string = ""
  ) {}
}

@json
export class RefreshTokenResponse {
  constructor(
    public error: string = "",
    public token: Token = new Token()
  ) {}
}

@json
export class Oauth2ClientConnectRequest {
  constructor(
    public connection_id: string = "",
    public config: OAuth2Config = new OAuth2Config(),
    public token: Token = new Token()
  ) {}
}

@json
export class Oauth2ClientConnectResponse {
  constructor(public error: string = "") {}
}

@json
export class Oauth2ClientGetRequest {
  constructor(
    public connection_id: string = "",
    public request_uri: string = ""
  ) {}
}

@json
export class Oauth2ClientGetResponse {
  constructor(
    public error: string = "",
    public data: Base64String = ""
  ) {}
}

@json
export class HttpRequest {
  constructor(
    public method: string = "",
    public url: string = "",
    public headers: Map<string, string> = new Map<string, string>(),
    public body: Base64String = ""
  ) {}
}

@json
export class Oauth2ClientDoRequest {
  constructor(
    public connection_id: string = "",
    public request: HttpRequest = new HttpRequest(),
    public response_handler: ResponseHandler = new ResponseHandler(0, "")
  ) {}
}

@json
export class Oauth2ClientPostRequest {
  constructor(
    public connection_id: string = "",
    public request_uri: string = "",
    public content_type: string = "",
    public data: Base64String = "",
    public response_handler: ResponseHandler = new ResponseHandler(0, "")
  ) {}
}
