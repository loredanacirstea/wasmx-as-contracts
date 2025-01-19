import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateValidator, GenesisState, QueryGetAllValidators, MsgUpdateValidators, QueryValidatorRequest, QueryDelegationRequest, QueryPoolRequest, QueryValidatorDelegationsRequest, QueryDelegatorValidatorsRequest, QueryParamsRequest, QueryGetAllValidatorInfos, QueryIsValidatorJailed, MsgSlash, MsgJail, MsgUnjail, MsgSlashWithInfractionReason, QueryConsensusAddressByOperatorAddress } from './types';
import { MsgSetup } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    // system
    setup: MsgSetup | null = null;
    stop: MsgEmpty | null = null;

    InitGenesis: GenesisState | null = null;
    CreateValidator: MsgCreateValidator | null = null;
    UpdateValidators: MsgUpdateValidators | null = null;
    Slash: MsgSlash | null = null;
    SlashWithInfractionReason: MsgSlashWithInfractionReason | null = null;
    Jail: MsgJail | null = null;
    Unjail: MsgUnjail | null = null;

    // query
    Params: QueryParamsRequest | null = null;
    GetValidator: QueryValidatorRequest | null = null;
    GetDelegation: QueryDelegationRequest | null = null;
    GetPool: QueryPoolRequest | null = null;
    ValidatorByConsAddr: QueryValidatorRequest | null = null;
    ValidatorByHexAddr: QueryValidatorRequest | null = null;
    GetValidatorDelegations: QueryValidatorDelegationsRequest | null = null;
    GetDelegatorValidators: QueryDelegatorValidatorsRequest | null = null;
    GetDelegatorValidatorAddresses: QueryDelegatorValidatorsRequest | null = null;
    GetAllValidators: QueryGetAllValidators | null = null;
    GetAllValidatorInfos: QueryGetAllValidatorInfos | null = null;
    IsValidatorJailed: QueryIsValidatorJailed | null = null;
    ConsensusAddressByOperatorAddress: QueryConsensusAddressByOperatorAddress | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
