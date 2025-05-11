import { JSON } from "json-as";

@json
export class GrantAuthorization {
    // TODO
}

@json
export class GenesisState {
    authorization: GrantAuthorization[]
    constructor(authorization: GrantAuthorization[]) {
        this.authorization = authorization
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState([])
}
