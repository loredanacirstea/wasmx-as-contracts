import { JSON } from "json-as/assembly";
import * as roles from "./roles";
import { Base64String } from "./types";

// @ts-ignore
@serializable
export class HookCalld {
    data: Base64String = ""
}

// nonconsensusless
export const HOOK_START_NODE = "StartNode"
export const HOOK_SETUP_NODE = "SetupNode"
export const HOOK_NEW_SUBCHAIN = "NewSubChain"

// consenssus
export const HOOK_BEGIN_BLOCK      = "BeginBlock"
export const HOOK_END_BLOCK        = "EndBlock"
export const HOOK_FINALIZE_BLOCK = "FinalizeBlock"
export const HOOK_CREATE_VALIDATOR = "CreatedValidator"
export const HOOK_ROLE_CHANGED     = "RoleChanged"

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
    sourceModules: string[]
    targetModules: string[]
    constructor(
        name: string,
        sourceModules: string[],
        targetModules: string[],
    ) {
        this.name = name
        this.sourceModules = sourceModules
        this.targetModules = targetModules
    }
}

export const  DEFAULT_HOOKS_NONC: Hook[] = [
    new Hook(
        HOOK_START_NODE,
        [roles.ROLE_HOOKS_NONC],
        [roles.ROLE_CONSENSUS, roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, roles.ROLE_CHAT, roles.ROLE_TIME, roles.ROLE_LOBBY],
    ),
    new Hook(
        HOOK_SETUP_NODE,
        [roles.ROLE_HOOKS_NONC],
        [roles.ROLE_CONSENSUS, roles.ROLE_LOBBY],
    ),
    new Hook(
        HOOK_NEW_SUBCHAIN,
        [roles.ROLE_HOOKS_NONC, roles.ROLE_LOBBY, roles.ROLE_CONSENSUS],
        [roles.ROLE_METAREGISTRY, roles.ROLE_MULTICHAIN_REGISTRY_LOCAL],
    ),
]

export const DEFAULT_HOOKS: Hook[] = [
    new Hook(
        HOOK_BEGIN_BLOCK,
        [roles.ROLE_CONSENSUS],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        HOOK_END_BLOCK,
        [roles.ROLE_CONSENSUS],
        // roles should be last
        [roles.ROLE_GOVERNANCE, roles.ROLE_DISTRIBUTION, roles.ROLE_ROLES],
    ),
    new Hook(
        HOOK_CREATE_VALIDATOR,
        [roles.ROLE_CONSENSUS],
        [],
    ),
    new Hook(
        AfterValidatorCreated,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorBonded,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorRemoved,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterValidatorBeginUnbonding,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterDelegationModified,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        AfterUnbondingInitiated,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeValidatorModified,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationCreated,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationSharesModified,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeDelegationRemoved,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
    new Hook(
        BeforeValidatorSlashed,
        [roles.ROLE_STAKING],
        [roles.ROLE_SLASHING],
    ),
]
