export const ROUNDS_KEY = "rounds"
export const SAMPLE_SIZE_KEY = "sampleSize"
export const ROUNDS_COUNTER_KEY = "roundsCounter"
export const ALPHA_THRESHOLD_KEY = "alphaThreshold"
export const BETA_THRESHOLD_KEY = "betaThreshold"
export const CONFIDENCE_KEY = "confidence_"
export const CONFIDENCES_KEY = "confidences"
export const PROPOSED_HASH_KEY = "proposedHash"
export const PROPOSED_HEADER_KEY = "proposedHeader"
export const PROPOSED_BLOCK_KEY = "proposedBlock"
export const BLOCKS_KEY = "tempblocks"
export const MAJORITY_KEY = "majority"
export const MAJORITY_COUNT_KEY = "majority_count"

//// Cosmos-specific
export const MEMPOOL_KEY = "mempool";
export const MAX_TX_BYTES = "max_tx_bytes";

//// blockchain
export const VALIDATORS_KEY = "validators";
export const STATE_KEY = "state";


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
export const NEXT_INDEX_ARRAY = "nextIndex";
export const MATCH_INDEX_ARRAY = "matchIndex";

export const NODE_UPDATE_REMOVE = 0
export const NODE_UPDATE_ADD = 1
export const NODE_UPDATE_UPDATE = 2
