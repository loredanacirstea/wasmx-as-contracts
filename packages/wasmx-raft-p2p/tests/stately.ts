// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine({
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
  id: "RAFT-P2P-1",
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
      on: {
        start: {},
      },
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
              actions: {
                type: "connectPeers",
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
              target: "#RAFT-P2P-1.stopped",
            },
            start: {
              target: "Follower",
              actions: {
                type: "connectPeers",
              },
            },
            receiveUpdateNodeResponse: {
              actions: {
                type: "receiveUpdateNodeResponse",
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
              type: "registeredCheck",
            },
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
        prestart: {
          after: {
            "500": {
              target: "Follower",
            },
          },
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
              target: "#RAFT-P2P-1.stopped",
            },
            start: {
              target: "Candidate",
              actions: {
                type: "connectPeers",
              },
            },
            receiveVoteResponse: {
              actions: {
                type: "receiveVoteResponse",
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
              target: "#RAFT-P2P-1.stopped",
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
                  actions: {
                    type: "connectPeers",
                  },
                },
                nodeUpdate: {
                  actions: {
                    type: "updateNodeAndReturn",
                  },
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
              ],
            },
          },
        },
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#RAFT-P2P-1.initialized.unstarted",
        },
      },
    },
  },
}).withConfig({
  actions: {
    registeredCheck: function (context, event) {
      // Add your action code here
      // ...
    },
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
    addToMempool: function (context, event) {
      // Add your action code here
      // ...
    },
    sendNewTransactionResponse: function (context, event) {
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
    vote: function (context, event) {
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
    commitBlocks: function (context, event) {
      // Add your action code here
      // ...
    },
  },
  guards: {
    isVotedLeader: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
