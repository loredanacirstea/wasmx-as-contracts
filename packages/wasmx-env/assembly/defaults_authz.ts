import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class GrantAuthorization {
    // TODO
}

// @ts-ignore
@serializable
export class GenesisState {
    authorization: GrantAuthorization[]
    constructor(authorization: GrantAuthorization[]) {
        this.authorization = authorization
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState([])
}
