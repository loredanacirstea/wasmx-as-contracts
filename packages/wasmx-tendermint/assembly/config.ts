export const ROUND_TIMEOUT = "roundTimeout";

//// Cosmos-specific
export const MEMPOOL_KEY = "mempool";
export const MAX_TX_BYTES = "max_tx_bytes";

//// blockchain
export const STATE_KEY = "state";

// const

export const LOG_START = 1;
export const STATE_SYNC_BATCH = 200;
export const ERROR_INVALID_TX = "transaction is invalid";

//// blockchain constants
// MaxBlockSizeBytes is the maximum permitted size of the blocks.
export const MaxBlockSizeBytes = 104857600 // 100MB
// BlockPartSizeBytes is the size of one block part.
export const BlockPartSizeBytes: u32 = 65536 // 64kB
// MaxBlockPartsCount is the maximum number of block parts.
export const MaxBlockPartsCount = (MaxBlockSizeBytes / BlockPartSizeBytes) + 1

/// Context values
export const NODE_IPS = "validatorNodesInfo";
export const CURRENT_NODE_ID = "currentNodeId";
export const ELECTION_TIMEOUT_KEY = "electionTimeout";
export const TERM_ID = "currentTerm"; // current round
export const NEXT_INDEX_ARRAY = "nextIndex";
export const MATCH_INDEX_ARRAY = "matchIndex";

export const NODE_UPDATE_REMOVE = 0
export const NODE_UPDATE_ADD = 1
export const NODE_UPDATE_UPDATE = 2

export const STAKE_REDUCTION: u64 = 1000000000000
