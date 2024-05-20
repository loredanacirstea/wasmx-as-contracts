import * as roles from "wasmx-env/assembly/roles";
import { GenesisState, DenomDeploymentInfo, DenomUnit, Metadata, Params } from "./types"

export function buildDenomUnits(denomUnit: string, baseDenomUnit: u32): DenomUnit[] {
    const unitMax = new DenomUnit(denomUnit, baseDenomUnit, [])
    const unitMin = new DenomUnit(`a${denomUnit}`, 1, [])
    return [unitMax, unitMin]
}

export function buildDenomInfo(description: string, denomUnit: string, baseDenomUnit: u32, codeId: u64, tokenAdmins: string[], tokenMinters: string[], gasTokenBaseDenom: string): DenomDeploymentInfo {
    const baseDenom = `a${denomUnit}`
    const tokenMeta = new Metadata(
        description,
        buildDenomUnits(denomUnit, baseDenomUnit),
        baseDenom,
        denomUnit.toUpperCase(),
        denomUnit.toUpperCase(),
        denomUnit,
        "", "",
    )
    return new DenomDeploymentInfo(tokenMeta, codeId, tokenAdmins, tokenMinters, "", gasTokenBaseDenom)
}

export function getDefaultBankDenoms(denomUnit: string, baseDenomUnit: u32, erc20CodeId: u64, derc20CodeId: u64): DenomDeploymentInfo[] {
    const gasTokenAdmins: string[] = [roles.ROLE_BANK, roles.ROLE_GOVERNANCE]
    const gasTokenMinters: string[] = [roles.ROLE_BANK, roles.ROLE_GOVERNANCE, roles.ROLE_DISTRIBUTION]
    const gasTokenInfo = buildDenomInfo(
        "main gas token",
        denomUnit,
        baseDenomUnit,
        erc20CodeId,
        gasTokenAdmins,
        gasTokenMinters,
        "",
    )

    const stakingTokenAdmins: string[] = [roles.ROLE_BANK, roles.ROLE_STAKING]
    const stakingTokenMinters: string[] = [roles.ROLE_BANK, roles.ROLE_STAKING]
    const stakingDenomUnit = `s${denomUnit}`
    const stakingTokenInfo = buildDenomInfo(
        "staking token",
        stakingDenomUnit,
        baseDenomUnit,
        derc20CodeId,
        stakingTokenAdmins,
        stakingTokenMinters,
        gasTokenInfo.metadata.base,
    )

    const rewardTokenAdmins: string[] = [roles.ROLE_BANK, roles.ROLE_DISTRIBUTION]
    const rewardTokenMinters: string[] = [roles.ROLE_BANK, roles.ROLE_DISTRIBUTION]
    const rewardDenomUnit = `r${denomUnit}`
    const rewardTokenInfo = buildDenomInfo(
        "rewards token",
        rewardDenomUnit,
        baseDenomUnit,
        erc20CodeId,
        rewardTokenAdmins,
        rewardTokenMinters,
        gasTokenInfo.metadata.base,
    )

    return [gasTokenInfo, stakingTokenInfo, rewardTokenInfo]
}

export function getDefaultParams(): Params {
    return new Params(true, [])
}

export function getDefaultGenesis(denomUnit: string, baseDenomUnit: u32, erc20CodeId: u64, derc20CodeId: u64): GenesisState {
    const params = getDefaultParams()
    const defaultBankDenoms = getDefaultBankDenoms(denomUnit, baseDenomUnit, erc20CodeId, derc20CodeId)
    return new GenesisState(params, [], [], defaultBankDenoms, [])
}
