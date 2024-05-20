import { JSON } from "json-as/assembly";
import { AnyWrap } from "./wasmx_types";

// @ts-ignore
@serializable
export class GenesisState {
    evidence: AnyWrap[]
    constructor(evidence: AnyWrap[]) {
        this.evidence = evidence
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState([])
}
