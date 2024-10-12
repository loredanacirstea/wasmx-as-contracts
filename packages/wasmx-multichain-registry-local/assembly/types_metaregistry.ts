import { JSON } from "json-as/assembly";
import { ChainConfig, ChainId } from "wasmx-consensus/assembly/types_multichain";

// @ts-ignore
@serializable
export class ChainConfigData {
    config: ChainConfig
    chain_id: ChainId
    constructor(config: ChainConfig, chain_id: ChainId) {
        this.config = config
        this.chain_id = chain_id
    }
}
