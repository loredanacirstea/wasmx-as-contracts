import { raise } from './utils.js';

export const machineConfigSemaphore = {
    id: "Semaphore",
    initial: "uninitialized",
    context: [],
    states: [
        {
            name: "uninitialized",
            on: [
              {
                name: "initialize",
                transitions: [{
                  target: "#Semaphore.red",
                  guard: null,
                  actions: [],
                }]
              }
            ],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
        {
            name: "red",
            on: [
              {
                name: "next",
                transitions: [{
                    target: "#Semaphore.blue",
                    guard: null,
                    actions: [],
                }],
              },
            ],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
        {
            name: "blue",
            on: [
              {
                  name: "next",
                  transitions: [{
                    target: "#Semaphore.red",
                    guard: null,
                    actions: [],
                  }]
              },
            ],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
    ],
}

export const machineConfig2 = {
    id: "Lock/unlock",
    initial: "uninitialized",
    context: [{key: "counter", value: "0"}],
    states: [
        {
            name: "uninitialized",
            on: [{
                name: "initialize",
                target: "#Lock/unlock.unlocked",
                guard: null,
                    actions: [],
            }],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
        {
            name: "unlock",
            on: [
                {
                    name: "lock",
                    target: "#Lock/unlock.lock",
                    guard: null,
                    actions: [],
                },
                {
                    name: "set",
                    target: "",
                    guard: null,
                    actions: [
                        {
                            value: "counter",
                            action: {type: "assign", args: ["counter"]},
                        }
                    ],
                },
                {
                    name: "increment",
                    target: "",
                    guard: null,
                    actions: [
                        {
                            value: "counter",
                            action: {type: "increment"},
                        }
                    ],
                },
            ],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
        {
            name: "lock",
            on: [
                {
                    name: "unlock",
                    target: "#Lock/unlock.unlock",
                    guard: null,
                    actions: [],
                },
            ],
            always: [],
            after: [],
            exit: [],
            entry: [],
            initial: "",
            states: [],
        },
    ],
}

export const machineConfig2Orig = {
    context: {
      counter: "0",
    },
    id: "lock-count",
    initial: "uninitialized",
    states: {
        uninitialized: {
            on: {
              initialize: {
                target: "unlocked",
              },
            },
        },
      unlocked: {
        on: {
          lock: {
            target: "locked",
          },
          increment: {
            target: "unlocked",
            actions: {
              type: "increment",
              params: {
                counter: "1",
              },
            },
          },
        },
      },
      locked: {
        on: {
          unlock: {
            target: "unlocked",
          },
        },
      },
    },
}

export const machineConfig3Orig = {
    context: {
      counter: "0",
    },
    id: "Untitled",
    initial: "uninitialized",
    states: {
        uninitialized: {
            on: {
              initialize: {
                target: "unlocked",
              },
            },
        },
      unlocked: {
        on: {
          lock: {
            target: "locked",
          },
          increment: {
            target: "unlocked",
            actions: [
              {
                type: "increment",
                params: {
                  counter: "2",
                },
              },
              {
                type: "log",
                params: {
                  counter: "",
                },
                expr: "",
              },
            ],
          },
        },
      },
      locked: {
        on: {
          unlock: {
            target: "unlocked",
          },
        },
      },
    },
}

export const machineWithGuard = {
    context: {
      counter: "0",
    },
    id: "lock-count-guard",
    initial: "uninitialized",
    states: {
        uninitialized: {
            on: {
              initialize: {
                target: "unlocked",
              },
            },
        },
      unlocked: {
        on: {
          lock: {
            target: "locked",
          },
          increment: {
            target: "unlocked",
            guard: {type: "isAdmin", params: []},
            actions: {
              type: "increment",
              params: {
                counter: "1",
              },
            },
          },
        },
      },
      locked: {
        on: {
          unlock: {
            target: "unlocked",
          },
        },
      },
    }
}

export const machineWithCtx = {
  id: "tempctx",
  initial: "uninitialized",
  states: {
    uninitialized: {
      on: {
        initialize: {
          target: "initialized",
        },
      },
    },
    initialized: {
      initial: "validator",
      states: {
        validator: {
          on: {
            query: {
              target: "proposer",
              actions: [
                {
                  type: "assign",
                  params: {
                    proposedHash: "$hash",
                  },
                },
                {
                  type: "log",
                  params: {
                    hash: "$proposedHash",
                  },
                },
              ],
            },
          },
        },
        proposer: {
          entry: {
            type: "assign",
            params: {
              majority: 4,
            },
          },
          always: {
            target: "validator",
            actions: {
              type: "log",
              params: {
                majority: "$majority",
              },
            },
          },
        },
      },
    },
  }
}

export const erc20Machine1Orig = {
    context: {
      admin: "",
      supply: "0",
      tokenName: "",
      tokenSymbol: "",
    },
    id: "ERC20",
    initial: "uninitialized",
    states: {
      uninitialized: {
        on: {
          initialize: {
            target: "unlocked",
          },
        },
      },
      unlocked: {
        initial: "active",
        states: {
          active: {
            on: {
              transfer: {
                target: "intransfer",
                actions: raise({ from: "getCaller()", to: "to", amount: "amount", type: "move" }),
              },
              mint: {
                target: "active",
                guard: {type: "isAdmin", params: []},
                actions: {
                  type: "mint",
                },
              },
              approve: {
                target: "active",
                actions: {
                  type: "approve",
                },
              },
              transferFrom: {
                target: "intransfer",
                guard: {type: "hasEnoughAllowance", params: []},
                actions: raise({ from: "from", to: "to", amount: "amount", type: "move" }),
              },
            },
          },
          intransfer: {
            initial: "unmoved",
            states: {
              unmoved: {
                on: {
                  move: {
                    target: "moved",
                    guard: {type: "hasEnoughBalance", params: []},
                    actions: [
                      {
                        type: "move",
                      },
                      {
                        type: "logTransfer",
                      },
                      raise({ type: "finish" }),
                    ],
                  },
                },
              },
              moved: {
                on: {
                  finish: {
                    target: "#ERC20.unlocked.active",
                  },
                },
              },
            },
          },
        },
        on: {
          lock: {
            target: "locked",
            guard: {type: "isAdmin", params: []},
          },
        },
      },
      locked: {
        on: {
          unlock: {
            target: "unlocked",
            guard: {type: "isAdmin", params: []},
          },
        },
      },
    }
}

export const consensusSMConfigOrig = {
  id: "AB-Req-Res",
  initial: "uninitialized",
  context: {},
  states: {
    uninitialized: {
      on: {
        initialize: {
          target: "active",
        },
      },
    },
    active: {
      on: {
        sendRequest: {
          target: "ISentTheRequest",
          actions: {
            type: "sendRequest",
          },
        },
        receiveRequest: {
          target: "IReceivedTheRequest",
        },
      },
    },
    ISentTheRequest: {
      on: {
        reset: {
          target: "uninitialized",
        },
      },
    },
    IReceivedTheRequest: {
      on: {
        reset: {
          target: "uninitialized",
        },
      },
    },
  }
}

export const consensusSMTimerConfigOrig = {
    context: {
      data: "aGVsbG8=",
      address: "0.0.0.0:8091",
    },
    id: "AB-Req-Res-timer",
    initial: "uninitialized",
    states: {
      uninitialized: {
        on: {
          initialize: {
            target: "active",
          },
        },
      },
      active: {
        on: {
          receiveRequest: {
            target: "received",
          },
          send: {
            target: "sender",
          },
        },
      },
      received: {
        after: {
          "1000": {
            target: "#AB-Req-Res-timer.active",
            actions: [],
            meta: {},
          },
        },
      },
      sender: {
        after: {
          "5000": {
            target: "#AB-Req-Res-timer.sending",
            actions: [raise({ data: "data", type: "sendRequest", address: "address" })],
            meta: {},
          },
        },
      },
      sending: {
        on: {
          sendRequest: {
            target: "sender",
            actions: {
              type: "sendRequest",
            },
          },
        },
      },
    }
}

export const RAFTLogReplication = {
    context: {
      log: "",
      nodeIPs: "[]",
      nextIndex: "[]",
      matchIndex: "[]",
      commitIndex: "",
      currentTerm: "0",
      lastApplied: "",
      max_tx_bytes: "65536",
      prevLogIndex: "0",
      currentNodeId: "0",
      max_block_gas: "20000000",
      heartbeatTimeout: 5000,
    },
    id: "RAFT-LogReplication",
    initial: "uninitialized",
    states: {
      uninitialized: {
        on: {
          initialize: {
            target: "initialized",
          },
        },
      },
      initialized: {
        initial: "Follower",
        states: {
          Follower: {
            on: {
              change: {
                target: "Candidate",
              },
              receiveHeartbeat: {
                target: "Follower",
                actions: [
                  {
                    type: "processAppendEntries",
                  },
                  {
                    type: "sendHeartbeatResponse",
                  },
                ],
              },
              setupNode: {
                target: "Follower",
                actions: {
                  type: "setupNode",
                },
              },
            },
          },
          Candidate: {
            on: {
              change: {
                target: "Leader",
              },
            },
          },
          Leader: {
            entry: [
              {
                type: "initializeNextIndex",
              },
              {
                type: "initializeMatchIndex",
              },
            ],
            initial: "active",
            states: {
              active: {
                entry: [
                  {
                    type: "sendAppendEntries",
                  },
                  {
                    type: "proposeBlock",
                  },
                  {
                    type: "commitBlocks",
                  },
                ],
                after: {
                  heartbeatTimeout: {
                    target: "#RAFT-LogReplication.initialized.Leader.active",
                    actions: [],
                    meta: {},
                  },
                },
                on: {
                  newTransaction: {
                    actions: [
                      {
                        type: "addToMempool",
                      },
                      {
                        type: "sendNewTransactionResponse",
                      },
                    ],
                  },
                  heartbeatResponse: {
                    target: "active",
                    actions: [
                      {
                        type: "updateNextIndex",
                      },
                      {
                        type: "updateMatchIndex",
                      },
                      {
                        type: "commitTransaction",
                      },
                    ],
                  },
                  start: {
                    target: "active",
                  },
                },
              },
            },
            on: {
              change: {
                target: "Follower",
              },
            },
          },
        },
        on: {
          start: {},
        },
      },
    },
}

export const RAFT_Full =  {
  context: {
    log: "",
    nodeIPs: "[]",
    votedFor: "0",
    nextIndex: "[]",
    matchIndex: "[]",
    commitIndex: "0",
    currentTerm: "0",
    lastApplied: "0",
    blockTimeout: "heartbeatTimeout",
    max_tx_bytes: "65536",
    prevLogIndex: "0",
    currentNodeId: "0",
    electionReset: "0",
    max_block_gas: "20000000",
    electionTimeout: "0",
    maxElectionTime: "20000",
    minElectionTime: "10000",
    heartbeatTimeout: "5000",
  },
  id: "RAFT-FULL-1",
  initial: "uninitialized",
  states: {
    uninitialized: {
      on: {
        initialize: {
          target: "initialized",
        },
      },
    },
    initialized: {
      initial: "unstarted",
      states: {
        unstarted: {
          on: {
            setupNode: {
              target: "unstarted",
              actions: {
                type: "setupNode",
              },
            },
            start: {
              target: "Follower",
            },
            setup: {
              target: "unstarted",
              actions: {
                type: "setup",
              },
            },
            prestart: {
              target: "prestart",
            },
          },
        },
        Follower: {
          entry: [
            {
              type: "registeredCheck",
            },
            {
              type: "setRandomElectionTimeout",
              params: {
                min: "$minElectionTime",
                max: "$maxElectionTime",
              },
            },
            {
              type: "cancelActiveIntervals",
              params: {
                after: "electionTimeout",
              },
            },
          ],
          after: {
            electionTimeout: {
              target: "#RAFT-FULL-1.initialized.Candidate",
              actions: [],
              meta: {},
            },
            heartbeatTimeout: {
              actions: [
                {
                  type: "forwardTxsToLeader",
                },
              ],
              meta: {},
            },
          },
          on: {
            receiveHeartbeat: {
              target: "Follower",
              actions: [
                {
                  type: "processAppendEntries",
                },
                {
                  type: "sendHeartbeatResponse",
                },
              ],
            },
            receiveVoteRequest: {
              target: "Follower",
              actions: {
                type: "vote",
              },
            },
            newTransaction: {
              actions: [
                {
                  type: "addToMempool",
                },
                {
                  type: "sendNewTransactionResponse",
                },
              ],
            },
            stop: {
              target: "#RAFT-FULL-1.stopped",
            },
            start: {
              target: "Follower",
            },
          },
        },
        prestart: {
          after: {
            "500": {
              target: "#RAFT-FULL-1.initialized.Follower",
              actions: [],
              meta: {},
            },
          },
        },
        Candidate: {
          entry: [
            {
              type: "incrementCurrentTerm",
            },
            {
              type: "selfVote",
            },
            {
              type: "setRandomElectionTimeout",
              params: {
                min: "$minElectionTime",
                max: "$maxElectionTime",
              },
            },
            {
              type: "sendVoteRequests",
            },
          ],
          always: [
            {
              target: "Leader",
              guard: {type: "isVotedLeader", params: []},
            },
            {
              target: "Follower",
            },
          ],
          on: {
            receiveHeartbeat: {
              target: "Follower",
              actions: [
                {
                  type: "processAppendEntries",
                },
                {
                  type: "sendHeartbeatResponse",
                },
              ],
            },
            newTransaction: {
              actions: [
                {
                  type: "addToMempool",
                },
                {
                  type: "sendNewTransactionResponse",
                },
              ],
            },
            stop: {
              target: "#RAFT-FULL-1.stopped",
            },
            start: {
              target: "Candidate",
            },
          },
        },
        Leader: {
          entry: [
            {
              type: "initializeNextIndex",
            },
            {
              type: "initializeMatchIndex",
            },
          ],
          initial: "active",
          states: {
            active: {
              entry: [
                {
                  type: "proposeBlock",
                },
                {
                  type: "sendAppendEntries",
                },
                {
                  type: "commitBlocks",
                },
              ],
              after: {
                heartbeatTimeout: {
                  target: "#RAFT-FULL-1.initialized.Leader.active",
                  actions: [],
                  meta: {},
                },
              },
              on: {
                newTransaction: {
                  actions: [
                    {
                      type: "addToMempool",
                    },
                    {
                      type: "sendNewTransactionResponse",
                    },
                  ],
                },
                start: {
                  target: "active",
                },
                updateNode: {
                  actions: {
                    type: "updateNodeAndReturn",
                  },
                },
              },
            },
          },
          on: {
            reset: {
              target: "Follower",
            },
            stop: {
              target: "#RAFT-FULL-1.stopped",
            },
          },
        },
      },
      on: {
        start: {},
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#RAFT-FULL-1.initialized.unstarted",
        },
      },
    },
  }
}

export var TENDERMINT_1 = {
  context: {
    log: "",
    nodeIPs: "[]",
    votedFor: "0",
    nextIndex: "[]",
    currentTerm: "0",
    blockTimeout: "roundTimeout",
    max_tx_bytes: "65536",
    roundTimeout: 10000,
    currentNodeId: "0",
    max_block_gas: "20000000",
  },
  id: "Tendermint_0",
  initial: "uninitialized",
  states: {
    uninitialized: {
      on: {
        initialize: {
          target: "initialized",
        },
      },
    },
    initialized: {
      initial: "unstarted",
      states: {
        unstarted: {
          on: {
            setupNode: {
              target: "unstarted",
              actions: {
                type: "setupNode",
              },
            },
            prestart: {
              target: "prestart",
            },
            setup: {
              target: "unstarted",
              actions: {
                type: "setup",
              },
            },
            start: {
              target: "Validator",
            },
          },
        },
        prestart: {
          after: {
            "500": {
              target: "#Tendermint_0.initialized.Validator",
              actions: [],
              meta: {},
            },
          },
        },
        Validator: {
          entry: [
            {
              type: "registeredCheck",
            },
            {
              type: "cancelActiveIntervals",
              params: {
                after: "roundTimeout",
              },
            },
            {
              type: "incrementCurrentTerm",
            },
            {
              type: "initializeNextIndex",
            },
          ],
          after: {
            roundTimeout: {
              target: "#Tendermint_0.initialized.Validator",
              actions: [],
              meta: {},
            },
          },
          always: {
            target: "Proposer",
            guard: {type: "isNextProposer", params: []},
          },
          on: {
            receiveProposal: {
              actions: [
                {
                  type: "processBlock",
                },
                {
                  type: "sendProposalResponse",
                },
              ],
            },
            newTransaction: {
              actions: [
                {
                  type: "addToMempool",
                },
                {
                  type: "sendNewTransactionResponse",
                },
              ],
            },
            stop: {
              target: "#Tendermint_0.stopped",
            },
            start: {
              target: "Validator",
            },
            receivePrecommit: {
              actions: [
                {
                  type: "commitBlock",
                },
                {
                  type: "sendPrecommitResponse",
                },
              ],
            },
          },
        },
        Proposer: {
          initial: "active",
          states: {
            active: {
              entry: [
                {
                  type: "cancelActiveIntervals",
                  params: {
                    after: "roundTimeout",
                  },
                },
                {
                  type: "proposeBlock",
                },
                {
                  type: "sendAppendEntries",
                },
                {
                  type: "commitBlocks",
                },
              ],
              after: {
                roundTimeout: {
                  target: "#Tendermint_0.initialized.Validator",
                  actions: [],
                  meta: {},
                },
              },
              on: {
                newTransaction: {
                  actions: [
                    {
                      type: "addToMempool",
                    },
                    {
                      type: "sendNewTransactionResponse",
                    },
                  ],
                },
                start: {
                  target: "active",
                },
                updateNode: {
                  actions: {
                    type: "updateNodeAndReturn",
                  },
                },
                receiveProposal: {
                  target: "#Tendermint_0.initialized.Validator",
                  actions: [
                    {
                      type: "processBlock",
                    },
                    {
                      type: "sendProposalResponse",
                    },
                    {
                      type: "cancelActiveIntervals",
                      params: {
                        after: "roundTimeout",
                      },
                    },
                  ],
                },
              },
            },
          },
          on: {
            stop: {
              target: "#Tendermint_0.stopped",
            },
          },
        },
      },
      on: {
        start: {},
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#Tendermint_0.initialized.unstarted",
        },
      },
    },
  }
}

export const AVA_SNOWMAN = {
  context: {
    sampleSize: "2",
    betaThreshold: 2,
    roundsCounter: "0",
    alphaThreshold: 80,
  },
  id: "general_4_Snowman-BFT_2",
  initial: "uninitialized",
  states: {
    uninitialized: {
      on: {
        initialize: {
          target: "initialized",
        },
      },
    },
    initialized: {
      initial: "unstarted",
      states: {
        unstarted: {
          on: {
            start: {
              target: "validator",
            },
            setupNode: {
              target: "unstarted",
              actions: {
                type: "setupNode",
              },
            },
            setup: {
              target: "unstarted",
              actions: {
                type: "setup",
              },
            },
            prestart: {
              target: "prestart",
            },
          },
        },
        validator: {
          entry: [
            {
              type: "resetRoundsCounter",
            },
            {
              type: "resetConfidences",
            },
          ],
          on: {
            newTransaction: {
              target: "proposer",
              actions: {
                type: "proposeBlock",
                params: {
                  transaction: "$transaction",
                },
              },
            },
            query: [
              {
                target: "preProposer",
                guard: {type: "ifBlockNotFinalized", params: []},
                actions: [
                  {
                    type: "setProposedBlock",
                    params: {
                      block: "$block",
                      header: "$header",
                    },
                  },
                  {
                    type: "sendResponse",
                    params: {
                      block: "$block",
                      header: "$header",
                    },
                  },
                ],
              },
              {
                target: "validator",
                actions: {
                  type: "sendResponse",
                },
              },
            ],
            stop: {
              target: "stopped",
            },
          },
        },
        prestart: {
          after: {
            "500": {
              target: "#general_4_Snowman-BFT_2.initialized.validator",
              actions: [],
              meta: {},
            },
          },
        },
        proposer: {
          entry: {
            type: "majorityFromRandomSet",
            params: {
              k: "$sampleSize",
            },
          },
          always: [
            {
              target: "proposer",
              guard: "ifMajorityLTAlphaThreshold",
              actions: {
                type: "resetRoundsCounter",
                params: {
                  roundsCounter: 0,
                },
              },
            },
            {
              target: "limboProposer",
              guard: "ifMajorityIsOther",
              actions: [
                {
                  type: "resetRoundsCounter",
                  params: {
                    roundsCounter: 0,
                  },
                },
                {
                  type: "incrementConfidence",
                  params: {
                    hash: "$majority",
                  },
                },
              ],
            },
            {
              target: "proposer",
              guard: "ifIncrementedCounterLTBetaThreshold",
              actions: {
                type: "incrementRoundsCounter",
              },
            },
            {
              target: "validator",
              actions: {
                type: "finalizeBlock",
              },
            },
          ],
          on: {
            query: {
              actions: {
                type: "sendResponse",
                params: {
                  block: "$proposedBlock",
                  header: "$proposedHeader",
                },
              },
            },
            stop: {
              target: "stopped",
            },
          },
        },
        preProposer: {
          after: {
            "500": {
              target: "#general_4_Snowman-BFT_2.initialized.proposer",
              actions: [],
              meta: {},
            },
          },
          on: {
            query: {
              actions: {
                type: "sendResponse",
                params: {
                  block: "$proposedBlock",
                  header: "$proposedHeader",
                },
              },
            },
          },
        },
        stopped: {
          on: {
            restart: {
              target: "unstarted",
            },
          },
        },
        limboProposer: {
          always: [
            {
              target: "proposer",
              guard: "ifMajorityConfidenceGTCurrent",
              actions: {
                type: "changeProposedBlock",
                params: {
                  hash: "$majority",
                },
              },
            },
            {
              target: "proposer",
              guard: "ifIncrementedCounterLTBetaThreshold",
              actions: {
                type: "incrementRoundsCounter",
              },
            },
            {
              target: "validator",
              actions: {
                type: "finalizeBlock",
              },
            },
          ],
        },
      },
    },
  }
}

export const RAFT_P2P = {"context":{"log":"","votedFor":"0","nextIndex":"[]","matchIndex":"[]","commitIndex":"0","currentTerm":"0","lastApplied":"0","blockTimeout":"heartbeatTimeout","max_tx_bytes":"65536","prevLogIndex":"0","currentNodeId":"0","electionReset":"0","max_block_gas":"20000000","electionTimeout":"0","maxElectionTime":"20000","minElectionTime":"10000","heartbeatTimeout":"5000","validatorNodesInfo":"[]"},"id":"RAFT-P2P-2","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"start":{"target":"started","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"connectNodeRoom"},{"type":"requestBlockSync"}]},"setup":{"target":"unstarted","actions":{"type":"setup"}},"prestart":{"target":"prestart"}}},"started":{"initial":"Node","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}],"guard":{"type":"ifNewTransaction"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}}},"states":{"Node":{"on":{"becomeValidator":{"target":"Validator","actions":[{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveHeartbeat":{"actions":{"type":"processAppendEntries"}},"start":{"actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"connectNodeRoom"},{"type":"requestBlockSync"}]},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"receiveCommit":{"actions":{"type":"receiveCommit"}}},"always":{"target":"Validator","actions":{"type":"registerValidatorWithNetwork"},"guard":{"type":"ifNodeIsValidator"}}},"Validator":{"initial":"Follower","states":{"Follower":{"on":{"receiveHeartbeat":{"target":"Follower","actions":[{"type":"processAppendEntries"},{"type":"sendHeartbeatResponse"}]},"receiveVoteRequest":{"target":"Follower","actions":{"type":"vote"}},"stop":{"target":"#RAFT-P2P-2.stopped"},"start":{"target":"Follower","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"updateNode":{"actions":{"type":"forwardMessageToLeader"}},"receiveAppendEntryResponse":{"actions":{"type":"forwardMessageToLeader"}}},"after":{"electionTimeout":{"target":"Candidate"},"heartbeatTimeout":{"actions":{"type":"forwardTxsToLeader"}}},"entry":[{"type":"setRandomElectionTimeout","params":{"max":"$maxElectionTime","min":"$minElectionTime"}},{"type":"cancelActiveIntervals","params":{"after":"electionTimeout"}}]},"Candidate":{"on":{"receiveHeartbeat":{"target":"Follower","actions":[{"type":"processAppendEntries"},{"type":"sendHeartbeatResponse"}]},"stop":{"target":"#RAFT-P2P-2.stopped"},"start":{"target":"Candidate","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveVoteResponse":{"actions":{"type":"receiveVoteResponse"}},"receiveUpdateNodeResponse":{"target":"Follower","actions":{"type":"receiveUpdateNodeResponse"}},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"updateNode":{"actions":{"type":"forwardMessageToLeader"}},"receiveAppendEntryResponse":{"actions":{"type":"forwardMessageToLeader"}}},"after":{"electionTimeout":[{"target":"Leader","guard":{"type":"isVotedLeader"}},{"target":"Follower"}]},"entry":[{"type":"incrementCurrentTerm"},{"type":"selfVote"},{"type":"setRandomElectionTimeout","params":{"max":"$maxElectionTime","min":"$minElectionTime"}},{"type":"sendVoteRequests"}]},"Leader":{"initial":"active","on":{"reset":{"target":"Follower"},"stop":{"target":"#RAFT-P2P-2.stopped"}},"entry":[{"type":"initializeNextIndex"},{"type":"initializeMatchIndex"}],"states":{"active":{"on":{"start":{"target":"#RAFT-P2P-2.initialized.started.Validator.Follower","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"updateNode":{"actions":{"type":"updateNodeAndReturn"},"description":"when a node comes back online, or is new to the network, or has changed its IP, or is removing itself from the network"},"receiveAppendEntryResponse":{"actions":[{"type":"receiveAppendEntryResponse"},{"type":"commitBlocks"}]}},"after":{"heartbeatTimeout":{"target":"active"}},"entry":[{"type":"proposeBlock"},{"type":"sendAppendEntries"},{"type":"commitBlocks"}]}}}}}}},"prestart":{"after":{"500":{"target":"started"}}}}},"stopped":{"on":{"restart":{"target":"#RAFT-P2P-2.initialized.unstarted"}}}}}

export const TendermintP2P = {"context":{"log":"","votedFor":"0","nextIndex":"[]","currentTerm":"0","blockTimeout":"roundTimeout","max_tx_bytes":"65536","roundTimeout":4000,"currentNodeId":"0","max_block_gas":"20000000","timeoutPrevote":3000,"timeoutPropose":3000,"timeoutPrecommit":3000},"id":"Tendermint-P2P-8","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"prestart":{"target":"prestart"},"setup":{"target":"unstarted","actions":{"type":"setup"}},"start":{"target":"started","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]}}},"prestart":{"after":{"500":{"target":"started"}}},"started":{"initial":"Node","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}],"guard":{"type":"ifNewTransaction"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"updateNode":{"actions":{"type":"updateNodeAndReturn"}}},"states":{"Node":{"on":{"becomeValidator":{"target":"Validator","actions":[{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"start":{"actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}}},"always":{"target":"Validator","actions":{"type":"registerValidatorWithNetwork"},"guard":{"type":"ifNodeIsValidator"}}},"Validator":{"initial":"active","on":{"receiveBlockProposal":{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},"stop":{"target":"#Tendermint-P2P-8.stopped"},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"receivePrevote":{"actions":{"type":"receivePrevote"}},"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}},"receiveStateSyncResponse":{"actions":[{"type":"receiveStateSyncResponse"},{"type":"requestValidatorNodeInfoIfSynced"}]}},"states":{"active":{"on":{"receiveBlockProposal":[{"target":"prevote","actions":[{"type":"receiveBlockProposal"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifSenderIsProposer"}},{"target":"prevote","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrevotes"},{"type":"setRoundProposer"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPropose":{"target":"prevote","actions":{"type":"sendPrevoteNil"}}},"always":{"target":"#Tendermint-P2P-8.initialized.started.Proposer","guard":{"type":"isNextProposer"}},"entry":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrevotes"},{"type":"resetPrecommits"}]},"prevote":{"on":{"receivePrevote":{"target":"prevote","actions":{"type":"receivePrevote"}},"receiveBlockProposal":[{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},{"target":"prevote","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrevotes"},{"type":"setRoundProposer"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrevote"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPrevote":[{"target":"precommit","actions":{"type":"sendPrecommitNil"},"guard":{"type":"ifPrevoteAnyThreshold"}},{"target":"active"}]},"always":{"target":"precommit","actions":[{"type":"setLockedValue"},{"type":"setLockedRound"},{"type":"sendPrecommit"},{"type":"setValidValue"},{"type":"setValidRound"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrevote"}}],"guard":{"type":"ifPrevoteAcceptThreshold"}}},"precommit":{"on":{"receivePrecommit":{"target":"precommit","actions":{"type":"receivePrecommit"}},"receivePrevote":{"actions":{"type":"receivePrevote"}},"receiveBlockProposal":[{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrevotes"},{"type":"setRoundProposer"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPrecommit":{"target":"active"}},"always":{"target":"commit","actions":[{"type":"commitBlock"},{"type":"sendCommit"},{"type":"resetLockedRound"},{"type":"resetValidValue"},{"type":"resetValidRound"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}},{"type":"resetLockedValue"}],"guard":{"type":"ifPrecommitAcceptThreshold"}}},"commit":{"on":{"receivePrecommit":{"actions":{"type":"receivePrecommit"}},"receiveBlockProposal":{"target":"prevote","actions":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrevotes"},{"type":"resetPrecommits"},{"type":"receiveBlockProposal"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"roundTimeout"}}],"guard":{"type":"ifNextBlockProposal"}}},"after":{"roundTimeout":{"target":"active"}}}}},"Proposer":{"initial":"active","on":{"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"stop":{"target":"#Tendermint-P2P-8.stopped"},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}}},"states":{"active":{"always":{"target":"#Tendermint-P2P-8.initialized.started.Validator.prevote"},"entry":[{"type":"proposeBlock"},{"type":"sendBlockProposal"},{"type":"sendPrevote"}]}}}}}}},"stopped":{"on":{"restart":{"target":"#Tendermint-P2P-8.initialized.unstarted"}}}}}

export const Level0 = {"context":{"log":"","votedFor":"0","nextIndex":"[]","currentTerm":"0","blockTimeout":"roundTimeout","max_tx_bytes":"65536","roundTimeout":4000,"currentNodeId":"0","max_block_gas":"20000000","timeoutPropose":3000,"timeoutPrecommit":3000},"id":"Levels-P2P-4","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"prestart":{"target":"prestart"},"setup":{"target":"unstarted","actions":{"type":"setup"}},"start":{"target":"started","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]}}},"prestart":{"after":{"500":{"target":"started"}}},"started":{"initial":"Node","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}],"guard":{"type":"ifNewTransaction"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"updateNode":{"actions":{"type":"updateNodeAndReturn"}}},"states":{"Node":{"on":{"becomeValidator":{"target":"Validator","actions":[{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"start":{"actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}}},"always":{"target":"Validator","actions":{"type":"registerValidatorWithNetwork"},"guard":{"type":"ifNodeIsValidator"}}},"Validator":{"initial":"active","on":{"receiveBlockProposal":{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},"stop":{"target":"#Levels-P2P-4.stopped"},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}},"receiveStateSyncResponse":{"actions":[{"type":"receiveStateSyncResponse"},{"type":"requestValidatorNodeInfoIfSynced"}]},"receivePrecommit":{"actions":{"type":"receivePrecommit"}}},"states":{"active":{"on":{"receiveBlockProposal":[{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifSenderIsProposer"}},{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrecommits"},{"type":"setRoundProposer"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPropose":{"target":"precommit","actions":{"type":"sendPrecommitNil"}}},"always":{"target":"#Levels-P2P-4.initialized.started.Proposer","guard":{"type":"isNextProposer"}},"entry":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrecommits"}]},"precommit":{"on":{"receivePrecommit":{"target":"precommit","actions":{"type":"receivePrecommit"}},"receiveBlockProposal":[{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrecommits"},{"type":"setRoundProposer"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPrecommit":{"target":"active"}},"always":{"target":"commit","actions":[{"type":"commitBlock"},{"type":"sendCommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}}],"guard":{"type":"ifPrecommitAcceptThreshold"}}},"commit":{"on":{"receivePrecommit":{"actions":{"type":"receivePrecommit"}},"receiveBlockProposal":{"target":"precommit","actions":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrecommits"},{"type":"receiveBlockProposal"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"roundTimeout"}}],"guard":{"type":"ifNextBlockProposal"}}},"after":{"roundTimeout":{"target":"active"}}}}},"Proposer":{"initial":"active","on":{"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"stop":{"target":"#Levels-P2P-4.stopped"},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}}},"states":{"active":{"always":{"target":"#Levels-P2P-4.initialized.started.Validator.precommit"},"entry":[{"type":"proposeBlock"},{"type":"sendBlockProposal"},{"type":"sendPrecommit"}]}}}}}}},"stopped":{"on":{"restart":{"target":"#Levels-P2P-4.initialized.unstarted"}}}}}

export const Lobby = {"context":{"erc20CodeId":27,"derc20CodeId":28,"current_level":1,"newchainTimeout":20000,"enable_eid_check":false,"heartbeatTimeout":5000,"min_validators_count":2,"level_initial_balance":10000000000000000000},"id":"Lobby-P2P-1","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"start":{"target":"started","actions":[{"type":"connectNode"},{"type":"p2pConnectLobbyRoom"},{"type":"sendNewChainRequest"}]},"setup":{"target":"unstarted","actions":{"type":"setup"}},"prestart":{"target":"prestart"},"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}}}},"started":{"initial":"requesting","on":{"receiveLastChainId":{"actions":{"type":"receiveLastChainId"}},"receiveLastNodeId":{"actions":{"type":"receiveLastNodeId"}},"start":{"target":"started","actions":[{"type":"connectNode"},{"type":"p2pConnectLobbyRoom"},{"type":"sendNewChainRequest"}]}},"states":{"requesting":{"on":{"receiveNewChainResponse":{"target":"negotiating","actions":{"type":"receiveNewChainResponse"},"guard":{"type":"ifIncludesUs"}},"receiveNewChainRequest":{"actions":{"type":"receiveNewChainRequest"}}},"after":{"newchainTimeout":{"target":"negotiating","actions":[{"type":"createNewChainResponse"},{"type":"sendNewChainResponse"}]}}},"negotiating":{"on":{"receiveNewChainResponse":{"target":"negotiating","actions":{"type":"receiveNewChainResponse"},"guard":{"type":"ifIncludesUs"}},"receiveNewChainRequest":{"actions":[{"type":"receiveNewChainRequest"},{"type":"sendNewChainResponse"}]}},"always":{"target":"#Lobby-P2P-1.initialized.initializing","actions":[{"type":"p2pConnectNewChainRoom"},{"type":"tryCreateNewChainGenesisData"}],"guard":{"type":"ifValidatorThreshold"}}}}},"prestart":{"after":{"500":{"target":"started"}}},"initializing":{"on":{"receiveNewChainGenesisData":{"target":"initializing","actions":{"type":"receiveNewChainGenesisData"}},"start":{"target":"initializing","actions":[{"type":"connectNode"},{"type":"p2pConnectNewChainRoom"}]},"addGenTx":{"target":"initializing","actions":{"type":"addGenTx"}}},"always":{"target":"initialized","actions":[{"type":"initializeChain"},{"type":"p2pDisconnectNewChainRoom"}],"guard":{"type":"ifGenesisDataComplete"}}},"initialized":{"on":{"receiveLastChainId":{"actions":{"type":"receiveLastChainId"}}},"after":{"heartbeatTimeout":{"target":"initialized","actions":[{"type":"sendLastChainId"},{"type":"sendLastNodeId"}]}},"always":{"target":"done","guard":{"type":"ifLobbyDisconnect"}}},"done":{"entry":{"type":"p2pDisconnectLobbyRoom"}}}}}}

export const Level0OnDemand = {"context":{"log":"","votedFor":"0","nextIndex":"[]","currentTerm":"0","batchTimeout":1000,"blockTimeout":"roundTimeout","max_tx_bytes":"65536","roundTimeout":4000,"currentNodeId":"0","max_block_gas":"20000000","timeoutPropose":3000,"timeoutPrecommit":3000},"id":"OnDemand-Levels-5","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"prestart":{"target":"prestart"},"setup":{"target":"unstarted","actions":{"type":"setup"}},"start":{"target":"started","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]}}},"prestart":{"after":{"500":{"target":"started"}}},"started":{"initial":"Node","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}],"guard":{"type":"ifNewTransaction"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"updateNode":{"actions":{"type":"updateNodeAndReturn"}}},"states":{"Node":{"on":{"becomeValidator":{"target":"Validator","actions":[{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"start":{"actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}}},"always":{"target":"Validator","actions":{"type":"registerValidatorWithNetwork"},"guard":{"type":"ifNodeIsValidator"}}},"Validator":{"initial":"active","on":{"receiveBlockProposal":{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},"stop":{"target":"#OnDemand-Levels-5.stopped"},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}},"receiveStateSyncResponse":{"actions":[{"type":"receiveStateSyncResponse"},{"type":"requestValidatorNodeInfoIfSynced"}]},"receivePrecommit":{"actions":{"type":"receivePrecommit"}}},"states":{"active":{"on":{"receiveBlockProposal":[{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifSenderIsProposer"}},{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrecommits"},{"type":"setRoundProposer"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPropose":{"target":"precommit","actions":{"type":"sendPrecommitNil"}}},"always":{"target":"#OnDemand-Levels-5.initialized.started.Proposer","guard":{"type":"isNextProposer"}},"entry":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrecommits"}]},"precommit":{"on":{"receivePrecommit":{"target":"precommit","actions":{"type":"receivePrecommit"}},"receiveBlockProposal":[{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},{"target":"precommit","actions":[{"type":"receiveBlockProposal"},{"type":"resetPrecommits"},{"type":"setRoundProposer"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}}],"guard":{"type":"ifForceProposalReset"}}]},"after":{"timeoutPrecommit":{"target":"active"}},"always":{"target":"commit","actions":[{"type":"commitBlock"},{"type":"sendCommit"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}}],"guard":{"type":"ifPrecommitAcceptThreshold"}}},"commit":{"on":{"receivePrecommit":{"actions":{"type":"receivePrecommit"}},"receiveBlockProposal":{"target":"precommit","actions":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrecommits"},{"type":"receiveBlockProposal"},{"type":"sendPrecommit"},{"type":"cancelActiveIntervals","params":{"after":"roundTimeout"}}],"guard":{"type":"ifNextBlockProposal"}}},"after":{"roundTimeout":{"target":"#OnDemand-Levels-5.initialized.started.waiting"}}}}},"waiting":{"on":{"newTransaction":[{"guard":{"type":"ifOldTransaction"}},{"target":"waiting","actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}],"guard":{"type":"ifMempoolEmpty"}},{"target":"#OnDemand-Levels-5.initialized.started.Validator.active","actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}},{"type":"cancelActiveIntervals","params":{"after":"batchTimeout"}}],"guard":{"type":"ifMempoolFull"}},{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}]}],"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]}},"after":{"batchTimeout":{"target":"#OnDemand-Levels-5.initialized.started.Validator.active","guard":{"type":"ifMempoolNotEmpty"}}}},"Proposer":{"initial":"active","on":{"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"stop":{"target":"#OnDemand-Levels-5.stopped"},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}}},"states":{"active":{"always":{"target":"#OnDemand-Levels-5.initialized.started.Validator.precommit"},"entry":[{"type":"proposeBlock"},{"type":"sendBlockProposal"},{"type":"sendPrecommit"}]}}}}}}},"stopped":{"on":{"restart":{"target":"#OnDemand-Levels-5.initialized.unstarted"}}}}}
