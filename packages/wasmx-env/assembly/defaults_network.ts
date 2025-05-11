import { JSON } from "json-as";

@json
export class GenesisState {}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState()
}
