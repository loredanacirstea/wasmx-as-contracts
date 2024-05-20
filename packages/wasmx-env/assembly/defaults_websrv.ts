import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class Params {
    oauth_client_registration_only_e_id: boolean
    constructor( oauth_client_registration_only_e_id: boolean) {
        this.oauth_client_registration_only_e_id = oauth_client_registration_only_e_id
    }
}

// @ts-ignore
@serializable
export class GenesisState {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState(new Params(false))
}
