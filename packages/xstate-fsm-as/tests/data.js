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

export const RAFT_P2P = {"context":{"log":"","nodeIPs":"[]","votedFor":"0","nextIndex":"[]","matchIndex":"[]","commitIndex":"0","currentTerm":"0","lastApplied":"0","blockTimeout":"heartbeatTimeout","max_tx_bytes":"65536","prevLogIndex":"0","currentNodeId":"0","electionReset":"0","max_block_gas":"20000000","electionTimeout":"0","maxElectionTime":"20000","minElectionTime":"10000","heartbeatTimeout":"5000"},"id":"RAFT-P2P-1","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","on":{"start":{}},"states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"start":{"target":"Follower","actions":[{"type":"connectPeers"},{"type":"requestNetworkSync"}]},"setup":{"target":"unstarted","actions":{"type":"setup"}},"prestart":{"target":"prestart"}}},"Follower":{"on":{"receiveHeartbeat":{"target":"Follower","actions":[{"type":"processAppendEntries"},{"type":"sendHeartbeatResponse"}]},"receiveVoteRequest":{"target":"Follower","actions":{"type":"vote"}},"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"}]},"stop":{"target":"#RAFT-P2P-1.stopped"},"start":{"target":"Follower","actions":[{"type":"connectPeers"},{"type":"requestNetworkSync"}]},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}}},"after":{"electionTimeout":{"target":"Candidate"},"heartbeatTimeout":{"actions":{"type":"forwardTxsToLeader"}}},"entry":[{"type":"setRandomElectionTimeout","params":{"max":"$maxElectionTime","min":"$minElectionTime"}},{"type":"cancelActiveIntervals","params":{"after":"electionTimeout"}}]},"prestart":{"after":{"500":{"target":"Follower"}}},"Candidate":{"on":{"receiveHeartbeat":{"target":"Follower","actions":[{"type":"processAppendEntries"},{"type":"sendHeartbeatResponse"}]},"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"}]},"stop":{"target":"#RAFT-P2P-1.stopped"},"start":{"target":"Candidate","actions":[{"type":"connectPeers"},{"type":"requestNetworkSync"}]},"receiveVoteResponse":{"actions":{"type":"receiveVoteResponse"}},"receiveUpdateNodeResponse":{"target":"Follower","actions":{"type":"receiveUpdateNodeResponse"}},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}}},"after":{"electionTimeout":[{"target":"Leader","guard":{"type":"isVotedLeader"}},{"target":"Follower"}]},"entry":[{"type":"incrementCurrentTerm"},{"type":"selfVote"},{"type":"setRandomElectionTimeout","params":{"max":"$maxElectionTime","min":"$minElectionTime"}},{"type":"sendVoteRequests"}]},"Leader":{"initial":"active","on":{"reset":{"target":"Follower"},"stop":{"target":"#RAFT-P2P-1.stopped"}},"entry":[{"type":"initializeNextIndex"},{"type":"initializeMatchIndex"}],"states":{"active":{"on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"}]},"start":{"target":"active","actions":{"type":"connectPeers"}},"updateNode":{"actions":{"type":"updateNodeAndReturn"},"description":"when a node comes back online, or is new to the network, or has changed its IP, or is removing itself from the network"},"receiveAppendEntryResponse":{"actions":[{"type":"receiveAppendEntryResponse"},{"type":"commitBlocks"}]},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}}},"after":{"heartbeatTimeout":{"target":"active"}},"entry":[{"type":"proposeBlock"},{"type":"sendAppendEntries"},{"type":"commitBlocks"}]}}}}},"stopped":{"on":{"restart":{"target":"#RAFT-P2P-1.initialized.unstarted"}}}}}

export const TendermintP2P = {"context":{"log":"","votedFor":"0","nextIndex":"[]","currentTerm":"0","blockTimeout":"roundTimeout","max_tx_bytes":"65536","roundTimeout":4000,"currentNodeId":"0","max_block_gas":"20000000","timeoutPrevote":3000,"timeoutPropose":3000,"timeoutPrecommit":3000},"id":"Tendermint-P2P-6","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}},"prestart":{"target":"prestart"},"setup":{"target":"unstarted","actions":{"type":"setup"}},"start":{"target":"started","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"},{"type":"StartNode"}]}}},"prestart":{"after":{"500":{"target":"started"}}},"started":{"initial":"Node","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"},{"type":"forwardMsgToChat","params":{"protocolId":"mempool"}}]},"receiveStateSyncRequest":{"actions":{"type":"receiveStateSyncRequest"}},"updateNode":{"actions":{"type":"updateNodeAndReturn"}}},"states":{"Node":{"on":{"becomeValidator":{"target":"Validator","actions":[{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"}]},"receiveStateSyncResponse":{"actions":{"type":"receiveStateSyncResponse"}},"start":{"actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"requestBlockSync"},{"type":"StartNode"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}}},"always":{"target":"Validator","actions":{"type":"registerValidatorWithNetwork"},"guard":{"type":"ifNodeIsValidator"}}},"Validator":{"initial":"active","on":{"receiveBlockProposal":{"actions":{"type":"receiveBlockProposal"},"guard":{"type":"ifSenderIsProposer"}},"stop":{"target":"#Tendermint-P2P-6.stopped"},"receiveUpdateNodeResponse":{"actions":{"type":"receiveUpdateNodeResponse"}},"receivePrevote":{"actions":{"type":"receivePrevote"}},"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"},{"type":"StartNode"}]},"receiveCommit":{"actions":{"type":"receiveCommit"}},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}},"receiveStateSyncResponse":{"actions":[{"type":"receiveStateSyncResponse"},{"type":"requestValidatorNodeInfoIfSynced"}]}},"states":{"active":{"on":{"receiveBlockProposal":{"target":"prevote","actions":[{"type":"receiveBlockProposal"},{"type":"sendPrevote"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPropose"}}],"guard":{"type":"ifSenderIsProposer"}}},"after":{"timeoutPropose":{"target":"prevote","actions":{"type":"sendPrevoteNil"}}},"always":{"target":"#Tendermint-P2P-6.initialized.started.Proposer","guard":{"type":"isNextProposer"}},"entry":[{"type":"incrementCurrentTerm"},{"type":"setRoundProposer"},{"type":"resetPrevotes"},{"type":"resetPrecommits"}]},"prevote":{"on":{"receivePrevote":{"target":"prevote","actions":{"type":"receivePrevote"}}},"after":{"timeoutPrevote":{"target":"precommit","actions":{"type":"sendPrecommitNil"},"guard":{"type":"ifPrevoteAnyThreshold"}}},"always":{"target":"precommit","actions":[{"type":"setLockedValue"},{"type":"setLockedRound"},{"type":"sendPrecommit"},{"type":"setValidValue"},{"type":"setValidRound"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrevote"}}],"guard":{"type":"ifPrevoteAcceptThreshold"}}},"precommit":{"on":{"receivePrecommit":{"target":"precommit","actions":{"type":"receivePrecommit"}},"receivePrevote":{"actions":{"type":"receivePrevote"}}},"after":{"timeoutPrecommit":{"target":"active","guard":{"type":"ifPrecommitAnyThreshold"}}},"always":{"target":"commit","actions":[{"type":"commitBlock"},{"type":"sendCommit"},{"type":"resetLockedRound"},{"type":"resetValidValue"},{"type":"resetValidRound"},{"type":"cancelActiveIntervals","params":{"after":"timeoutPrecommit"}},{"type":"resetLockedValue"}],"guard":{"type":"ifPrecommitAcceptThreshold"}}},"commit":{"on":{"receivePrecommit":{"actions":{"type":"receivePrecommit"}}},"after":{"roundTimeout":{"target":"active"}}}}},"Proposer":{"initial":"active","on":{"start":{"target":"Validator","actions":[{"type":"connectPeers"},{"type":"connectRooms"},{"type":"registerValidatorWithNetwork"},{"type":"requestBlockSync"},{"type":"StartNode"}]},"stop":{"target":"#Tendermint-P2P-6.stopped"},"receiveUpdateNodeRequest":{"actions":{"type":"receiveUpdateNodeRequest"}}},"states":{"active":{"always":{"target":"#Tendermint-P2P-6.initialized.started.Validator.prevote"},"entry":[{"type":"proposeBlock"},{"type":"sendBlockProposal"},{"type":"sendPrevote"}]}}}}}}},"stopped":{"on":{"restart":{"target":"#Tendermint-P2P-6.initialized.unstarted"}}}}}

export const Level0 = {"context":{"maxLevel":0,"blockTimeoutInternal":3000,"currentLevel":0,"membersCount":1,"blockTimeout":"blockTimeoutInternal"},"id":"Levels0-0","initial":"uninitialized","states":{"uninitialized":{"on":{"initialize":{"target":"initialized"}}},"initialized":{"initial":"unstarted","states":{"unstarted":{"on":{"start":{"target":"started","actions":{"type":"StartNode"}},"setup":{"target":"unstarted","actions":{"type":"setup"}},"prestart":{"target":"prestart"},"setupNode":{"target":"unstarted","actions":{"type":"setupNode"}}}},"started":{"initial":"active","on":{"newTransaction":{"actions":[{"type":"addToMempool"},{"type":"sendNewTransactionResponse"}]},"start":{"target":"started","actions":{"type":"StartNode"}}},"states":{"active":{"after":{"blockTimeoutInternal":{"target":"proposer"}}},"proposer":{"always":{"target":"active","actions":{"type":"newBlock"}}}}},"prestart":{"after":{"500":{"target":"started"}}}}}}}
