import { JSON } from "json-as/assembly";
import { getParamsInternal, setParams, setNewValidator, getParams } from './storage';
import { MsgInitGenesis, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate } from './types';
import { revert } from './utils';

const POWER_REDUCTION = 1000000

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    setParams(req.params)
    const vupdates: ValidatorUpdate[] = [];
    for (let i = 0; i < req.validators.length; i++) {
        const validator = req.validators[i];
        setNewValidator(validator);
        const power = validator.tokens / POWER_REDUCTION;
        vupdates.push(new ValidatorUpdate(validator.consensus_pubkey, power))
    }
    let data = JSON.stringify<ValidatorUpdate[]>(vupdates)
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}

export function CreateValidator(req: MsgCreateValidator): void {
    const validator = new Validator(
        req.validator_address,
        req.pubkey, // TODO codec any?
        false,
        Unbonded,
        0,
        f64(0),
        req.description,
        0,
        0,
        new Commission(req.commission, 0),
        req.min_self_delegation || 1,
        0,
        [],
    )
    // delegate(req.value);

    // check denom
    const params = getParams();
    if (params.bond_denom != req.value.denom) {
        revert(`cannot create validator with ${req.value.denom}; need ${params.bond_denom}`)
    }
    validator.tokens += req.value.amount
    // validator.delegator_shares += ?
    setNewValidator(validator);
}

export function EditValidator(): void {

}

export function Delegate (): void {

}

export function BeginRedelegate(): void {

}

export function Undelegate(): void {

}

export function CancelUnbondingDelegation(): void {

}

export function UpdateParams(): void {

}

export function ExportGenesis(): void {

}

