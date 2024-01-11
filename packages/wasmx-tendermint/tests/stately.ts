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
      currentTerm: "0",
      max_tx_bytes: "65536",
      currentNodeId: "0",
      max_block_gas: "20000000",
      roundTimeout: 10000,
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
              start: {
                target: "prestart",
              },
              setup: {
                target: "unstarted",
                actions: {
                  type: "setup",
                },
              },
            },
          },
          prestart: {
            after: {
              roundTimeout: {
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
              guard: "isNextProposer",
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
                  nodeUpdate: {
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
    },
    types: {
      events: {} as
        | { type: "" }
        | { type: "stop" }
        | { type: "setup"; address: string }
        | { type: "start" }
        | { type: "restart" }
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
            type: "receiveProposal";
            value: string;
            termId: string;
            nodeIps: string;
            signature: string;
            proposerId: string;
          }
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
        | {
            type: "receivePrecommit";
            value: string;
            termId: string;
            signature: string;
            proposerId: string;
            index: string;
          }
        | { type: "heartbeatResponse"; term: string; success: string }
        | {
            type: "receiveVoteRequest";
            termId: string;
            signature: string;
            candidateId: string;
            lastLogTerm: string;
            lastLogIndex: string;
          },
      context: {} as {
        log: string;
        nodeIPs: string;
        templog: string;
        votedFor: string;
        nextIndex: string;
        currentTerm: string;
        max_tx_bytes: string;
        prevLogIndex: string;
        roundTimeout: string;
        currentNodeId: string;
        max_block_gas: string;
      },
    },
  },
  {
    actions: {
      vote: ({ context, event }) => {},
      setup: ({ context, event }) => {},
      selfVote: ({ context, event }) => {},
      setupNode: ({ context, event }) => {},
      commitBlock: ({ context, event }) => {},
      addToMempool: ({ context, event }) => {},
      commitBlocks: ({ context, event }) => {},
      processBlock: ({ context, event }) => {},
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
      sendProposalResponse: ({ context, event }) => {},
      cancelActiveIntervals: ({ context, event }) => {},
      sendHeartbeatResponse: ({ context, event }) => {},
      sendPrecommitResponse: ({ context, event }) => {},
      setRandomElectionTimeout: function ({ context, event }, params) {
        // Add your action code here
      },
      sendNewTransactionResponse: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      isVotedLeader: ({ context, event }, params) => {
        return false;
      },
      isNextProposer: ({ context, event }, params) => {
        return false;
      },
      ifIntervalActive: ({ context, event }, params) => {
        return false;
      },
    },
    delays: {
      roundTimeout: ({ context, event }) => {
        return 1000;
      },
    },
  },
);
