// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
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
            after: {
              electionTimeout: {
                target: "#RAFT-P2P-1.initialized.Candidate",
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
          },
          prestart: {
            after: {
              "500": {
                target: "#RAFT-P2P-1.initialized.Follower",
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
                  max: "$maxElectionTime",
                  min: "$minElectionTime",
                },
              },
              {
                type: "sendVoteRequests",
              },
            ],
            always: [
              {
                target: "Leader",
                guard: "isVotedLeader",
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
                ],
                after: {
                  heartbeatTimeout: {
                    target: "#RAFT-P2P-1.initialized.Leader.active",
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
              },
            },
            on: {
              reset: {
                target: "Follower",
              },
              stop: {
                target: "#RAFT-P2P-1.stopped",
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
            target: "#RAFT-P2P-1.initialized.unstarted",
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "" }
        | { type: "stop" }
        | { type: "reset" }
        | { type: "setup"; address: string }
        | { type: "start" }
        | { type: "restart" }
        | { type: "prestart" }
        | { type: "newChange"; transaction: string }
        | {
            type: "setupNode";
            nodeIPs: string;
            currentNodeId: string;
            initChainSetup: string;
          }
        | { type: "initialize" }
        | {
            type: "nodeUpdate";
            ip: string;
            index: string;
            removed: string;
            signature: string;
          }
        | { type: "newTransaction"; transaction: string }
        | { type: "nodeListUpdate"; ips: string }
        | {
            type: "receiveHeartbeat";
            termId: string;
            entries: string;
            nodeIps: string;
            leaderId: string;
            signature: string;
            prevLogTerm: string;
            leaderCommit: string;
            prevLogIndex: string;
          }
        | { type: "heartbeatResponse"; term: string; success: string }
        | {
            type: "receiveVoteRequest";
            termId: string;
            signature: string;
            candidateId: string;
            lastLogTerm: string;
            lastLogIndex: string;
          }
        | {
            type: "receiveUpdateNodeResponse";
            index: string;
            nodeIPs: string;
            nodeId: string;
            validators: string;
          }
        | { type: "receiveVoteResponse"; termId: string; voteGranted: string }
        | { type: "receiveAppendEntryResponse" },
      context: {} as {
        log: string;
        nodeIPs: string;
        templog: string;
        votedFor: string;
        nextIndex: string;
        matchIndex: string;
        commitIndex: string;
        currentTerm: string;
        lastApplied: string;
        blockTimeout: string;
        max_tx_bytes: string;
        prevLogIndex: string;
        currentNodeId: string;
        electionReset: string;
        max_block_gas: string;
        electionTimeout: string;
        maxElectionTime: string;
        minElectionTime: string;
        heartbeatTimeout: number;
      },
    },
  },
  {
    actions: {
      vote: ({ context, event }) => {},
      setup: ({ context, event }) => {},
      selfVote: ({ context, event }) => {},
      setupNode: ({ context, event }) => {},
      addToMempool: ({ context, event }) => {},
      commitBlocks: ({ context, event }) => {},
      connectPeers: ({ context, event }) => {},
      proposeBlock: ({ context, event }) => {},
      registeredCheck: ({ context, event }) => {},
      sendVoteRequests: ({ context, event }) => {},
      sendAppendEntries: ({ context, event }) => {},
      forwardTxsToLeader: ({ context, event }) => {},
      initializeNextIndex: ({ context, event }) => {},
      updateNodeAndReturn: ({ context, event }) => {},
      incrementCurrentTerm: ({ context, event }) => {},
      initializeMatchIndex: ({ context, event }) => {},
      processAppendEntries: ({ context, event }) => {},
      cancelActiveIntervals: ({ context, event }) => {},
      sendHeartbeatResponse: ({ context, event }) => {},
      setRandomElectionTimeout: function ({ context, event }, params) {
        // Add your action code here
      },
      sendNewTransactionResponse: ({ context, event }) => {},
      receiveUpdateNodeResponse: ({ context, event }) => {},
      receiveVoteResponse: ({ context, event }) => {},
      receiveAppendEntryResponse: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      isVotedLeader: ({ context, event }, params) => {
        return false;
      },
    },
    delays: {
      heartbeatTimeout: ({ context, event }) => {
        return 1000;
      },
      electionTimeout: ({ context, event }) => {
        return 1000;
      },
    },
  },
);
