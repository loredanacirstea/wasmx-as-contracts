// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine({
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
  id: "Tendermint-P2P-1",
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
              actions: [
                {
                  type: "connectPeers",
                },
                {
                  type: "requestNetworkSync",
                },
              ],
            },
          },
        },
        prestart: {
          after: {
            "500": {
              target: "Validator",
            },
          },
        },
        Validator: {
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
                {
                  type: "forwardTx",
                },
              ],
            },
            stop: {
              target: "#Tendermint-P2P-1.stopped",
            },
            start: {
              target: "Validator",
              actions: [
                {
                  type: "connectPeers",
                },
                {
                  type: "requestNetworkSync",
                },
              ],
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
            receiveUpdateNodeResponse: {
              actions: {
                type: "receiveUpdateNodeResponse",
              },
            },
            receiveStateSyncRequest: {
              actions: {
                type: "receiveStateSyncRequest",
              },
            },
            receiveStateSyncResponse: {
              actions: {
                type: "receiveStateSyncResponse",
              },
            },
            updateNode: {
              actions: {
                type: "updateNodeAndReturn",
              },
            },
          },
          after: {
            roundTimeout: {
              target: "Validator",
            },
          },
          always: {
            target: "Proposer",
            guard: {
              type: "isNextProposer",
            },
          },
          entry: [
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
        },
        Proposer: {
          initial: "active",
          on: {
            stop: {
              target: "#Tendermint-P2P-1.stopped",
            },
          },
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
                  actions: [
                    {
                      type: "connectPeers",
                    },
                    {
                      type: "requestNetworkSync",
                    },
                  ],
                },
                updateNode: {
                  actions: {
                    type: "updateNodeAndReturn",
                  },
                },
                receiveProposal: {
                  target: "#Tendermint-P2P-1.initialized.Validator",
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
                receiveStateSyncRequest: {
                  actions: {
                    type: "receiveStateSyncRequest",
                  },
                },
              },
              after: {
                roundTimeout: {
                  target: "#Tendermint-P2P-1.initialized.Validator",
                },
              },
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
              ],
            },
          },
        },
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#Tendermint-P2P-1.initialized.unstarted",
        },
      },
    },
  },
}).withConfig({
  actions: {
    cancelActiveIntervals: function (context, event) {
      // Add your action code here
      // ...
    },
    incrementCurrentTerm: function (context, event) {
      // Add your action code here
      // ...
    },
    initializeNextIndex: function (context, event) {
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
    setupNode: function (context, event) {
      // Add your action code here
      // ...
    },
    connectPeers: function (context, event) {
      // Add your action code here
      // ...
    },
    requestNetworkSync: function (context, event) {
      // Add your action code here
      // ...
    },
    processBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    sendProposalResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    forwardTx: function (context, event) {
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
    commitBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrecommitResponse: function (context, event) {
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
    receiveUpdateNodeResponse: function (context, event) {
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
  },
  guards: {
    isNextProposer: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
