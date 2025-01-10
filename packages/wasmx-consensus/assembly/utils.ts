import { Bech32String, Event } from "wasmx-env/assembly/types"
import * as wasmxevs from 'wasmx-env/assembly/events';
import { LoggerInfo } from "./consensus_wrap"
import { Base64String } from "./types_multichain"
import { CodeType, ExecTxResult } from "./types_tendermint"

export class CreatedValidator {
    operator_address: Bech32String
    txindex: i32
    constructor(operator_address: Bech32String,  txindex: i32) {
        this.operator_address = operator_address
        this.txindex = txindex
    }
}

export class FinalizedCoreEventsInfo {
    consensusContract: string
    consensusLabel: string
    createdValidators: CreatedValidator[]
    initChainRequests: Base64String[]
    constructor(consensusContract: string, consensusLabel: string, createdValidators: CreatedValidator[], initChainRequests: Base64String[]) {
        this.consensusContract = consensusContract
        this.consensusLabel = consensusLabel
        this.createdValidators = createdValidators
        this.initChainRequests = initChainRequests
    }
}

const EVENT_TYPE_CREATE_VALIDATOR = "create_validator"
const EVENT_TYPE_INIT_SUBCHAIN = "init_subchain"

const EVENT_TYPE_INIT_SUBCHAIN_ATTR = "init_subchain_request"

export function defaultFinalizeResponseEventsParse(txResults: ExecTxResult[]): FinalizedCoreEventsInfo {
    let roleConsensus = false;
    let consensusContract = ""
    let consensusLabel = ""
    let createdValidators: CreatedValidator[] = []
    let initChainRequests: string[] = []
    for (let x = 0; x < txResults.length; x++) {
        // skip failed transactions
        if (txResults[x].code != CodeType.Ok) {
            continue;
        }
        const evs = txResults[x].events
        for (let i = 0; i < evs.length; i++) {
            const ev = evs[i];
            if (ev.type == wasmxevs.EventTypeRegisterRole) {
                for (let j = 0; j < ev.attributes.length; j++) {
                    if (ev.attributes[j].key == wasmxevs.AttributeKeyRole) {
                        roleConsensus = ev.attributes[j].value == "consensus"
                    }
                    if (ev.attributes[j].key == wasmxevs.AttributeKeyContractAddress) {
                        consensusContract = ev.attributes[j].value;
                    }
                    if (ev.attributes[j].key == wasmxevs.AttributeKeyRoleLabel) {
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
                        const val = new CreatedValidator(ev.attributes[j].value, x)
                        createdValidators.push(val)
                    }
                }
            }  else if (ev.type == EVENT_TYPE_INIT_SUBCHAIN) {
                for (let j = 0; j < ev.attributes.length; j++) {
                    if (ev.attributes[j].key == EVENT_TYPE_INIT_SUBCHAIN_ATTR) {
                        initChainRequests.push(ev.attributes[j].value)
                    }
                }
            }
        }
    }
    return new FinalizedCoreEventsInfo(consensusContract, consensusLabel, createdValidators, initChainRequests);
}
