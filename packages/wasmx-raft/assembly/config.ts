// start at 0 TODO?
export const LOG_START = 1;
export const STATE_SYNC_BATCH = 200;
export const ERROR_INVALID_TX = "transaction is invalid";
export const MAX_LOGGED = 2000;

// LEADER:
// new tx -> check tx -> add to mempool
// proposeBlock -> mempool batch -> startBlockProposal -> propose block -> process block -> save to logs
// commitBlocks -> startBlockFinalization -> finalize block -> commit -> save to logs + index transactions
// commitBlocks ->


// ABCISemVer is the semantic version of the ABCI protocol
export const ABCISemVer  = "2.0.0"
export const ABCIVersion = ABCISemVer
// P2PProtocol versions all p2p behavior and msgs.
// This includes proposer selection.
export const P2PProtocol: u64 = 8
// BlockProtocol versions all block data structures and processing.
// This includes validity of blocks and state updates.
export const BlockProtocol: u64 = 12;


//// blockchain constants
// MaxBlockSizeBytes is the maximum permitted size of the blocks.
export const MaxBlockSizeBytes = 104857600 // 100MB

// BlockPartSizeBytes is the size of one block part.
export const BlockPartSizeBytes: u32 = 65536 // 64kB

// MaxBlockPartsCount is the maximum number of block parts.
export const MaxBlockPartsCount = (MaxBlockSizeBytes / BlockPartSizeBytes) + 1

export const NODE_UPDATE_REMOVE = 0
export const NODE_UPDATE_ADD = 1
export const NODE_UPDATE_UPDATE = 2

/// storage
/// Context values
export const NODE_IPS = "validatorNodesInfo";
export const CURRENT_NODE_ID = "currentNodeId";
export const HEARTBEAT_TIMEOUT = "heartbeatTimeout";
export const ELECTION_TIMEOUT_KEY = "electionTimeout";

//// Persistent state on all servers:
export const TERM_ID = "currentTerm";
export const VOTED_FOR_KEY = "votedFor"
// log[]

//// Volatile state on all servers:
// index of highest log entry applied to state machine (initialized to 0, increases monotonically)
export const LAST_APPLIED = "lastApplied";
// index of highest log entry known to be committed (initialized to 0, increases monotonically)
export const COMMIT_INDEX = "commitIndex";

//// Volatile state on leaders
// for each server, index of highest log entry known to be replicated on server (initialized to 0, increases monotonically)
export const MATCH_INDEX_ARRAY = "matchIndex";
// for each server, index of the next log entry to send to that server (initialized to leader last log index + 1)
export const NEXT_INDEX_ARRAY = "nextIndex";
export const VOTE_INDEX_ARRAY = "voteIndex";

//// Cosmos-specific
export const MEMPOOL_KEY = "mempool";
export const MAX_TX_BYTES = "max_tx_bytes";

// index of log entry immediately preceding new ones
// const PREV_LOG_INDEX = "prevLogIndex";

//// blockchain
export const STATE_KEY = "state";
