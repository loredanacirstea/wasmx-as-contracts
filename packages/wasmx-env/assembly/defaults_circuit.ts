import { JSON } from "json-as";

@json
export class GenesisAccountPermissions {
    // TODO
}

@json
export class GenesisState {
    account_permissions: GenesisAccountPermissions[]
    disabled_type_urls: string[]
    constructor(account_permissions: GenesisAccountPermissions[], disabled_type_urls: string[]) {
        this.account_permissions = account_permissions
        this.disabled_type_urls = disabled_type_urls
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState([], [])
}
