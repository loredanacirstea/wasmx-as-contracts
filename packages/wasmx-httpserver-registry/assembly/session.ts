import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";
import * as httpsw from "wasmx-env-httpserver/assembly/httpserver_wrap";
import { GenerateJWTRequest, RegisteredClaims, VerifyJWTRequest, VerifyJWTResponse } from "wasmx-env-httpserver/assembly/types";
import { MODULE_NAME } from "./types";
import { revert } from "./utils";
import { Claims, SessionToWrite } from "./types_oauth2";
import { Token } from "wasmx-env-oauth2client/assembly/types";

export function NewExpirationTime(sessionExpirationMs: i64): i64 {
    return Date.now() + sessionExpirationMs
}

export function GenerateToken(jwtSecret: Base64String, claims: Claims): string {
    const resp = httpsw.GenerateJWT(new GenerateJWTRequest(jwtSecret, claims.claims, claims.additional_claim), MODULE_NAME)
    if (resp.error != "") {
        revert(resp.error)
    }
    return resp.token
}

export function VerifyJWT(jwtSecret: string, token: string, claims: Claims): VerifyJWTResponse {
    return httpsw.VerifyJWT(new VerifyJWTRequest(jwtSecret, token, claims.claims, claims.additional_claim), MODULE_NAME)
}

export function createSession(jwtSecret: string, sessionExpirationMs: i64, provider: string,  username: string, password: string, token: Token | null): SessionToWrite {
    const expiration = NewExpirationTime(sessionExpirationMs)
    const claims = new Claims(new RegisteredClaims("", "", [], expiration), username)
    const jwttoken = GenerateToken(jwtSecret, claims)
    const session = new SessionToWrite(username, password, expiration, "", provider, jwttoken, JSON.stringify<Claims>(claims))
    if (token != null) {
        session.token = JSON.stringify<Token>(token)
    }
    return session
}
