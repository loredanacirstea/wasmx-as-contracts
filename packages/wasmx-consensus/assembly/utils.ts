import { Bech32String, Event } from "wasmx-env/assembly/types"
import { LoggerInfo } from "./consensus_wrap"

export class FinalizedCoreEventsInfo {
    consensusContract: string
    consensusLabel: string
    createdValidators: Bech32String[]
    constructor(consensusContract: string, consensusLabel: string, createdValidators: Bech32String[]) {
        this.consensusContract = consensusContract
        this.consensusLabel = consensusLabel
        this.createdValidators = createdValidators
    }
}

const EVENT_TYPE_CONSENSUS = "register_role"
const EVENT_TYPE_CREATE_VALIDATOR = "create_validator"

export function defaultFinalizeResponseEventsParse(evs: Event[]): FinalizedCoreEventsInfo {
    let roleConsensus = false;
    let consensusContract = ""
    let consensusLabel = ""
    let createdValidators: string[] = []
    for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        if (ev.type == EVENT_TYPE_CONSENSUS) {
            for (let j = 0; j < ev.attributes.length; j++) {
                if (ev.attributes[j].key == "role") {
                    roleConsensus = ev.attributes[j].value == "consensus"
                }
                if (ev.attributes[j].key == "contract_address") {
                    consensusContract = ev.attributes[j].value;
                }
                if (ev.attributes[j].key == "role_label") {
                    consensusLabel = ev.attributes[j].value;
                }
            }
            if (roleConsensus) {
                LoggerInfo("found new consensus contract", ["address", consensusContract, "label", consensusLabel])
                break;
            } else {
                consensusContract = ""
                consensusLabel = ""
            }
        } else if (ev.type == EVENT_TYPE_CREATE_VALIDATOR) {
            for (let j = 0; j < ev.attributes.length; j++) {
                if (ev.attributes[j].key == "validator") {
                    createdValidators.push(ev.attributes[j].value)
                }
            }
        }
    }
    return new FinalizedCoreEventsInfo(consensusContract, consensusLabel, createdValidators);
}
