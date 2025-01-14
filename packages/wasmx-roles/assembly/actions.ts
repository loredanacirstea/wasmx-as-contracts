import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { Base64String, Bech32String, ContractInfo, ContractStorageType, ContractStorageTypeByEnum, ContractStorageTypeByString, Event, EventAttribute, MsgSetup, Role, RoleChanged, RoleChangedActionType, RoleChangedActionTypeByEnum, RoleChangedActionTypeByString, RolesGenesis } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as hooks from "wasmx-env/assembly/hooks";
import * as wasmxevs from 'wasmx-env/assembly/events';
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import * as wasmxcoret from "wasmx-env-core/assembly/types";
import * as blocktypes from "wasmx-blocks/assembly/types"
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as codesregt from "wasmx-codes-registry/assembly/types";
import * as st from "./storage";
import { AttributeKeyRoleMultipleLabels, AttributeKeyRoleStorageType, GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleByRoleNameRequest, GetRoleLabelByContractRequest, MODULE_NAME, MsgRunHook, RolesChangedHook, SetRoleRequest } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { callContract } from "wasmx-env/assembly/utils";

const defaultLabel = roles.ROLE_ROLES + "_" + "rolesv0.0.1";

export function initialize(rolesInitial: Role[]): ArrayBuffer {
    let foundself = false;
    for (let i = 0; i < rolesInitial.length; i++) {
        const r = rolesInitial[i]
        if (r.role == roles.ROLE_ROLES) {
            foundself = true;
            r.multiple = false;
            if (r.labels.length == 0) {
                r.labels = [defaultLabel]
            }
            r.addresses = [wasmxw.getAddress()]
        }
        registerRoleInitial(r);
    }
    if (!foundself) {
        const r = new Role(roles.ROLE_ROLES, ContractStorageType.CoreConsensus, 0, false, [defaultLabel], [wasmxw.getAddress()])
        registerRoleInitial(r);
    }
    return new ArrayBuffer(0);
}

export function setup(req: MsgSetup): ArrayBuffer {
    const prevContract = req.previous_address
    let foundself = false;
    // prevContract holds current role contract metadata, if exists
    if (prevContract != "") {
        // migrate from previous contract
        const oldroles = getOldRoles(prevContract);
        for (let i = 0; i < oldroles.length; i++) {
            const r = oldroles[i]
            if (r.role == roles.ROLE_ROLES) {
                foundself = true;
                r.multiple = false;
                if (r.labels.length == 0) {
                    r.labels = [defaultLabel]
                }
                r.addresses = [wasmxw.getAddress()]
            }
            registerRoleInitial(r);
        }
    }
    if (!foundself) {
        const r = new Role(roles.ROLE_ROLES, ContractStorageType.CoreConsensus, 0, false, [defaultLabel], [wasmxw.getAddress()])
        registerRoleInitial(r);
    }
    return new ArrayBuffer(0);
}

export function EndBlock(req: MsgRunHook): void {
    LoggerDebug("EndBlock", [])
    const block = JSON.parse<blocktypes.BlockEntry>(String.UTF8.decode(base64.decode(req.data).buffer))
    const finalizeResp = JSON.parse<typestnd.ResponseFinalizeBlock>(String.UTF8.decode(base64.decode(block.result).buffer))

    let evs = finalizeResp.events
    for (let i = 0; i < finalizeResp.tx_results.length; i++) {
        evs = evs.concat(finalizeResp.tx_results[i].events)
    }

    for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        if (ev.type == wasmxevs.EventTypeRegisterRole) {
            let roleName = ""
            let label = ""
            let addr = ""
            let action = ""
            for (let j = 0; j < ev.attributes.length; j++) {
                if (ev.attributes[j].key == wasmxevs.AttributeKeyRole) {
                    roleName = ev.attributes[j].value
                }
                if (ev.attributes[j].key == wasmxevs.AttributeKeyContractAddress) {
                    addr = ev.attributes[j].value;
                }
                if (ev.attributes[j].key == wasmxevs.AttributeKeyRoleLabel) {
                    label = ev.attributes[j].value;
                }
                if (ev.attributes[j].key == wasmxevs.AttributeKeyActionType) {
                    action = ev.attributes[j].value;
                }
            }
            // consensus contract
            if (roleName == roles.ROLE_CONSENSUS) {
                continue;
            }
            if (roleName != "" && addr != "" && action != "") {
                if (!RoleChangedActionTypeByString.has(action)) {
                    LoggerError(`invalid action for role change`, ["role", roleName, "action", action])
                }

                const actionType = RoleChangedActionTypeByString.get(action)
                if (actionType == RoleChangedActionType.NoOp) {
                    return;
                }

                // get old role
                let prevAddress = ""
                const role = st.getRoleByRoleName(roleName)
                if (role != null && role.addresses.length > 0) {
                    prevAddress = role.addresses[role.primary];
                }

                LoggerInfo("found new role change", ["role", roleName, "address", addr, "label", label, "action", action]);
                registerRole(roleName, label, addr, actionType)
                triggerRoleChange(addr, prevAddress)
            }
        }
    }
}

export function SetRole(req: SetRoleRequest): ArrayBuffer {
    registerNewRole(req.role);
    return new ArrayBuffer(0);
}

// we just emit an event here! and do the storage changes on EndBlock event
export function SetContractForRole(req: RoleChanged): ArrayBuffer {
    setContractForRole(req);
    return new ArrayBuffer(0);
}

export function GetRoleByRoleName(req: GetRoleByRoleNameRequest): ArrayBuffer {
    return st.getRoleByRoleNameInner(req.role);
}

export function GetRoles(): ArrayBuffer {
    const roles = st.getRoles();
    const data = new RolesGenesis(roles)
    return String.UTF8.encode(JSON.stringify<RolesGenesis>(data));
}

export function GetAddressOrRole(req: GetAddressOrRoleRequest): ArrayBuffer {
    const addr = getAddressOrRole(req.addressOrRole);
    return String.UTF8.encode(addr);
}

export function GetRoleLabelByContract(req: GetRoleLabelByContractRequest): ArrayBuffer {
    const value = st.getLabelByContractAddress(req.address);
    return String.UTF8.encode(value);
}

export function GetRoleByLabel(req: GetRoleByLabelRequest): ArrayBuffer {
    const value = st.getRoleByLabel(req.label);
    if (value == null) return new ArrayBuffer(0);
    return String.UTF8.encode(JSON.stringify<Role>(value));
}

// TODO replace the previous role? if a role cannot hold 2 contracts?
// e.g. consensus
export function registerRoleInitial(role: Role): void {
    if (role.role == "") {
        revert(`cannot register empty role`)
    }
    if (role.labels.length != role.addresses.length) {
        revert(`cannot register role: labels count different than addresses count`)
    }
    LoggerInfo("register role initial", ["role", role.role, "labels", role.labels.join(","), "contract_address", role.addresses.join(",")])
    st.setRole(role)
    // we do not call the hooks contract here, as it may not be initialized yet
    // we use genesis data directly if we need other contracts to know about the roles
}

export function registerNewRole(role: Role): void {
    if (role.role == "") {
        revert(`cannot register empty role`)
    }
    if (role.labels.length == 0) {
        revert(`cannot register role ${role.role} with empty labels`)
    }
    if (role.addresses.length == 0) {
        revert(`cannot register role ${role.role} with empty addresses`)
    }
    if (role.labels.length != role.addresses.length) {
        revert(`cannot register role: labels count different than addresses count`)
    }
    registerRoleInternalWithEvent(role)
    callHookContract(hooks.HOOK_ROLE_CHANGED, JSON.stringify<RolesChangedHook>(new RolesChangedHook(role, null)))
}

// do storage changes only for action Add, Remove
// for Replace, we just emit an event here! and do the storage changes on EndBlock event
export function setContractForRole(roleChanged: RoleChanged): void {
    const roleName = roleChanged.role
    const label = roleChanged.label
    const addr = roleChanged.contract_address
    const action = roleChanged.action_type

    if (roleName == "") {
        revert(`cannot register empty role for ${addr}`)
    }
    if (label == "") {
        revert(`cannot register role ${roleName} with empty label for ${addr}`)
    }
    if (addr == "") {
        revert(`cannot register role ${roleName} with empty address`)
    }
    const role = st.getRoleByRoleName(roleName)
    if (role == null) {
        revert(`role not found: ${roleName}`);
        return;
    }
    if (action == RoleChangedActionType.Add && !role.multiple) {
        revert(`cannot add non-multiple role`)
    }

    if (action == RoleChangedActionType.Remove && !role.multiple) {
        revert(`cannot remove non-multiple role, use replace action type`)
    }

    if (action == RoleChangedActionType.Replace && role.multiple) {
        revert(`cannot replace multiple role, use remove and add action type`)
    }

    registerRoleEvent(role, label, addr, action);

    if (action == RoleChangedActionType.Remove) {
        const foundlabel = st.removeRoleContract(role, addr)
        LoggerInfo("remove contract from role", ["role", roleName, "label", foundlabel, "contract_address", addr])
        callHookContract(hooks.HOOK_ROLE_CHANGED, JSON.stringify<RolesChangedHook>(new RolesChangedHook(null, roleChanged)))
        return;
    }
    if (action == RoleChangedActionType.Add) {
        st.addRoleContract(role, label, addr)
        registerRoleMigration(ContractStorageTypeByEnum.get(role.storage_type), addr);

        LoggerInfo("register contract for role", ["role", roleName, "label", label, "contract_address", addr])

        // we also call the hooks contract
        callHookContract(hooks.HOOK_ROLE_CHANGED, JSON.stringify<RolesChangedHook>(new RolesChangedHook(null, roleChanged)))
    }
}

// Replace action must be ran in EndBlock. don't revert
export function registerRole(roleName: string, label: string, addr: Bech32String, action: RoleChangedActionType): void {
    const roleChanged = new RoleChanged(roleName, label, addr, action)
    const role = st.getRoleByRoleName(roleName)
    if (role == null) {
        LoggerError(`role not found`, ["role", roleName]);
        return;
    }
    if (action != RoleChangedActionType.Replace) {
        return;
    }
    // not multiple
    const foundlabel = st.removeRoleContract(role, role.addresses[0])
    LoggerInfo("remove contract from role", ["role", roleName, "label", foundlabel, "contract_address", addr])

    st.addRoleContract(role, label, addr)


    // either we replace or add a contract
    registerRoleMigration(ContractStorageTypeByEnum.get(role.storage_type), addr);

    LoggerInfo("register contract for role", ["role", roleName, "label", label, "contract_address", addr])

    // we also call the hooks contract
    callHookContract(hooks.HOOK_ROLE_CHANGED, JSON.stringify<RolesChangedHook>(new RolesChangedHook(null, roleChanged)))
}

export function registerRoleMigration(storageType: string, addr: Bech32String): void {
    const contractInfo = getContractInfo(addr);
    if (contractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }
    // migrate storage if needed
    if (contractInfo.storage_type != storageType) {
        LoggerInfo("migrating contract storage", ["address", addr, "source storage type", contractInfo.storage_type, "target storage type", storageType])

        if (!ContractStorageTypeByString.has(contractInfo.storage_type)) {
            revert(`invalid source storage type ${contractInfo.storage_type}`)
        }
        if (!ContractStorageTypeByString.has(storageType)) {
            revert(`invalid target storage type ${storageType}`)
        }

        const sourceStorageType = ContractStorageTypeByString.get(contractInfo.storage_type)
        const targetStorageType = ContractStorageTypeByString.get(storageType)

        wasmxcorew.migrateContractStateByStorageType(new wasmxcoret.MigrateContractStateByStorageRequest(addr, sourceStorageType, targetStorageType))

        contractInfo.storage_type = storageType;
        LoggerInfo("contract storage migrated", ["address", addr]);

        setContractInfo(addr, contractInfo);
    }
}

export function registerRoleInternalWithEvent(role: Role): void {
    st.setRole(role)
    const evs = new Array<Event>(0)
    evs.push(new Event(
        wasmxevs.EventTypeRegisterNewRole,
        [
            new EventAttribute(wasmxevs.AttributeKeyRole, role.role, true),
            new EventAttribute(AttributeKeyRoleMultipleLabels, role.multiple.toString(), true),
            new EventAttribute(AttributeKeyRoleStorageType, role.storage_type.toString(), true),
        ],
    ))
    const nop = RoleChangedActionTypeByEnum.get(RoleChangedActionType.NoOp)
    for (let i = 0; i < role.labels.length; i++) {
        evs.push(new Event(
            wasmxevs.EventTypeRegisterRole,
            [
                new EventAttribute(wasmxevs.AttributeKeyRole, role.role, true),
                new EventAttribute(wasmxevs.AttributeKeyRoleLabel, role.labels[i], true),
                new EventAttribute(wasmxevs.AttributeKeyContractAddress, role.addresses[i], true),
                new EventAttribute(wasmxevs.AttributeKeyActionType, nop, true),
            ],
        ))
    }
    wasmxw.emitCosmosEvents(evs);
}

export function registerRoleEvent(role: Role, label: string, addr: Bech32String, actionType: RoleChangedActionType): void {
    if (!RoleChangedActionTypeByEnum.has(actionType)) {
        revert(`invalid actionType ${actionType}`)
    }
    wasmxw.emitCosmosEvents([new Event(
        wasmxevs.EventTypeRegisterRole,
        [
            new EventAttribute(wasmxevs.AttributeKeyRole, role.role, true),
            new EventAttribute(wasmxevs.AttributeKeyRoleLabel, label, true),
            new EventAttribute(wasmxevs.AttributeKeyContractAddress, addr, true),
            new EventAttribute(wasmxevs.AttributeKeyActionType, RoleChangedActionTypeByEnum.get(actionType), true),
        ],
    )]);
}

export function deregisterRole(): void {
    // TODO
}

export function getAddressOrRole(addressOrRole: string): Bech32String {
    let role = st.getRoleByRoleName(addressOrRole)
    if (role != null) return role.addresses[role.primary];

    const addr = st.getContractAddressByLabel(addressOrRole);
    if (addr != "") {
        return addr
    }
    const valid = wasmxw.validate_bech32_address(addressOrRole);
    if (!valid) revert(`invalid address: ${addressOrRole}`);
    return addressOrRole;
}

export function callHookContract(hookName: string, data: string): void {
    callHookContractInternal(roles.ROLE_HOOKS, hookName, data)
}

export function callHookContractInternal(contractRole: string, hookName: string, data: string): void {
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract(contractRole, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}

export function getContractInfo(addr: Bech32String): ContractInfo | null {
    const addrb64 = base64.encode(Uint8Array.wrap(wasmxw.addr_canonicalize(addr)))
    const calldatastr = `{"GetContractInfo":{"address":"${addrb64}"}}`;
    const resp = callContract(roles.ROLE_STORAGE_CONTRACTS, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        LoggerError(`get contract info failed`, ["error", resp.data])
        return null;
    }
    const data = JSON.parse<codesregt.QueryContractInfoResponse>(resp.data)
    return data.contract_info
}

export function setContractInfo(addr: Bech32String, data: ContractInfo): void {
    const datastr = JSON.stringify<ContractInfo>(data)
    const calldatastr = `{"SetContractInfo":{"address":"${addr}","contract_info":${datastr}}}`;
    const resp = callContract(roles.ROLE_STORAGE_CONTRACTS, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`get contract info failed: ${resp.data}`)
    }
}

export function triggerRoleChange(addr: Bech32String, prevAddress: Bech32String): void {
    // call new contract setup()
    let resp = callContract(addr, `{"setup":{"previous_address":"${prevAddress}"}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        // we allow contracts to not implement setup() if they don't need to
        LoggerError(`new role: contract setup failed`, ["error", resp.data])
    }

    // call old contract stop()
    resp = callContract(addr, `{"stop":{}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        // no need to revert
        LoggerError(`new role: stopping previous contract failed`, ["error", resp.data])
    }
}

export function getOldRoles(addr: Bech32String): Role[] {
    const resp = callContract(addr, `{"GetRoles":{}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`get contract info failed: ${resp.data}`)
    }
    const roles = JSON.parse<RolesGenesis>(resp.data)
    return roles.roles;
}
