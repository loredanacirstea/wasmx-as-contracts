import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class GenesisState {}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState()
}
