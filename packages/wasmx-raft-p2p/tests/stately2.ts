import { createMachine } from "xstate";

export const machine = createMachine({
  context: {
    log: "",
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
    validatorNodesInfo: "[]",
  },
  id: "RAFT-P2P-2",
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
              target: "started",
              actions: [
                {
                  type: "connectPeers",
                },
                {
                  type: "connectRooms",
                },
                {
                  type: "connectNodeRoom",
                },
                {
                  type: "requestBlockSync",
                },
              ],
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
        started: {
          initial: "Node",
          on: {
            newTransaction: {
              actions: [
                {
                  type: "addToMempool",
                },
                {
                  type: "sendNewTransactionResponse",
                },
                {
                  type: "forwardMsgToChat",
                  params: {
                    protocolId: "mempool",
                  },
                },
              ],
              guard: {
                type: "ifNewTransaction",
              },
            },
            receiveStateSyncRequest: {
              actions: {
                type: "receiveStateSyncRequest",
              },
            },
          },
          states: {
            Node: {
              on: {
                becomeValidator: {
                  target: "Validator",
                  actions: [
                    {
                      type: "registerValidatorWithNetwork",
                    },
                    {
                      type: "requestBlockSync",
                    },
                  ],
                },
                receiveHeartbeat: {
                  actions: {
                    type: "processAppendEntries",
                  },
                },
                start: {
                  actions: [
                    {
                      type: "connectPeers",
                    },
                    {
                      type: "connectRooms",
                    },
                    {
                      type: "connectNodeRoom",
                    },
                    {
                      type: "requestBlockSync",
                    },
                  ],
                },
                receiveUpdateNodeResponse: {
                  actions: {
                    type: "receiveUpdateNodeResponse",
                  },
                },
                receiveStateSyncResponse: {
                  actions: {
                    type: "receiveStateSyncResponse",
                  },
                },
                receiveCommit: {
                  actions: {
                    type: "receiveCommit",
                  },
                },
              },
              always: {
                target: "Validator",
                actions: {
                  type: "registerValidatorWithNetwork",
                },
                guard: {
                  type: "ifNodeIsValidator",
                },
              },
            },
            Validator: {
              initial: "Follower",
              states: {
                Follower: {
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
                    stop: {
                      target: "#RAFT-P2P-2.stopped",
                    },
                    start: {
                      target: "Follower",
                      actions: [
                        {
                          type: "connectPeers",
                        },
                        {
                          type: "connectRooms",
                        },
                        {
                          type: "registerValidatorWithNetwork",
                        },
                        {
                          type: "requestBlockSync",
                        },
                      ],
                    },
                    receiveUpdateNodeResponse: {
                      actions: {
                        type: "receiveUpdateNodeResponse",
                      },
                    },
                    receiveStateSyncResponse: {
                      actions: {
                        type: "receiveStateSyncResponse",
                      },
                    },
                    updateNode: {
                      actions: {
                        type: "forwardMessageToLeader",
                      },
                    },
                    receiveAppendEntryResponse: {
                      actions: {
                        type: "forwardMessageToLeader",
                      },
                    },
                  },
                  after: {
                    electionTimeout: {
                      target: "Candidate",
                    },
                    heartbeatTimeout: {
                      actions: {
                        type: "forwardTxsToLeader",
                      },
                    },
                  },
                  entry: [
                    {
                      type: "setRandomElectionTimeout",
                      params: {
                        max: "$maxElectionTime",
                        min: "$minElectionTime",
                      },
                    },
                    {
                      type: "cancelActiveIntervals",
                      params: {
                        after: "electionTimeout",
                      },
                    },
                  ],
                },
                Candidate: {
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
                    stop: {
                      target: "#RAFT-P2P-2.stopped",
                    },
                    start: {
                      target: "Candidate",
                      actions: [
                        {
                          type: "connectPeers",
                        },
                        {
                          type: "connectRooms",
                        },
                        {
                          type: "registerValidatorWithNetwork",
                        },
                        {
                          type: "requestBlockSync",
                        },
                      ],
                    },
                    receiveVoteResponse: {
                      actions: {
                        type: "receiveVoteResponse",
                      },
                    },
                    receiveUpdateNodeResponse: {
                      target: "Follower",
                      actions: {
                        type: "receiveUpdateNodeResponse",
                      },
                    },
                    receiveStateSyncResponse: {
                      actions: {
                        type: "receiveStateSyncResponse",
                      },
                    },
                    updateNode: {
                      actions: {
                        type: "forwardMessageToLeader",
                      },
                    },
                    receiveAppendEntryResponse: {
                      actions: {
                        type: "forwardMessageToLeader",
                      },
                    },
                  },
                  after: {
                    electionTimeout: [
                      {
                        target: "Leader",
                        guard: {
                          type: "isVotedLeader",
                        },
                      },
                      {
                        target: "Follower",
                      },
                    ],
                  },
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
                        max: "$maxElectionTime",
                        min: "$minElectionTime",
                      },
                    },
                    {
                      type: "sendVoteRequests",
                    },
                  ],
                },
                Leader: {
                  initial: "active",
                  on: {
                    reset: {
                      target: "Follower",
                    },
                    stop: {
                      target: "#RAFT-P2P-2.stopped",
                    },
                  },
                  entry: [
                    {
                      type: "initializeNextIndex",
                    },
                    {
                      type: "initializeMatchIndex",
                    },
                  ],
                  states: {
                    active: {
                      on: {
                        start: {
                          target: "active",
                          actions: [
                            {
                              type: "connectPeers",
                            },
                            {
                              type: "connectRooms",
                            },
                            {
                              type: "registerValidatorWithNetwork",
                            },
                            {
                              type: "requestBlockSync",
                            },
                          ],
                        },
                        updateNode: {
                          actions: {
                            type: "updateNodeAndReturn",
                          },
                          description:
                            "when a node comes back online, or is new to the network, or has changed its IP, or is removing itself from the network",
                        },
                        receiveAppendEntryResponse: {
                          actions: [
                            {
                              type: "receiveAppendEntryResponse",
                            },
                            {
                              type: "commitBlocks",
                            },
                          ],
                        },
                      },
                      after: {
                        heartbeatTimeout: {
                          target: "active",
                        },
                      },
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
                    },
                  },
                },
              },
            },
          },
        },
        prestart: {
          after: {
            "500": {
              target: "started",
            },
          },
        },
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#RAFT-P2P-2.initialized.unstarted",
        },
      },
    },
  },
}).withConfig({
  actions: {
    setRandomElectionTimeout: function (context, event) {
      // Add your action code here
    },
    cancelActiveIntervals: function (context, event) {
      // Add your action code here
      // ...
    },
    incrementCurrentTerm: function (context, event) {
      // Add your action code here
      // ...
    },
    selfVote: function (context, event) {
      // Add your action code here
      // ...
    },
    sendVoteRequests: function (context, event) {
      // Add your action code here
      // ...
    },
    initializeNextIndex: function (context, event) {
      // Add your action code here
      // ...
    },
    initializeMatchIndex: function (context, event) {
      // Add your action code here
      // ...
    },
    proposeBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    sendAppendEntries: function (context, event) {
      // Add your action code here
      // ...
    },
    commitBlocks: function (context, event) {
      // Add your action code here
      // ...
    },
    processAppendEntries: function (context, event) {
      // Add your action code here
      // ...
    },
    sendHeartbeatResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    setupNode: function (context, event) {
      // Add your action code here
      // ...
    },
    connectPeers: function (context, event) {
      // Add your action code here
      // ...
    },
    connectRooms: function (context, event) {
      // Add your action code here
      // ...
    },
    registerValidatorWithNetwork: function (context, event) {
      // Add your action code here
      // ...
    },
    requestBlockSync: function (context, event) {
      // Add your action code here
      // ...
    },
    vote: function (context, event) {
      // Add your action code here
      // ...
    },
    connectNodeRoom: function (context, event) {
      // Add your action code here
      // ...
    },
    addToMempool: function (context, event) {
      // Add your action code here
      // ...
    },
    sendNewTransactionResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    forwardMsgToChat: function (context, event) {
      // Add your action code here
      // ...
    },
    updateNodeAndReturn: function (context, event) {
      // Add your action code here
      // ...
    },
    setup: function (context, event) {
      // Add your action code here
      // ...
    },
    forwardTxsToLeader: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveUpdateNodeResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveVoteResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveAppendEntryResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveStateSyncRequest: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveStateSyncResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveCommit: function (context, event) {
      // Add your action code here
      // ...
    },
    forwardMessageToLeader: function (context, event) {
      // Add your action code here
      // ...
    },
  },
  guards: {
    ifNewTransaction: function (context, event) {
      // Add your guard condition here
      return true;
    },
    isVotedLeader: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifNodeIsValidator: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
