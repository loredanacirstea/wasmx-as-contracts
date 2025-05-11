import { JSON } from "json-as";
import { AnyWrap } from "./wasmx_types";

@json
export class GenesisState {
    evidence: AnyWrap[]
    constructor(evidence: AnyWrap[]) {
        this.evidence = evidence
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState([])
}
