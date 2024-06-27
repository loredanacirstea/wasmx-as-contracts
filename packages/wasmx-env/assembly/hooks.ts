import { JSON } from "json-as/assembly";
import * as roles from "./roles";

// nonconsensusless
export const HOOK_START_NODE = "StartNode"
export const HOOK_SETUP_NODE = "SetupNode"

// consenssus
export const HOOK_BEGIN_BLOCK      = "BeginBlock"
export const HOOK_END_BLOCK        = "EndBlock"
export const HOOK_CREATE_VALIDATOR = "CreatedValidator"

// staking
export const AfterValidatorCreated          = "AfterValidatorCreated"
export const AfterValidatorBonded           = "AfterValidatorBonded"
export const AfterValidatorRemoved          = "AfterValidatorRemoved"
export const AfterValidatorBeginUnbonding   = "AfterValidatorBeginUnbonding"
export const AfterDelegationModified        = "AfterDelegationModified"
export const AfterUnbondingInitiated        = "AfterUnbondingInitiated"
export const BeforeValidatorModified        = "BeforeValidatorModified"
export const BeforeDelegationCreated        = "BeforeDelegationCreated"
export const BeforeDelegationSharesModified = "BeforeDelegationSharesModified"
export const BeforeDelegationRemoved        = "BeforeDelegationRemoved"
export const BeforeValidatorSlashed         = "BeforeValidatorSlashed"



// @ts-ignore
@serializable
export class Hook {
    name: string
    sourceModule: string
    targetModules: string[]
    constructor(
        name: string,
        sourceModule: string,
        targetModules: string[],
    ) {
        this.name = name
        this.sourceModule = sourceModule
        this.targetModules = targetModules
    }
}

export const  DEFAULT_HOOKS_NONC: Hook[] = [
    new Hook(
        HOOK_START_NODE,
        roles.ROLE_HOOKS_NONC,
        [roles.ROLE_CONSENSUS, roles.ROLE_CHAT, roles.ROLE_TIME],
    ),
    new Hook(
        HOOK_SETUP_NODE,
        roles.ROLE_HOOKS_NONC,
        [roles.ROLE_CONSENSUS],
    ),
]

export const DEFAULT_HOOKS: Hook[] = [
    new Hook(
        HOOK_BEGIN_BLOCK,
        roles.ROLE_CONSENSUS,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        HOOK_END_BLOCK,
        roles.ROLE_CONSENSUS,
        [roles.ROLE_GOVERNANCE, roles.ROLE_DISTRIBUTION],
    ),
    new Hook(
        HOOK_CREATE_VALIDATOR,
        roles.ROLE_CONSENSUS,
        [],
    ),
    new Hook(
        AfterValidatorCreated,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorBonded,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorRemoved,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorBeginUnbonding,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterDelegationModified,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterUnbondingInitiated,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeValidatorModified,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationCreated,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationSharesModified,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationRemoved,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeValidatorSlashed,
        roles.ROLE_STAKING,
        [roles.ROLE_SLASHING],
    ),
]
