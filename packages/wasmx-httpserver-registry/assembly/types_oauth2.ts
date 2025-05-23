import { JSON } from "json-as";
import { AuthStyle, Token } from "wasmx-env-oauth2client/assembly/types";

@json
export class Session {
    username: string = ""
    password: string = ""
    expires: i64 = 0
    token: Token | null = null
    provider: string = ""
    jwt: string = ""

    constructor(
        username: string,
        password: string,
        expires: i64,
        token: Token | null,
        provider: string,
        jwt: string,
    ) {
        this.username = username
        this.password = password
        this.expires = expires
        this.token = token
        this.provider = provider
        this.jwt = jwt
    }
}

@json
export class EndpointToWrite {
    name: string = ""
    auth_url: string = ""
    device_auth_url: string = ""
    token_url: string = ""
    auth_style: AuthStyle = 0
    user_info_url: string = ""
    constructor(
        name: string,
        auth_url: string,
        device_auth_url: string,
        token_url: string,
        auth_style: AuthStyle,
        user_info_url: string,
    ) {
        this.name = name
        this.auth_url = auth_url
        this.device_auth_url = device_auth_url
        this.token_url = token_url
        this.auth_style = auth_style
        this.user_info_url = user_info_url
    }
}

@json
export class EndpointToRead extends EndpointToWrite {
    id: i64 = 0
    constructor(
        id: i64,
        name: string,
        auth_url: string,
        device_auth_url: string,
        token_url: string,
        auth_style: AuthStyle,
        user_info_url: string,
    ) {
        super(name, auth_url, device_auth_url, token_url, auth_style, user_info_url)
        this.id = id
    }
}

@json
export class OAuth2ConfigToWrite {
    client_id: string = ""
    client_secret: string = ""
    redirect_url: string = ""
    scopes: string = ""
    provider: string = ""
    constructor(
        client_id: string,
        client_secret: string,
        redirect_url: string,
        scopes: string,
        provider: string,
    ) {
        this.client_id = client_id
        this.client_secret = client_secret
        this.redirect_url = redirect_url
        this.scopes = scopes
        this.provider = provider
    }
}

@json
export class OAuth2UserInfo {
    email: string = ""
    name: string = ""
    sub: string = ""
    given_name: string = ""
    family_name: string = ""
    picture: string = ""
    provider: string = ""
    email_verified: boolean = false
    constructor(
        email: string,
        name: string,
        sub: string,
        given_name: string,
        family_name: string,
        picture: string,
        provider: string,
        email_verified: boolean,
    ) {
        this.email = email
        this.name = name
        this.sub = sub
        this.given_name = given_name
        this.family_name = family_name
        this.picture = picture
        this.provider = provider
        this.email_verified = email_verified
    }
}

@json
export class UserInfoToWrite {
    email: string = ""
    name: string = ""
    sub: string = ""
    given_name: string = ""
    family_name: string = ""
    picture: string = ""
    provider: string = ""
    email_verified: boolean = false
    token: string = ""
    constructor(
        email: string,
        name: string,
        sub: string,
        given_name: string,
        family_name: string,
        picture: string,
        provider: string,
        email_verified: boolean,
        token: string,
    ) {
        this.email = email
        this.name = name
        this.sub = sub
        this.given_name = given_name
        this.family_name = family_name
        this.picture = picture
        this.provider = provider
        this.email_verified = email_verified
        this.token = token
    }
}

@json
export class UserInfoToRead extends UserInfoToWrite {
    id: i64 = 0
    constructor(
        id: i64,
        email: string,
        name: string,
        sub: string,
        given_name: string,
        family_name: string,
        picture: string,
        provider: string,
        email_verified: boolean,
        token: string,
    ) {
        super(email, name, sub, given_name, family_name, picture, provider, email_verified, token)
        this.id = id
    }
}
