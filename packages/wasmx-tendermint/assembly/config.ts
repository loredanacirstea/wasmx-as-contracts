export const ROUND_TIMEOUT = "roundTimeout";

//// Cosmos-specific
export const MEMPOOL_KEY = "mempool";
export const MAX_TX_BYTES = "max_tx_bytes";

//// blockchain
export const VALIDATORS_KEY = "validators";
export const STATE_KEY = "state";

// const

export const LOG_START = 1;
export const STATE_SYNC_BATCH = 200;
export const ERROR_INVALID_TX = "transaction is invalid";
export const MAX_LOGGED = 2000;
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

/// Context values
export const NODE_IPS = "nodeIPs";
export const CURRENT_NODE_ID = "currentNodeId";
export const ELECTION_TIMEOUT_KEY = "electionTimeout";
export const TERM_ID = "currentTerm"; // current round
export const NEXT_INDEX_ARRAY = "nextIndex";
export const MATCH_INDEX_ARRAY = "matchIndex";

export const NODE_UPDATE_REMOVE = 0
export const NODE_UPDATE_ADD = 1
export const NODE_UPDATE_UPDATE = 2
