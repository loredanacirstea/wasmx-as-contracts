import { JSON } from "json-as";
import * as roles from "wasmx-env/assembly/roles";
import * as hooks from "wasmx-env/assembly/hooks";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { stringToBase64, hexToUint8Array, strip0x } from "wasmx-utils/assembly/utils";
import { GenesisState, Params } from "./types";
import { Base64String, CodeMetadata, Role, RolesGenesis, StorageCoreConsensus, StorageMetaConsensus, StorageSingleConsensus, SystemContract, ContractStorageTypeByString, ContractStorageType, SystemContractRole } from "wasmx-env/assembly/types";
import * as modules from "wasmx-env/assembly/modules";

export const ADDR_ECRECOVER = "0x0000000000000000000000000000000000000001"
export const ADDR_ECRECOVERETH = "0x000000000000000000000000000000000000001f"
export const ADDR_SHA2_256 = "0x0000000000000000000000000000000000000002"
export const ADDR_RIPMD160 = "0x0000000000000000000000000000000000000003"
export const ADDR_IDENTITY = "0x0000000000000000000000000000000000000004"
export const ADDR_MODEXP = "0x0000000000000000000000000000000000000005"
export const ADDR_ECADD = "0x0000000000000000000000000000000000000006"
export const ADDR_ECMUL = "0x0000000000000000000000000000000000000007"
export const ADDR_ECPAIRINGS = "0x0000000000000000000000000000000000000008"
export const ADDR_BLAKE2F = "0x0000000000000000000000000000000000000009"

export const ADDR_SECP384R1 = "0x0000000000000000000000000000000000000020"
export const ADDR_SECP384R1_REGISTRY = "0x0000000000000000000000000000000000000021"
export const ADDR_SECRET_SHARING = "0x0000000000000000000000000000000000000022"
export const ADDR_INTERPRETER_EVM_SHANGHAI = "0x0000000000000000000000000000000000000023"
export const ADDR_ALIAS_ETH = "0x0000000000000000000000000000000000000024"
export const ADDR_PROXY_INTERFACES = "0x0000000000000000000000000000000000000025"
export const ADDR_INTERPRETER_PYTHON = "0x0000000000000000000000000000000000000026"
export const ADDR_INTERPRETER_JS = "0x0000000000000000000000000000000000000027"
export const ADDR_INTERPRETER_FSM = "0x0000000000000000000000000000000000000028"
export const ADDR_STORAGE_CHAIN = "0x0000000000000000000000000000000000000029"
export const ADDR_CONSENSUS_RAFT_LIBRARY = "0x000000000000000000000000000000000000002a"
export const ADDR_CONSENSUS_TENDERMINT_LIBRARY = "0x000000000000000000000000000000000000002b"
export const ADDR_CONSENSUS_RAFT = "0x000000000000000000000000000000000000002c"
export const ADDR_CONSENSUS_TENDERMINT = "0x000000000000000000000000000000000000002d"
export const ADDR_CONSENSUS_AVA_SNOWMAN_LIBRARY = "0x000000000000000000000000000000000000002e"
export const ADDR_CONSENSUS_AVA_SNOWMAN = "0x000000000000000000000000000000000000002f"
export const ADDR_STAKING = "0x0000000000000000000000000000000000000030"
export const ADDR_BANK = "0x0000000000000000000000000000000000000031"
export const ADDR_HOOKS = "0x0000000000000000000000000000000000000034"
export const ADDR_GOV = "0x0000000000000000000000000000000000000035"
export const ADDR_GOV_CONT = "0x0000000000000000000000000000000000000038"
export const ADDR_AUTH = "0x0000000000000000000000000000000000000039"
export const ADDR_CONSENSUS_RAFTP2P_LIBRARY = "0x0000000000000000000000000000000000000036"
export const ADDR_CONSENSUS_RAFTP2P = "0x0000000000000000000000000000000000000037"
export const ADDR_CONSENSUS_TENDERMINTP2P_LIBRARY = "0x0000000000000000000000000000000000000040"
export const ADDR_CONSENSUS_TENDERMINTP2P = "0x0000000000000000000000000000000000000041"
export const ADDR_CHAT = "0x0000000000000000000000000000000000000042"
export const ADDR_HOOKS_NONC = "0x0000000000000000000000000000000000000043"
export const ADDR_CHAT_VERIFIER = "0x0000000000000000000000000000000000000044"
export const ADDR_SLASHING = "0x0000000000000000000000000000000000000045"
export const ADDR_DISTRIBUTION = "0x0000000000000000000000000000000000000046"
export const ADDR_TIME = "0x0000000000000000000000000000000000000047"
export const ADDR_LEVEL0 = "0x0000000000000000000000000000000000000048"
export const ADDR_LEVEL0_LIBRARY = "0x0000000000000000000000000000000000000049"
export const ADDR_MULTICHAIN_REGISTRY = "0x000000000000000000000000000000000000004a"
export const ADDR_MULTICHAIN_REGISTRY_LOCAL = "0x000000000000000000000000000000000000004b"
export const ADDR_LOBBY = "0x000000000000000000000000000000000000004d"
export const ADDR_LOBBY_LIBRARY = "0x000000000000000000000000000000000000004e"
export const ADDR_METAREGISTRY = "0x000000000000000000000000000000000000004f"
export const ADDR_INTERPRETER_TAY = "0x0000000000000000000000000000000000000050"

var ADDR_LEVEL0_ONDEMAND = "0x0000000000000000000000000000000000000051"
var ADDR_LEVEL0_ONDEMAND_LIBRARY = "0x0000000000000000000000000000000000000052"

var ADDR_ROLES = "0x0000000000000000000000000000000000000060"
var ADDR_STORAGE_CONTRACTS = "0x0000000000000000000000000000000000000061"
var ADDR_DTYPE = "0x0000000000000000000000000000000000000062"
var ADDR_EMAIL_HANDLER = "0x0000000000000000000000000000000000000063"

export const ADDR_SYS_PROXY = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

//// * contract labels

export const ECRECOVER = "ecrecover"
export const ECRECOVERETH = "ecrecovereth"
export const SHA2_256 = "sha2-256"
export const RIPMD160 = "ripmd160"
export const IDENTITY = "identity"
export const MODEXP = "modexp"
export const ECADD = "ecadd"
export const ECMUL = "ecmul"
export const ECPAIRINGS = "ecpairings"
export const BLAKE2F = "blake2f"
export const ALIAS_ETH = "alias_eth"
export const PROXY_INTERFACES = "proxy_interfaces"
export const SYS_PROXY = "sys_proxy"
export const SECP384R1 = "secp384r1"
export const SECP384R1_REGISTRY = "secp384r1_registry"
export const SECRET_SHARING = "secret_sharing"
export const RAFT_LIBRARY = "raft_library"
export const RAFTP2P_LIBRARY = "raftp2p_library"
export const TENDERMINT_LIBRARY = "tendermint_library"
export const TENDERMINTP2P_LIBRARY = "tendermintp2p_library"
export const AVA_SNOWMAN_LIBRARY = "ava_snowman_library"
export const LEVEL0_LIBRARY = "level0_library"
export const LEVEL0_ONDEMAND_LIBRARY = "level0_ondemand_library"
export const LOBBY_LIBRARY = "lobby_library"
export const INTERPRETER_EVM_SHANGHAI = "interpreter_evm_shanghai_bz_1.0.0"
// https://github.com/RustPython/RustPython version
export const INTERPRETER_PYTHON = "interpreter_python_utf8_0.2.0"
export const INTERPRETER_JS = "interpreter_javascript_utf8_0.1.0"
export const INTERPRETER_FSM = "interpreter_state_machine_bz_0.1.0"
export const INTERPRETER_TAY = "tay_interpreter_v0.0.1"
export const STORAGE_CHAIN = "storage_chain"
export const CONSENSUS_RAFT = "consensus_raft_0.0.1"
export const CONSENSUS_RAFTP2P = "consensus_raftp2p_0.0.1"
export const CONSENSUS_TENDERMINT = "consensus_tendermint_0.0.1"
export const CONSENSUS_TENDERMINTP2P = "consensus_tendermintp2p_0.0.1"
export const CONSENSUS_AVA_SNOWMAN = "consensus_ava_snowman_0.0.1"
export const STAKING_v001 = "staking_0.0.1"
export const BANK_v001 = "bank_0.0.1"
export const ERC20_v001 = "erc20json"
export const DERC20_v001 = "derc20json"
export const HOOKS_v001 = "hooks_0.0.1"
export const GOV_v001 = "gov_0.0.1"
export const GOV_CONT_v001 = "gov_cont_0.0.1"
export const AUTH_v001 = "auth_0.0.1"
export const ROLES_v001 = "roles_0.0.1"
export const SLASHING_v001 = "slashing_0.0.1"
export const DISTRIBUTION_v001 = "distribution_0.0.1"
export const CHAT_v001 = "chat_0.0.1"
export const CHAT_VERIFIER_v001 = "chat_verifier_0.0.1"
export const TIME_v001 = "time_0.0.1"
export const LEVEL0_v001 = "level0_0.0.1"
export const LEVEL0_ONDEMAND_v001 = "level0_ondemand_0.0.1"
export const MULTICHAIN_REGISTRY_v001 = "multichain_registry_0.0.1"
export const MULTICHAIN_REGISTRY_LOCAL_v001 = "multichain_registry_local_0.0.1"
export const LOBBY_v001 = "lobby_json_0.0.1"
export const METAREGISTRY_v001 = "metaregistry_json_0.0.1"
var DTYPE_v001 = "dtype_0.0.1"
var EMAIL_v001 = "email_0.0.1"
var HTTPSERVER_REGISTRY_v001 = "httpserver_registry_0.0.1"
var STORAGE_CONTRACTS_v001 = "storage_contracts_0.0.1"

export const WASMX_MEMORY_DEFAULT = "memory_default_1"
export const WASMX_MEMORY_ASSEMBLYSCRIPT = "memory_assemblyscript_1"
export const WASMX_MEMORY_TAYLOR = "memory_taylor"
export const WASMX_MEMORY_RUSTi64 = "memory_rust_i64_1"

// WasmxExecutionMessage{Data: []byte{}}
export const EMPTY_INIT_MSG = "eyJkYXRhIjoiIn0="

export const EMPTY_ROLE = ""

export function wasmxExecMsg(data: string): Base64String {
    return stringToBase64(`{"data":"${stringToBase64(data)}"}`)
}

export function BuildDep(addr: string, deptype: string): string {
	return `${addr}:${deptype}`
}

export const storageInitMsg = wasmxExecMsg(`{"initialBlockIndex":1}`)
export function govInitMsg(bondBaseDenom: string): Base64String {
    return wasmxExecMsg(`{"bond_base_denom":"${bondBaseDenom}"}`)
}
export const govContInitMsg = wasmxExecMsg(`{"arbitrationDenom":"aarb","coefs":[1048576, 3, 100, 2000, 1500, 10, 4, 8, 10000, 1531, 1000],"defaultX":1531,"defaultY":1000}`)
export const raftInitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"log","value":""},{"key":"validatorNodesInfo","value":"[]"},{"key":"votedFor","value":"0"},{"key":"nextIndex","value":"[]"},{"key":"matchIndex","value":"[]"},{"key":"commitIndex","value":"0"},{"key":"currentTerm","value":"0"},{"key":"lastApplied","value":"0"},{"key":"blockTimeout","value":"heartbeatTimeout"},{"key":"max_tx_bytes","value":"65536"},{"key":"prevLogIndex","value":"0"},{"key":"currentNodeId","value":"0"},{"key":"electionReset","value":"0"},{"key":"max_block_gas","value":"20000000"},{"key":"electionTimeout","value":"0"},{"key":"maxElectionTime","value":"20000"},{"key":"minElectionTime","value":"10000"},{"key":"heartbeatTimeout","value":"5000"}],"initialState":"uninitialized"}}`)
export const tendermintInitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"log","value":""},{"key":"votedFor","value":"0"},{"key":"nextIndex","value":"[]"},{"key":"currentTerm","value":"0"},{"key":"blockTimeout","value":"roundTimeout"},{"key":"max_tx_bytes","value":"65536"},{"key":"roundTimeout","value":15000},{"key":"currentNodeId","value":"0"},{"key":"max_block_gas","value":"20000000"}],"initialState":"uninitialized"}}`)
export const tendermintP2PInitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"log","value":""},{"key":"votedFor","value":"0"},{"key":"nextIndex","value":"[]"},{"key":"currentTerm","value":"0"},{"key":"blockTimeout","value":"roundTimeout"},{"key":"max_tx_bytes","value":"65536"},{"key":"roundTimeout","value":"5000"},{"key":"currentNodeId","value":"0"},{"key":"max_block_gas","value":"60000000"},{"key":"timeoutPropose","value":20000},{"key":"timeoutPrevote","value":20000},{"key":"timeoutPrecommit","value":20000}],"initialState":"uninitialized"}}`)
export const avaInitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"sampleSize","value":"2"},{"key":"betaThreshold","value":2},{"key":"roundsCounter","value":"0"},{"key":"alphaThreshold","value":80}],"initialState":"uninitialized"}}`)
export const timeInitMsg = wasmxExecMsg(`{"params":{"chain_id":"time_666-1","interval_ms":100}}`)
export const level0InitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"log","value":""},{"key":"votedFor","value":"0"},{"key":"nextIndex","value":"[]"},{"key":"currentTerm","value":"0"},{"key":"blockTimeout","value":"roundTimeout"},{"key":"max_tx_bytes","value":"65536"},{"key":"roundTimeout","value":5000},{"key":"currentNodeId","value":"0"},{"key":"max_block_gas","value":"60000000"},{"key":"timeoutPropose","value":20000},{"key":"timeoutPrecommit","value":20000}],"initialState":"uninitialized"}}`)
export const level0OnDemandInitMsg = wasmxExecMsg(`{"instantiate":{"context":[{"key":"log","value":""},{"key":"votedFor","value":"0"},{"key":"nextIndex","value":"[]"},{"key":"currentTerm","value":"0"},{"key":"blockTimeout","value":"roundTimeout"},{"key":"max_tx_bytes","value":"65536"},{"key":"roundTimeout","value":5000},{"key":"currentNodeId","value":"0"},{"key":"max_block_gas","value":"60000000"},{"key":"timeoutPropose","value":20000},{"key":"timeoutPrecommit","value":20000},{"key":"batchTimeout","value":1000}],"initialState":"uninitialized"}}`)
export function mutichainLocalInitMsg(initialPorts: string): Base64String {
    return wasmxExecMsg(`{"ids":[],"initialPorts":${initialPorts}}`)
}
export const hooksInitMsg = wasmxExecMsg(`{"hooks":${JSON.stringify<hooks.Hook[]>(hooks.DEFAULT_HOOKS)}}`)
export const hooksInitMsgNonC = wasmxExecMsg(`{"hooks":${JSON.stringify<hooks.Hook[]>(hooks.DEFAULT_HOOKS_NONC)}}`)

export function lobbyInitMsg (minValidatorsCount: i32, enableEID: boolean, currentLevel: i32, erc20CodeId: i32, derc20CodeId: i32): Base64String {
    return wasmxExecMsg(`{"instantiate":{"context":[{"key":"heartbeatTimeout","value":5000},{"key":"newchainTimeout","value":20000},{"key":"current_level","value":${currentLevel}},{"key":"min_validators_count","value":${minValidatorsCount}},{"key":"enable_eid_check","value":${enableEID}},{"key":"erc20CodeId","value":${erc20CodeId}},{"key":"derc20CodeId","value":${derc20CodeId}},{"key":"level_initial_balance","value":10000000000000000000},{"key":"newchainRequestTimeout","value":1000}],"initialState":"uninitialized"}}`)
}

export function metaregistryInitMsg(currentLevel: i32): Base64String {
    return wasmxExecMsg(`{"params":{"current_level":${currentLevel}}}`)
}

export function bankInitMsg(feeCollectorBech32: string, mintBech32: string): Base64String {
    return wasmxExecMsg(`{"authorities":["${roles.ROLE_STAKING}","${roles.ROLE_GOVERNANCE}","${roles.ROLE_BANK}","${feeCollectorBech32}","${mintBech32}"]}`)
}

export function mutichainInitMsg(minValidatorCount: i32, enableEIDCheck: boolean, erc20CodeId: i32, derc20CodeId: i32): Base64String {
    return wasmxExecMsg(`{"params":{"min_validators_count":${minValidatorCount},"enable_eid_check":${enableEIDCheck.toString()},"erc20CodeId":${erc20CodeId},"derc20CodeId":${derc20CodeId},"level_initial_balance":"10000000000000000000"}}`)
}

export const sc_auth = new SystemContract(
    ADDR_AUTH,
    AUTH_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_AUTH, AUTH_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_roles = new SystemContract(
    ADDR_ROLES,
    ROLES_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_ROLES, ROLES_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_ecrecover = new SystemContract(
    ADDR_ECRECOVER,
    ECRECOVER,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    false,
    false,
    true,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_ecrecovereth = new SystemContract(
    ADDR_ECRECOVERETH,
    ECRECOVERETH,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_sha2_256 = new SystemContract(
    ADDR_SHA2_256,
    SHA2_256,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_ripmd160 = new SystemContract(
    ADDR_RIPMD160,
    RIPMD160,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_identity = new SystemContract(
    ADDR_IDENTITY,
    IDENTITY,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_modexp = new SystemContract(
    ADDR_MODEXP,
    MODEXP,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_ecadd = new SystemContract(
    ADDR_ECADD,
    ECADD,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_ecmul = new SystemContract(
    ADDR_ECMUL,
    ECMUL,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_ecpairings = new SystemContract(
    ADDR_ECPAIRINGS,
    ECPAIRINGS,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_blake2f = new SystemContract(
    ADDR_BLAKE2F,
    BLAKE2F,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_secp384r1 = new SystemContract(
    ADDR_SECP384R1,
    SECP384R1,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_secp384r1_registry = new SystemContract(
    ADDR_SECP384R1_REGISTRY,
    SECP384R1_REGISTRY,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_EID_REGISTRY, SECP384R1_REGISTRY, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_secret_sharing = new SystemContract(
    ADDR_SECRET_SHARING,
    SECRET_SHARING,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    false,
    false,
    true,
    new SystemContractRole(roles.ROLE_SECRET_SHARING, SECRET_SHARING, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_interpreter_evm = new SystemContract(
    ADDR_INTERPRETER_EVM_SHANGHAI,
    INTERPRETER_EVM_SHANGHAI,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_INTERPRETER, INTERPRETER_EVM_SHANGHAI, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_interpreter_py = new SystemContract(
    ADDR_INTERPRETER_PYTHON,
    INTERPRETER_PYTHON,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_INTERPRETER, INTERPRETER_PYTHON, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_interpreter_js = new SystemContract(
    ADDR_INTERPRETER_JS,
    INTERPRETER_JS,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_INTERPRETER, INTERPRETER_JS, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_interpreter_fsm = new SystemContract(
    ADDR_INTERPRETER_FSM,
    INTERPRETER_FSM,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_INTERPRETER, INTERPRETER_FSM, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_interpreter_tay = new SystemContract(
    ADDR_INTERPRETER_TAY,
    INTERPRETER_TAY,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_INTERPRETER, INTERPRETER_TAY, false),
    [WASMX_MEMORY_TAYLOR],
    CodeMetadata.Empty(),
)

export const sc_aliaseth = new SystemContract(
    ADDR_ALIAS_ETH,
    ALIAS_ETH,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_ALIAS, ALIAS_ETH, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_proxy_interfaces = new SystemContract(
    ADDR_PROXY_INTERFACES,
    PROXY_INTERFACES,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    false,
    false,
    true,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_storage_codes = new SystemContract(
    ADDR_STORAGE_CONTRACTS,
    STORAGE_CONTRACTS_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_STORAGE_CONTRACTS, STORAGE_CONTRACTS_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_storage_chain = new SystemContract(
    ADDR_STORAGE_CHAIN,
    STORAGE_CHAIN,
    StorageMetaConsensus,
    storageInitMsg,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_STORAGE, STORAGE_CHAIN, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_raft_library = new SystemContract(
    ADDR_CONSENSUS_RAFT_LIBRARY,
    RAFT_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, RAFT_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_raftp2p_library = new SystemContract(
    ADDR_CONSENSUS_RAFTP2P_LIBRARY,
    RAFTP2P_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, RAFTP2P_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_tendermint_library = new SystemContract(
    ADDR_CONSENSUS_TENDERMINT_LIBRARY,
    TENDERMINT_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, TENDERMINT_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_tendermintp2p_library = new SystemContract(
    ADDR_CONSENSUS_TENDERMINTP2P_LIBRARY,
    TENDERMINTP2P_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, TENDERMINTP2P_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_raft = new SystemContract(
    ADDR_CONSENSUS_RAFT,
    CONSENSUS_RAFT,
    StorageSingleConsensus,
    raftInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, CONSENSUS_RAFT, false),
    [INTERPRETER_FSM, BuildDep(ADDR_CONSENSUS_RAFT_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_raftp2p = new SystemContract(
    ADDR_CONSENSUS_RAFTP2P,
    CONSENSUS_RAFTP2P,
    StorageSingleConsensus,
    raftInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, CONSENSUS_RAFTP2P, false),
    [INTERPRETER_FSM, BuildDep(ADDR_CONSENSUS_RAFTP2P_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_tendermint = new SystemContract(
    ADDR_CONSENSUS_TENDERMINT,
    CONSENSUS_TENDERMINT,
    StorageSingleConsensus,
    tendermintInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, CONSENSUS_TENDERMINT, false),
    [INTERPRETER_FSM, BuildDep(ADDR_CONSENSUS_TENDERMINT_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_tendermintp2p = new SystemContract(
    ADDR_CONSENSUS_TENDERMINTP2P,
    CONSENSUS_TENDERMINTP2P,
    StorageSingleConsensus,
    tendermintP2PInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, CONSENSUS_TENDERMINTP2P, false),
    [INTERPRETER_FSM, BuildDep(ADDR_CONSENSUS_TENDERMINTP2P_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_ava_snowman_library = new SystemContract(
    ADDR_CONSENSUS_AVA_SNOWMAN_LIBRARY,
    AVA_SNOWMAN_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, AVA_SNOWMAN_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_ava_snowman = new SystemContract(
    ADDR_CONSENSUS_AVA_SNOWMAN,
    CONSENSUS_AVA_SNOWMAN,
    StorageSingleConsensus,
    avaInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, CONSENSUS_AVA_SNOWMAN, false),
    [INTERPRETER_FSM, BuildDep(ADDR_CONSENSUS_AVA_SNOWMAN_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_staking = new SystemContract(
    ADDR_STAKING,
    STAKING_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_STAKING, STAKING_v001, true),
    [],
    CodeMetadata.Empty(),
)

export function sc_bank(feeCollectorBech32: string, mintBech32: string): SystemContract {
    return new SystemContract(
        ADDR_BANK,
        BANK_v001,
        StorageCoreConsensus,
        bankInitMsg(feeCollectorBech32, mintBech32),
        true,
        true,
        false,
        new SystemContractRole(roles.ROLE_BANK, BANK_v001, true),
        [],
        CodeMetadata.Empty(),
    )
}

// we only need to create, not initialize the erc20 contract
export const sc_erc20 = new SystemContract(
    "",
    ERC20_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

// we only need to create, not initialize the derc20 contract
export const sc_derc20 = new SystemContract(
    "",
    DERC20_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_slashing = new SystemContract(
    ADDR_SLASHING,
    SLASHING_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_SLASHING, SLASHING_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_distribution = new SystemContract(
    ADDR_DISTRIBUTION,
    DISTRIBUTION_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_DISTRIBUTION, DISTRIBUTION_v001, true),
    [],
    CodeMetadata.Empty(),
)

export function sc_gov(bondBaseDenom: string): SystemContract {
    return new SystemContract(
        ADDR_GOV,
        GOV_v001,
        StorageCoreConsensus,
        govInitMsg(bondBaseDenom),
        true,
        true,
        false,
        new SystemContractRole(roles.ROLE_GOVERNANCE, GOV_v001, true),
        [],
        CodeMetadata.Empty(),
    )
}

export const sc_gov_cont = new SystemContract(
    ADDR_GOV_CONT,
    GOV_CONT_v001,
    StorageCoreConsensus,
    govContInitMsg,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_GOVERNANCE, GOV_CONT_v001, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_chat = new SystemContract(
    ADDR_CHAT,
    CHAT_v001,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_CHAT, CHAT_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_chat_verifier = new SystemContract(
    ADDR_CHAT_VERIFIER,
    CHAT_VERIFIER_v001,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_time = new SystemContract(
    ADDR_TIME,
    TIME_v001,
    StorageSingleConsensus,
    timeInitMsg,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_TIME, TIME_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_level0_library = new SystemContract(
    ADDR_LEVEL0_LIBRARY,
    LEVEL0_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, LEVEL0_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_level0 = new SystemContract(
    ADDR_LEVEL0,
    LEVEL0_v001,
    StorageSingleConsensus,
    level0InitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, LEVEL0_v001, false),
    [INTERPRETER_FSM, BuildDep(ADDR_LEVEL0_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export const sc_level0_ondemand_library = new SystemContract(
    ADDR_LEVEL0_ONDEMAND_LIBRARY,
    LEVEL0_ONDEMAND_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, LEVEL0_ONDEMAND_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export const sc_level0_ondemand = new SystemContract(
    ADDR_LEVEL0_ONDEMAND,
    LEVEL0_ONDEMAND_v001,
    StorageSingleConsensus,
    level0OnDemandInitMsg,
    false,
    false,
    false,
    new SystemContractRole(roles.ROLE_CONSENSUS, LEVEL0_ONDEMAND_v001, false),
    [INTERPRETER_FSM, BuildDep(ADDR_LEVEL0_ONDEMAND_LIBRARY, roles.ROLE_LIBRARY)],
    CodeMetadata.Empty(),
)

export function sc_multichain_registry(minValidatorCount: i32, enableEIDCheck: boolean, erc20CodeId: i32, derc20CodeId: i32): SystemContract {
    return new SystemContract(
        ADDR_MULTICHAIN_REGISTRY,
        MULTICHAIN_REGISTRY_v001,
        StorageCoreConsensus,
        mutichainInitMsg(minValidatorCount, enableEIDCheck, erc20CodeId, derc20CodeId),
        true,
        true,
        false,
        new SystemContractRole(roles.ROLE_MULTICHAIN_REGISTRY, MULTICHAIN_REGISTRY_v001, true),
        [],
        CodeMetadata.Empty(),
    )
}

export function sc_multichain_registry_local(initialPorts: string): SystemContract {
    return new SystemContract(
        ADDR_MULTICHAIN_REGISTRY_LOCAL,
        MULTICHAIN_REGISTRY_LOCAL_v001,
        StorageSingleConsensus,
        mutichainLocalInitMsg(initialPorts),
        true,
        true,
        false,
        new SystemContractRole(roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, MULTICHAIN_REGISTRY_LOCAL_v001, true),
        [],
        CodeMetadata.Empty(),
    )
}

export const sc_lobby_library = new SystemContract(
    ADDR_LOBBY_LIBRARY,
    LOBBY_LIBRARY,
    StorageSingleConsensus,
    EMPTY_INIT_MSG,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_LIBRARY, LOBBY_LIBRARY, false),
    [],
    CodeMetadata.Empty(),
)

export function sc_lobby(minValidatorCount: i32, enableEIDCheck: boolean, currentLevel: i32, erc20CodeId: i32, derc20CodeId: i32): SystemContract {
    return new SystemContract(
        ADDR_LOBBY,
        LOBBY_v001,
        StorageSingleConsensus,
        lobbyInitMsg(minValidatorCount, enableEIDCheck, currentLevel, erc20CodeId, derc20CodeId),
        false,
        false,
        false,
        new SystemContractRole(roles.ROLE_LOBBY, LOBBY_v001, true),
        [INTERPRETER_FSM, BuildDep(ADDR_LOBBY_LIBRARY, roles.ROLE_LIBRARY)],
        CodeMetadata.Empty(),
    )
}

export function sc_metaregistry(currentLevel: i32): SystemContract {
    return new SystemContract(
        ADDR_METAREGISTRY,
        METAREGISTRY_v001,
        StorageMetaConsensus,
        metaregistryInitMsg(currentLevel),
        true,
        true,
        false,
        new SystemContractRole(roles.ROLE_METAREGISTRY, METAREGISTRY_v001, true),
        [],
        CodeMetadata.Empty(),
    )
}

export const sc_sys_proxy = new SystemContract(
    ADDR_SYS_PROXY,
    SYS_PROXY,
    StorageCoreConsensus,
    EMPTY_INIT_MSG,
    false,
    false,
    false,
    null,
    [],
    CodeMetadata.Empty(),
)

export const sc_hooks = new SystemContract(
    ADDR_HOOKS,
    HOOKS_v001,
    StorageCoreConsensus,
    hooksInitMsg,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_HOOKS, roles.ROLE_HOOKS + "_" + HOOKS_v001, true),
    [],
    CodeMetadata.Empty(),
)

export const sc_hooks_nonc = new SystemContract(
    ADDR_HOOKS_NONC,
    HOOKS_v001,
    StorageSingleConsensus,
    hooksInitMsgNonC,
    true,
    true,
    false,
    new SystemContractRole(roles.ROLE_HOOKS_NONC, roles.ROLE_HOOKS_NONC + "_" + HOOKS_v001, true),
    [],
    CodeMetadata.Empty(),
)

export function getDefaultSystemContracts(feeCollectorBech32: string, mintBech32: string, minValidatorCount: i32, enableEIDCheck: boolean, currentLevel: i32, initialPorts: string, bech32PrefixAccAddr: string, bondBaseDenom: string): SystemContract[] {
    let precompiles = [
        // StarterPrecompiles
        // contract storage needs to be initialized first, roles second, auth third
        sc_storage_codes,
        sc_roles,
        sc_auth,

        // SimplePrecompiles
        sc_ecrecover,
        sc_ecrecovereth,
        sc_sha2_256,
        sc_ripmd160,
        sc_identity,
        sc_modexp,
        sc_ecadd,
        sc_ecmul,
        sc_ecpairings,
        sc_blake2f,

        // InterpreterPrecompiles
        sc_interpreter_evm,
        sc_interpreter_py,
        sc_interpreter_js,
        sc_interpreter_fsm,
        sc_interpreter_tay,

        // BasePrecompiles
        sc_storage_chain,
        sc_aliaseth,
        sc_proxy_interfaces,
        sc_sys_proxy,

        // EIDPrecompiles
        sc_secp384r1,
        sc_secp384r1_registry,
        sc_secret_sharing,

        // HookPrecompiles
        sc_hooks,
        sc_hooks_nonc,

        // CosmosPrecompiles
        sc_staking,
        sc_bank(feeCollectorBech32, mintBech32),
        sc_erc20, // leave last for erc20CodeId
        sc_derc20, // leave last for derc20CodeId
    ]
    // codeID starts at 1
    const erc20CodeId = precompiles.length - 1;
    const derc20CodeId = precompiles.length;
    precompiles = precompiles.concat([
        // CosmosPrecompiles cont
        sc_slashing,
        sc_distribution,
        sc_gov(bondBaseDenom),
        sc_gov_cont,

        // ConsensusPrecompiles
        sc_raft_library,
        sc_raftp2p_library,
        sc_tendermint_library,
        sc_tendermintp2p_library,
        sc_raft,
        sc_raftp2p,
        sc_tendermint,
        sc_tendermintp2p,
        sc_ava_snowman_library,
        sc_ava_snowman,
        sc_time,
        sc_level0_library,
        sc_level0,
        sc_multichain_registry_local(initialPorts),
        sc_lobby_library,
        sc_lobby(minValidatorCount, enableEIDCheck, currentLevel, erc20CodeId, derc20CodeId),
        sc_metaregistry(currentLevel),
        sc_level0_ondemand_library,
        sc_level0_ondemand,

        // MultiChainPrecompiles
        sc_multichain_registry(minValidatorCount, enableEIDCheck, erc20CodeId, derc20CodeId),

        // ChatPrecompiles
        sc_chat,
        sc_chat_verifier,

        // SpecialPrecompiles
        // sc_dtype,
        // sc_email_handler,
    ])
    precompiles = fillRoles(precompiles, bech32PrefixAccAddr, feeCollectorBech32)
    return precompiles;
}

export function getDefaultGenesis(bootstrapAccountBech32: string, feeCollectorBech32: string, mintBech32: string, minValidatorCount: i32, enableEIDCheck: boolean, currentLevel: i32, initialPorts: string, bech32PrefixAccAddr: string, bondBaseDenom: string): GenesisState {
    const systemContracts = getDefaultSystemContracts(feeCollectorBech32, mintBech32, minValidatorCount, enableEIDCheck, currentLevel, initialPorts, bech32PrefixAccAddr, bondBaseDenom)
    return new GenesisState(
        new Params(),
        bootstrapAccountBech32,
        systemContracts,
        [],
        [],
        [],
        "",
    )
}

// Helper: get bech32 address from hex
function toBech32(bech32PrefixAccAddr: string, hex: string): string {
    return wasmxw.addr_humanize_mc(hexToUint8Array(strip0x(hex)).buffer, bech32PrefixAccAddr);
}

export function fillRoles(precompiles: SystemContract[], bech32PrefixAccAddr: string, feeCollectorBech32: string): SystemContract[] {
    // Map role -> Role entry (collect primary first, then others)
    // keys ordered by insertion
    const roleMap = new Map<string, Role>();

    // First pass: collect roles and set primary as the first seen contract for that role
    for (let i = 0; i < precompiles.length; i++) {
        const precompile = precompiles[i];
        if (precompile.role == null) continue;
        const role = precompile.role!.role;

        let roleObj: Role

        // Initialize a RoleJSON entry if it doesn't exist
        if (!roleMap.has(role)) {
            if (!ContractStorageTypeByString.has(precompile.storage_type)) {
                throw new Error("storage type does not exist: " + precompile.storage_type)
            }
            let st = ContractStorageTypeByString.get(precompile.storage_type);

            roleObj = new Role(
                role,
                st as ContractStorageType,
                0, // primary
                false,           // multiple
                new Array<string>(),
                new Array<string>(),
            )
        } else {
            roleObj = roleMap.get(role)
        }

        if (precompile.role!.primary) {
            const prefixedAddr = toBech32(bech32PrefixAccAddr, precompile.address)
            roleObj.primary = i32(roleObj.addresses.length)
            roleObj.labels = roleObj.labels.concat([precompile.role!.label])
            roleObj.addresses = roleObj.addresses.concat([prefixedAddr])
        }
        roleMap.set(role, roleObj);
    }

    // Second pass: add additional contracts for roles and mark multiple=true
    for (let i = 0; i < precompiles.length; i++) {
        const precompile = precompiles[i];
        if (precompile.role == null) continue;
        const role = precompile.role!.role;

        if (roleMap.has(role)) {
            const entry = roleMap.get(role);
            // Check if the contract has already been added
            const prefixedAddr = toBech32(bech32PrefixAccAddr, precompile.address)
            if (!entry.addresses.includes(prefixedAddr)) {
                entry.multiple = true
                entry.labels.push(precompile.role!.label)
                entry.addresses.push(prefixedAddr)
                roleMap.set(role, entry);
            }
        }
    }

    // Ensure denom role exists
    if (!roleMap.has(roles.ROLE_DENOM)) {
        roleMap.set(roles.ROLE_DENOM, new Role(
            roles.ROLE_DENOM,
            ContractStorageType.CoreConsensus,
            0,
            true,
            new Array<string>(),
            new Array<string>(),
        ));
    }

    // Ensure fee collector role exists
    if (!roleMap.has(roles.ROLE_FEE_COLLECTOR)) {
        const feeCollectorBech32 = toBech32(bech32PrefixAccAddr, modules.ADDR_FEE_COLLECTOR);
        roleMap.set(roles.ROLE_FEE_COLLECTOR, new Role(
            roles.ROLE_FEE_COLLECTOR,
            ContractStorageType.CoreConsensus,
            0,
            false,
            [roles.ROLE_FEE_COLLECTOR],
            [feeCollectorBech32],
        ));
    }

    // Prepare RolesGenesis message
    const rolesArr = roleMap.values();
    const msgInit = new RolesGenesis(rolesArr, [roles.ROLE_CONSENSUS]);
    const msgInitStr = JSON.stringify(msgInit);
    const msgbz = wasmxExecMsg(msgInitStr);

    // Update the init message for the roles contract
    for (let i = 0; i < precompiles.length; i++) {
        const precompile = precompiles[i];
        if (precompile.role != null && precompile.role!.role == roles.ROLE_ROLES) {
            precompiles[i].init_message = msgbz
        }
    }
    return precompiles;
}
