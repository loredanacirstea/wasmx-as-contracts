export const MODULE_NAME = "tendermint"
export const VERSION = "tendermint_p2p_1"
export const PROTOCOL_ID = "tendermintp2p_1"

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
export const VALIDATOR_NODES_INFO = "validatorNodesInfo";
export const SIMPLE_NODES_INFO = "simpleNodesInfo";
export const CURRENT_NODE_ID = "currentNodeId";
export const ELECTION_TIMEOUT_KEY = "electionTimeout";
export const TERM_ID = "currentTerm"; // current round
export const PREVOTE_ARRAY = "prevoteArray";
export const PRECOMMIT_ARRAY = "precommitArray";

export const NODE_UPDATE_REMOVE = 0
export const NODE_UPDATE_ADD = 1
export const NODE_UPDATE_UPDATE = 2

export const STAKE_REDUCTION: u64 = 1000000000000

// export const CHAT_ROOM_MEMPOOL =  "chat_room_mempool"
// export const CHAT_ROOM_BLOCK_PROPOSAL =  "chat_room_block_proposal"
// export const CHAT_ROOM_PREVOTE = "chat_room_prevote"
// export const CHAT_ROOM_PRECOMMIT = "chat_room_precommit"
// export const CHAT_ROOM_NODEINFO = "chat_room_nodeinfo"


export const CHAT_ROOM_PROTOCOL = "chat_room_protocol"
export const CHAT_ROOM_MEMPOOL =  CHAT_ROOM_PROTOCOL
export const CHAT_ROOM_BLOCK_PROPOSAL =  CHAT_ROOM_PROTOCOL
export const CHAT_ROOM_PREVOTE = CHAT_ROOM_PROTOCOL
export const CHAT_ROOM_PRECOMMIT = CHAT_ROOM_PROTOCOL
export const CHAT_ROOM_NODEINFO = CHAT_ROOM_PROTOCOL
export const CHAT_ROOM_CROSSCHAIN_MEMPOOL = "chat_room_crosschain_mempool"
