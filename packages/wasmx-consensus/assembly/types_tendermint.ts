import { JSON } from "json-as";
import * as base64 from "as-base64/assembly/index";
import {HexString, Base64String, Bech32String, Event, PublicKey, MsgCrossChainCallRequest} from 'wasmx-env/assembly/types';
import { AnyWrap } from "wasmx-env/assembly/wasmx_types";
import { NodePorts } from "./types_multichain";
import { parseInt64 } from "wasmx-utils/assembly/utils";

// ABCISemVer is the semantic version of the ABCI protocol
export const ABCISemVer  = "2.0.0"
export const ABCIVersion = ABCISemVer
// P2PProtocol versions all p2p behavior and msgs.
// This includes proposer selection.
export const P2PProtocol: u64 = 8
// BlockProtocol versions all block data structures and processing.
// This includes validity of blocks and state updates.
export const BlockProtocol: u64 = 11;

export const TypeUrl_ExtensionOptionEthereumTx         = "/mythos.wasmx.v1.ExtensionOptionEthereumTx"
export const TypeUrl_ExtensionOptionAtomicMultiChainTx = "/mythos.network.v1.ExtensionOptionAtomicMultiChainTx"
export const TypeUrl_ExtensionOptionMultiChainTx       = "/mythos.network.v1.ExtensionOptionMultiChainTx"

@json
export class ResponseWrap {
    error: string
    data: Base64String
    constructor(error: string, data: Base64String) {
        this.error = error
        this.data = data
    }
}

@json
export class VersionConsensus {
    block: u64
    app: u64
    constructor(block: u64, app: u64) {
        this.block = block
        this.app = app
    }
}

@json
export class Version {
	consensus: VersionConsensus
	software: string
    constructor(consensus: VersionConsensus, software: string) {
        this.consensus = consensus
        this.software = software
    }
}

@json
export class PartSetHeader {
    total: u32
    hash: HexString
    constructor(total: u32, hash: HexString) {
        this.total = total;
        this.hash = hash;
    }
}

@json
export class BlockID {
    // block hash
    hash: HexString
    // PartSet containing parts of a serialized block. is the form in which the block is gossipped to peers.
    // PartSetHeader:
    // 1. total number of parts
    parts: PartSetHeader
    constructor(hash: HexString, parts: PartSetHeader) {
        this.hash = hash;
        this.parts = parts;
    }
}

@json
export class BlockIDProto {
    // block hash
    hash: Base64String
    part_set_header: PartSetHeader
    constructor(hash: Base64String, part_set_header: PartSetHeader) {
        this.hash = hash;
        this.part_set_header = part_set_header;
    }
}

@json
export class Header {
    // basic block info
    version: VersionConsensus
    chain_id: string
    height: i64
    time: string

    // prev block info
    last_block_id: BlockID

    // hashes of block data
    // commit from validators from the last block
    last_commit_hash: HexString
    // transactions
    data_hash: HexString // transactions

    // hashes from the app output from the prev block
    // validators for the current block
    validators_hash: HexString
    // validators for the next block
    next_validators_hash: HexString
    // consensus params for current block
    consensus_hash: HexString
    // state after txs from the previous block
    app_hash: HexString
    // root hash of all results from the txs from the previous block
    // see `deterministicExecTxResult` to understand which parts of a tx is hashed into here
    last_results_hash: HexString

    // consensus info
    // evidence included in the block
    evidence_hash: HexString
    // address of the public key of the original proposer of the block.
    proposer_address: HexString // hex
    constructor(version: VersionConsensus, chain_id: string, height: i64, time: string, last_block_id: BlockID, last_commit_hash: HexString, data_hash: HexString, validators_hash: HexString, next_validators_hash: HexString, consensus_hash: HexString, app_hash: HexString, last_results_hash: HexString, evidence_hash: HexString, proposer_address: HexString) {
        this.version = version;
        this.chain_id = chain_id;
        this.height = height;
        this.time = time;
        this.last_block_id = last_block_id;
        this.last_commit_hash = last_commit_hash;
        this.data_hash = data_hash;
        this.validators_hash = validators_hash;
        this.next_validators_hash = next_validators_hash;
        this.consensus_hash = consensus_hash;
        this.app_hash = app_hash;
        this.last_results_hash = last_results_hash;
        this.evidence_hash = evidence_hash;
        this.proposer_address = proposer_address;
    }
}

@json
export class ExtendedVoteInfo {
	// The validator that sent the vote.
	validator: Validator;
	// Non-deterministic extension provided by the sending validator's application.
	vote_extension: Base64String;
	// Vote extension signature created by CometBFT
	extension_signature: Base64String;
	// block_id_flag indicates whether the validator voted for a block, nil, or did not vote at all
	block_id_flag: BlockIDFlag;
    constructor(validator: Validator, voteExtension: Base64String, extensionSignature: Base64String, blockIdFlag: BlockIDFlag) {
        this.validator = validator;
        this.vote_extension = voteExtension;
        this.extension_signature = extensionSignature;
        this.block_id_flag = blockIdFlag;
    }
}

@json
export class ExtendedCommitInfo {
    // The round at which the block proposer decided in the previous height.
	round: i64;
	// List of validators' addresses in the last validator set with their voting
	// information, including vote extensions.
	votes: ExtendedVoteInfo[];
    constructor(round: i64, votes: ExtendedVoteInfo[]) {
        this.round = round;
        this.votes = votes;
    }
}

@json
export class CommitSig {
    block_id_flag: BlockIDFlag
    validator_address: HexString
    timestamp: Date | null // absent votes must make this null
    signature: Base64String
    constructor(block_id_flag: BlockIDFlag, validator_address: HexString, timestamp: Date | null, signature: Base64String) {
        this.block_id_flag = block_id_flag;
        this.validator_address = validator_address;
        this.timestamp = timestamp;
        this.signature = signature;
    }
}

@json
export class BlockCommit {
    // NOTE: The signatures are in order of address to preserve the bonded
    // ValidatorSet order.
    // Any peer with a block can gossip signatures by index with a peer without
    // recalculating the active ValidatorSet.
    height: i64
    round: i64
    block_id: BlockID
    signatures: CommitSig[]
    constructor(height: i64, round: i64, block_id: BlockID, signatures: CommitSig[]) {
        this.height = height;
        this.round = round;
        this.block_id = block_id;
        this.signatures = signatures;
    }
}

@json
export class CanonicalVote {
    type: i32 = 0 // SignedMsgType
    height: i64 = 0
    round: i64 = 0
    block_id: BlockIDProto
    timestamp: Date
    chain_id: string = ""
    constructor(
        type: i32,
        height: i64,
        round: i64,
        block_id: BlockIDProto,
        timestamp: Date,
        chain_id: string,
    ) {
        this.type = type
        this.height = height
        this.round = round
        this.block_id = block_id
        this.timestamp = timestamp
        this.chain_id = chain_id
    }
}

@json
export class VoteTendermint {
    type: i32 = 0 // SignedMsgType
    height: i64 = 0
    round: i64 = 0
    block_id: BlockIDProto
    timestamp: Date
    validator_address: Base64String = ""
    validator_index: i32 = 0
    constructor(
        type: i32,
        height: i64,
        round: i64,
        block_id: BlockIDProto,
        timestamp: Date,
        validator_address: Base64String,
        validator_index: i32,
    ) {
        this.type = type
        this.height = height
        this.round = round
        this.block_id = block_id
        this.timestamp = timestamp
        this.validator_address = validator_address
        this.validator_index = validator_index
    }
}

@json
export class Misbehavior {
    // TODO
}

@json
export class EvidenceData {
    evidence: Evidence[]
    constructor(evidence: Evidence[]) {
        this.evidence = evidence
    }
}

@json
export class Evidence {
    // TODO
}

@json
export class RequestPrepareProposal {
    // the modified transactions cannot exceed this size.
	max_tx_bytes: i64;
	txs: Array<Base64String>;
	local_last_commit: ExtendedCommitInfo;
	misbehavior: Misbehavior[];
	height: i64;
	time: string;
	next_validators_hash: Base64String;
	proposer_address: HexString;
    constructor(maxTxBytes: i64, txs: Array<Base64String>, localLastCommit: ExtendedCommitInfo, misbehavior: Misbehavior[], height: i64, time: string, nextValidatorsHash: Base64String, proposerAddress: HexString) {
        this.max_tx_bytes = maxTxBytes;
        this.txs = txs;
        this.local_last_commit = localLastCommit;
        this.misbehavior = misbehavior;
        this.height = height;
        this.time = time;
        this.next_validators_hash = nextValidatorsHash;
        this.proposer_address = proposerAddress;
    }
}

@json
export class ResponsePrepareProposal {
    txs: Array<Base64String>
    constructor(txs: Array<Base64String>) {
        this.txs = txs;
    }
}

// @ts-ignores
@json
export enum BlockIDFlag {
    Unknown = 0,
    Absent = 1,
    Commit = 2,
    Nil = 3
}

@json
export class Validator {
	address: Base64String // ConsAddress operator address in bytes
	power: i64
    constructor(address: Bech32String, power: i64) {
        this.address = address
        this.power = power
    }
}

@json
export class VoteInfo {
	validator:   Validator
	block_id_flag: BlockIDFlag
    constructor(validator: Validator, blockIdFlag: BlockIDFlag) {
        this.validator = validator
        this.block_id_flag = blockIdFlag
    }
}

@json
export class CommitInfo {
	round: i64
	votes: VoteInfo[]
    constructor(round: i64, votes: VoteInfo[]) {
        this.round = round
        this.votes = votes
    }
}

@json
export class RequestProcessProposal {
    txs: Array<Base64String>
	proposed_last_commit: CommitInfo
	misbehavior: Misbehavior[]
    // hash is the merkle root hash of the fields of the proposed block
    // block.Header.Hash()
	hash: Base64String
	height: i64
	time: string
	next_validators_hash: Base64String
    // address of the public key of the original proposer of the block.
	proposer_address: HexString
    constructor(txs: Array<Base64String>, proposedLastCommit: CommitInfo, misbehavior: Misbehavior[], hash: Base64String, height: i64, time: string, nextValidatorsHash: Base64String, proposerAddress: HexString) {
        this.txs = txs;
        this.proposed_last_commit = proposedLastCommit;
        this.misbehavior = misbehavior;
        this.hash = hash;
        this.height = height;
        this.time = time;
        this.next_validators_hash = nextValidatorsHash;
        this.proposer_address = proposerAddress;
    }
}

// @ts-ignores
@json
export enum ProposalStatus {
    UNKNOWN = 0,
    ACCEPT = 1,
    REJECT = 2
}

@json
export class ResponseProcessProposal {
    status: ProposalStatus = 0;
    constructor(status: ProposalStatus) {
        this.status = status;
    }
}

@json
export class ResponseOptimisticExecution {
    response: ResponseFinalizeBlock | null = null
    metainfo: Map<string,Base64String> = new Map<string,Base64String>()
    constructor(response: ResponseFinalizeBlock | null, metainfo: Map<string,Base64String>) {
        this.response = response
        this.metainfo = metainfo
    }
}

@json
export class RequestFinalizeBlock {
    txs: Array<Base64String>
	decided_last_commit: CommitInfo
	misbehavior: Misbehavior[]
	hash: Base64String
	height: i64
	time: string
	next_validators_hash: Base64String
	proposer_address: HexString
    constructor(txs: Array<Base64String>, decidedLastCommit: CommitInfo, misbehavior: Misbehavior[], hash: Base64String, height: i64, time: string, nextValidatorsHash: Base64String, proposerAddress: HexString) {
        this.txs = txs;
        this.decided_last_commit = decidedLastCommit;
        this.misbehavior = misbehavior;
        this.hash = hash;
        this.height = height;
        this.time = time;
        this.next_validators_hash = nextValidatorsHash;
        this.proposer_address = proposerAddress;
    }
}

@json
export class WrapRequestFinalizeBlock {
    request: RequestFinalizeBlock
    metainfo: Map<string, Base64String> = new Map<string, Base64String>()
    constructor(request: RequestFinalizeBlock, metainfo: Map<string, Base64String>) {
        this.request = request
        this.metainfo = metainfo;
    }
}

@json
export class RequestProcessProposalWithMetaInfo {
    request: RequestProcessProposal // same content as RequestFinalizeBloc
    optimistic_execution: boolean
    metainfo: Map<string, Base64String> = new Map<string, Base64String>()
    constructor(request: RequestProcessProposal, optimistic_execution: boolean, metainfo: Map<string, Base64String>) {
        this.request = request
        this.optimistic_execution = optimistic_execution
        this.metainfo = metainfo;
    }
}

@json
export class ExecTxResultExternal { // same as ResponseCheckTx
    code: u32 = 0
	data: Base64String = ""
	log: string = ""
	info: string = ""
	gas_wanted: string = ""
	gas_used: string = ""
	events: Event[] = []
	codespace: string = ""
    constructor(code: u32, data: Base64String, log: string, info: string, gas_wanted: string, gas_used: string, events: Event[], codespace: string) {
        this.code = code;
        this.data = data;
        this.log = log;
        this.info = info;
        this.gas_wanted = gas_wanted;
        this.gas_used = gas_used;
        this.events = events;
        this.codespace = codespace;
    }
}

@json
export class ExecTxResult { // same as ResponseCheckTx
    code: u32 = 0
	data: Base64String = ""
	log: string = ""
	info: string = ""
	gas_wanted: i64 = 0
	gas_used: i64 = 0
	events: Event[] = []
	codespace: string = ""
    constructor(code: u32, data: Base64String, log: string, info: string, gas_wanted: i64, gas_used: i64, events: Event[], codespace: string) {
        this.code = code;
        this.data = data;
        this.log = log;
        this.info = info;
        this.gas_wanted = gas_wanted;
        this.gas_used = gas_used;
        this.events = events;
        this.codespace = codespace;
    }

    @serializer
    serializer(self: ExecTxResult): string {
        return JSON.stringify<ExecTxResultExternal>(new ExecTxResultExternal(self.code, self.data, self.log, self.info, self.gas_wanted.toString(), self.gas_used.toString(), self.events, self.codespace))
    }

    @deserializer
    deserializer(data: string): ExecTxResult {
        const v = JSON.parse<ExecTxResultExternal>(data)
        const gw = u64(parseInt64(v.gas_wanted))
        const gu = u64(parseInt64(v.gas_used))
        return new ExecTxResult(v.code, v.data, v.log, v.info, gw, gu, v.events, v.codespace)
    }
}

@json
export class ExtensionOptionMultiChainTx {
    // option (gogoproto.goproto_getters) = false;
    chain_id: string
    index: i32 // index of this transaction in the atomic set
    tx_count: i32 // total transactions in the atomic set
    constructor(chain_id: string, index: i32, tx_count: i32) {
        this.chain_id = chain_id
        this.index = index
        this.tx_count = tx_count
    }
}

@json
export class  ExtensionOptionAtomicMultiChainTx {
    leader_chain_id: string;
    chain_ids: string[];
    constructor(leader_chain_id: string, chain_ids: string[]) {
        this.leader_chain_id = leader_chain_id
        this.chain_ids = chain_ids
    }

    static fromAnyWrap(value: AnyWrap): ExtensionOptionAtomicMultiChainTx {
        return JSON.parse<ExtensionOptionAtomicMultiChainTx>(String.UTF8.decode(base64.decode(value.value).buffer))
    }
}

@json
export class  ExtensionOptionEthereumTx {}

@json
export class ValidatorUpdate {
    pub_key: PublicKey | null = null
	power: i64
    constructor(pub_key: PublicKey | null, power: i64) {
        this.pub_key = pub_key;
        this.power = power;
    }
}

@json
export class ValidatorInfo {
    address: HexString
    pub_key: Base64String // crypto.PubKey
    voting_power: i64
    proposer_priority: i64
    constructor(address: HexString, pub_key: string, voting_power: i64, proposer_priority: i64) {
        this.address = address;
        this.pub_key = pub_key;
        this.voting_power = voting_power;
        this.proposer_priority = proposer_priority;
    }
}

@json
export class TendermintValidator {
    operator_address: Bech32String
    hex_address: HexString // // hex-format address derived from consensus public key
    pub_key: PublicKey | null = null
    voting_power: i64
    proposer_priority: i64
    constructor(operator_address: Bech32String, hex_address: HexString, pub_key: PublicKey | null, voting_power: i64, proposer_priority: i64) {
        this.operator_address = operator_address
        this.hex_address = hex_address;
        this.pub_key = pub_key;
        this.voting_power = voting_power;
        this.proposer_priority = proposer_priority;
    }
}

@json
export class TendermintValidators {
    validators: TendermintValidator[] = []
    constructor(validators: TendermintValidator[]) {
        this.validators = validators;
    }
}


@json
export class BlockParams {
    // Max block size, in bytes.
	// Note: must be greater than 0
	max_bytes: i64
	// Max gas per block.
	// Note: must be greater or equal to -1
	max_gas: i64
    constructor(max_bytes: i64, max_gas: i64) {
        this.max_bytes = max_bytes;
        this.max_gas = max_gas;
    }
}

@json
export class EvidenceParams {
    // Max age of evidence, in blocks.
	//
	// The basic formula for calculating this is: MaxAgeDuration / {average block
	// time}.
	max_age_num_blocks: i64 = 0
	// Max age of evidence, in time.
	//
	// It should correspond with an app's "unbonding period" or other similar
	// mechanism for handling [Nothing-At-Stake
	// attacks](https://github.com/ethereum/wiki/wiki/Proof-of-Stake-FAQ#what-is-the-nothing-at-stake-problem-and-how-can-it-be-fixed).
	max_age_duration: i64 = 0
	// This sets the maximum size of total evidence in bytes that can be committed in a single block.
	// and should fall comfortably under the max block bytes.
	// Default is 1048576 or 1MB
	max_bytes: i64 = 0
    constructor(max_age_num_blocks: i64, max_age_duration: i64, max_bytes: i64) {
        this.max_age_num_blocks = max_age_num_blocks;
        this.max_age_duration = max_age_duration;
        this.max_bytes = max_bytes;
    }
}

@json
export class ValidatorParams {
    pub_key_types: string[]
    constructor(pub_key_types: string[]) {
        this.pub_key_types = pub_key_types
    }
}

@json
export class VersionParams {
    app: u64
    constructor(app: u64) {
        this.app = app;
    }
}

@json
export class ABCIParams {
    vote_extensions_enable_height: i64
    constructor(vote_extensions_enable_height: i64) {
        this.vote_extensions_enable_height = vote_extensions_enable_height;
    }
}

@json
export class ConsensusParams {
    block: BlockParams
	evidence: EvidenceParams
	validator: ValidatorParams
	version: VersionParams
	abci: ABCIParams
    constructor(block: BlockParams, evidence: EvidenceParams, validator: ValidatorParams, version: VersionParams, abci: ABCIParams) {
        this.block = block
        this.evidence = evidence
        this.validator = validator
        this.version = version
        this.abci = abci
    }
}

@json
export class ResponseFinalizeBlock {
	events: Event[] = []
	tx_results: ExecTxResult[] = []
	validator_updates: ValidatorUpdate[] = []
	consensus_param_updates: ConsensusParams | null = null
	app_hash: Base64String = ""
    constructor(events: Event[], txResults: ExecTxResult[], validatorUpdates: ValidatorUpdate[], consensusParamUpdates: ConsensusParams | null, appHash: Base64String) {
        this.events = events;
        this.tx_results = txResults;
        this.validator_updates = validatorUpdates;
        this.consensus_param_updates = consensusParamUpdates;
        this.app_hash = appHash;
    }
}

@json
export class ResponseFinalizeBlockWrap {
    error: string
    data: ResponseFinalizeBlock | null
    constructor(error: string, data: ResponseFinalizeBlock | null) {
        this.error = error
        this.data = data
    }
}

@json
export class ResponseBeginBlock {
	events: Event[]
    constructor(events: Event[]) {
        this.events = events
    }
}

@json
export class ResponseBeginBlockWrap {
    error: string
    data: ResponseBeginBlock | null
    constructor(error: string, data: ResponseBeginBlock | null) {
        this.error = error
        this.data = data
    }
}

@json
export class ResponseCommit {
	retainHeight: i64;
    constructor(retainHeight: i64) {
        this.retainHeight = retainHeight;
    }
}

// @ts-ignores
@json
export enum CheckTxType {
    New = 0,
	Recheck = 1,
}

@json
export class RequestCheckTx {
    tx: Base64String;
	type: CheckTxType
    constructor(tx: Base64String, type: CheckTxType) {
        this.tx = tx;
        this.type = type;
    }
}

export enum CodeType {
    Ok = 0,
    EncodingError = 1,
    InvalidTxFormat = 2,
    Unauthorized = 3,
    Unused = 4, // cosmos omits this
    Executed = 5,
    // OutOfGas = 11, // TODO
}

// CodeTypeOK              uint32 = 0
// CodeTypeEncodingError   uint32 = 1
// CodeTypeInvalidTxFormat uint32 = 2
// CodeTypeUnauthorized    uint32 = 3
// CodeTypeExecuted        uint32 = 5

@json
export class ResponseCheckTx { // extends ExecTxResult {}// same as ResponseCheckTx
    code: u32 = 0
	data: Base64String = ""
	log: string = ""
	info: string = ""
	gas_wanted: i64 = 0
	gas_used: i64 = 0
	events: Event[] = []
	codespace: string = ""
    constructor(code: u32, data: Base64String, log: string, info: string, gas_wanted: i64, gas_used: i64, events: Event[], codespace: string) {
        this.code = code;
        this.data = data;
        this.log = log;
        this.info = info;
        this.gas_wanted = gas_wanted;
        this.gas_used = gas_used;
        this.events = events;
        this.codespace = codespace;
    }
}

@json
export class Transaction {
    gas: i32;
    constructor(gas: i32) {
        this.gas = gas;
    }
}

@json
export class TxResult {
	height: i64
	index: u32
	tx: Base64String
	result: ExecTxResult
    constructor(height: i64, index: u32, tx: Base64String, result: ExecTxResult) {
        this.height = height;
        this.index = index;
        this.tx = tx;
        this.result = result;
    }
}

@json
export class RequestInitChain {
	time: string
	chain_id: string
	consensus_params: ConsensusParams
	validators: ValidatorUpdate[]
	app_state_bytes: Base64String
	initial_height: i64
    constructor(time: string, chain_id: string, consensus_params: ConsensusParams, validators: ValidatorUpdate[], app_state_bytes: Base64String, initial_height: i64) {
        this.time = time
        this.chain_id = chain_id
        this.consensus_params = consensus_params
        this.validators = validators
        this.app_state_bytes = app_state_bytes
        this.initial_height = initial_height
    }
}

@json
export class ResponseInitChain {
	consensus_params: ConsensusParams
	validators: ValidatorUpdate[]
	app_hash: Base64String
    constructor(consensus_params: ConsensusParams, validators: ValidatorUpdate[], app_hash: Base64String) {
        this.consensus_params = consensus_params
        this.validators = validators
        this.app_hash = app_hash
    }
}

@json
export class InitChainSetup {
    chain_id: string
    version: Version
	consensus_params: ConsensusParams
	app_hash: Base64String
    last_results_hash: Base64String
    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String
    peers: string[]
    node_index: i32
    initial_ports: NodePorts
    constructor(chain_id: string, version: Version, consensus_params: ConsensusParams, app_hash: Base64String, last_results_hash: Base64String, validator_address: HexString, validator_privkey: Base64String, validator_pubkey: Base64String, peers: string[], node_index: i32, initial_ports: NodePorts) {
        this.chain_id = chain_id
        this.version = version
        this.consensus_params = consensus_params
        this.app_hash = app_hash
        this.last_results_hash = last_results_hash
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.peers = peers
        this.node_index = node_index
        this.initial_ports = initial_ports
    }
}

@json
export class RequestApplySnapshotChunk {}

@json
export class ResponseApplySnapshotChunk {}

@json
export class RequestLoadSnapshotChunk {}

@json
export class ResponseLoadSnapshotChunk {}

@json
export class RequestOfferSnapshot {}

@json
export class ResponseOfferSnapshot {}

@json
export class RequestListSnapshots {}

@json
export class ResponseListSnapshots {}

@json
export class ValidatorSet {
    validators: TendermintValidator[]
    proposer: TendermintValidator
    constructor(validators: TendermintValidator[], proposer: TendermintValidator) {
        this.validators = validators
        this.proposer = proposer
    }
}

@json
export class State {
    Version: Version
    ChainID: string
    InitialHeight: i64 // should be 1, not 0, when starting from height 1
    // LastBlockHeight=0 at genesis (ie. block(H=0) does not exist)
    LastBlockHeight: i64
    LastBlockID: BlockID
    LastBlockTime: Date

    // LastValidators is used to validate block.LastCommit.
    // Validators are persisted to the database separately every time they change,
    // so we can query for historical validator sets.
    // Note that if s.LastBlockHeight causes a valset change,
    // we set s.LastHeightValidatorsChanged = s.LastBlockHeight + 1 + 1
    // Extra +1 due to nextValSet delay.
    NextValidators: Base64String // base64 encoded ValidatorSet
    Validators: Base64String // base64 encoded ValidatorSet
    LastValidators: Base64String // base64 encoded ValidatorSet
    LastHeightValidatorsChanged: i64

    // Consensus parameters used for validating blocks.
    // Changes returned by FinalizeBlock and updated after Commit.
    ConsensusParams: ConsensusParams
    LastHeightConsensusParamsChanged: i64

    // Merkle root of the results from executing prev block
    LastResultsHash: Base64String

    // the latest AppHash we've received from calling abci.Commit()
    AppHash: Base64String
    constructor(
        Version: Version,
        ChainID: string,
        InitialHeight: i64,
        LastBlockHeight: i64,
        LastBlockID: BlockID,
        LastBlockTime:  Date,
        NextValidators: Base64String,
        Validators: Base64String,
        LastValidators: Base64String,
        LastHeightValidatorsChanged: i64,
        ConsensusParams: ConsensusParams,
        LastHeightConsensusParamsChanged: i64,
        LastResultsHash: Base64String,
        AppHash: Base64String,
    ) {
        this.Version = Version
        this.ChainID = ChainID
        this.InitialHeight = InitialHeight
        this.LastBlockHeight = LastBlockHeight
        this.LastBlockID = LastBlockID
        this.LastBlockTime = LastBlockTime
        this.NextValidators = NextValidators
        this.Validators = Validators
        this.LastValidators = LastValidators
        this.LastHeightValidatorsChanged = LastHeightValidatorsChanged
        this.ConsensusParams = ConsensusParams
        this.LastHeightConsensusParamsChanged = LastHeightConsensusParamsChanged
        this.LastResultsHash = LastResultsHash
        this.AppHash = AppHash
    }
}
