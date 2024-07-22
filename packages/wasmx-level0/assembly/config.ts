export const MODULE_NAME = "level0"
export const VERSION = "level0_0"
export const PROTOCOL_ID = "level0_0"

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
export const VALIDATOR_NODES_INFO = "validatorNodesInfo";
export const SIMPLE_NODES_INFO = "simpleNodesInfo";
export const CURRENT_NODE_ID = "currentNodeId";
export const ELECTION_TIMEOUT_KEY = "electionTimeout";
export const TERM_ID = "currentTerm"; // current round
export const PREVOTE_ARRAY = "prevoteArray";
export const PRECOMMIT_ARRAY = "precommitArray";

export const STAKE_REDUCTION: u64 = 1000000000000
