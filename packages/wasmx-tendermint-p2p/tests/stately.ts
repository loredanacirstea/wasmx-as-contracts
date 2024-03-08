// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine({
  context: {
    log: "",
    votedFor: "0",
    nextIndex: "[]",
    currentTerm: "0",
    blockTimeout: "roundTimeout",
    max_tx_bytes: "65536",
    roundTimeout: 10000,
    currentNodeId: "0",
    max_block_gas: "20000000",
  },
  id: "Tendermint-P2P-4",
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
              target: "started",
              actions: [
                {
                  type: "connectPeers",
                },
                {
                  type: "connectRooms",
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
              target: "started",
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
            updateNode: {
              actions: {
                type: "updateNodeAndReturn",
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
                  type: "requestNetworkSync",
                },
              ],
            },
          },
          states: {
            Node: {
              on: {
                newValidator: [
                  {
                    target: "Validator",
                    actions: {
                      type: "transitionNodeToValidator",
                    },
                    guard: {
                      type: "newValidatorIsSelf",
                    },
                  },
                  {
                    target: "Node",
                    actions: {
                      type: "transitionNodeToValidator",
                    },
                  },
                ],
                receiveStateSyncResponse: {
                  actions: {
                    type: "receiveStateSyncResponse",
                  },
                },
                receiveBlockProposal: {
                  actions: {
                    type: "receiveBlockProposal",
                  },
                },
              },
              always: {
                target: "Validator",
                guard: {
                  type: "ifNodeIsValidator",
                },
              },
            },
            Validator: {
              initial: "active",
              on: {
                receiveBlockProposal: {
                  actions: [
                    {
                      type: "receiveBlockProposal",
                    },
                    {
                      type: "sendPrevote",
                    },
                  ],
                  guard: {
                    type: "ifSenderIsProposer",
                  },
                },
                stop: {
                  target: "#Tendermint-P2P-4.stopped",
                },
                receiveStateSyncResponse: {
                  actions: {
                    type: "receiveStateSyncResponse",
                  },
                },
                receivePrevote: {
                  actions: {
                    type: "receivePrevote",
                  },
                },
              },
              after: {
                roundTimeout: {
                  target: "Validator",
                },
              },
              states: {
                active: {
                  on: {
                    receiveBlockProposal: {
                      target: "prevote",
                      actions: [
                        {
                          type: "receiveBlockProposal",
                        },
                        {
                          type: "sendPrevote",
                        },
                      ],
                      guard: {
                        type: "ifSenderIsProposer",
                      },
                    },
                  },
                  always: {
                    target: "#Tendermint-P2P-4.initialized.started.Proposer",
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
                      type: "setRoundProposer",
                    },
                  ],
                },
                prevote: {
                  on: {
                    receivePrevote: {
                      target: "prevote",
                      actions: {
                        type: "receivePrevote",
                      },
                    },
                  },
                  always: {
                    target: "precommit",
                    actions: {
                      type: "sendPrecommit",
                    },
                    guard: {
                      type: "ifPrevoteThreshold",
                    },
                  },
                },
                precommit: {
                  on: {
                    receivePrecommit: {
                      target: "precommit",
                      actions: {
                        type: "receivePrecommit",
                      },
                    },
                  },
                  always: {
                    actions: {
                      type: "commitBlock",
                    },
                    guard: {
                      type: "ifPrecommitThreshold",
                    },
                  },
                },
              },
            },
            Proposer: {
              initial: "active",
              on: {
                stop: {
                  target: "#Tendermint-P2P-4.stopped",
                },
              },
              after: {
                roundTimeout: {
                  target: "Validator",
                },
              },
              states: {
                active: {
                  on: {
                    start: {
                      target: "#Tendermint-P2P-4.initialized.started.Validator",
                      actions: [
                        {
                          type: "connectPeers",
                        },
                        {
                          type: "connectRooms",
                        },
                        {
                          type: "requestNetworkSync",
                        },
                      ],
                    },
                  },
                  always: {
                    target: "prevote",
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
                      type: "sendBlockProposal",
                    },
                    {
                      type: "sendPrevote",
                    },
                  ],
                },
                prevote: {
                  on: {
                    receivePrevote: {
                      target: "prevote",
                      actions: {
                        type: "receivePrevote",
                      },
                    },
                  },
                  always: {
                    target: "precommit",
                    actions: {
                      type: "sendPrecommit",
                    },
                    guard: {
                      type: "ifPrevoteThreshold",
                    },
                  },
                },
                precommit: {
                  on: {
                    receivePrecommit: {
                      target: "precommit",
                      actions: {
                        type: "receivePrecommit",
                      },
                    },
                  },
                  always: {
                    actions: {
                      type: "commitBlock",
                    },
                    guard: {
                      type: "ifPrecommitThreshold",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#Tendermint-P2P-4.initialized.unstarted",
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
    setRoundProposer: function (context, event) {
      // Add your action code here
      // ...
    },
    proposeBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    sendBlockProposal: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrevote: function (context, event) {
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
    requestNetworkSync: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveBlockProposal: function (context, event) {
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
    setup: function (context, event) {
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
    updateNodeAndReturn: function (context, event) {
      // Add your action code here
      // ...
    },
    transitionNodeToValidator: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveStateSyncResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receivePrevote: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrecommit: function (context, event) {
      // Add your action code here
      // ...
    },
    receivePrecommit: function (context, event) {
      // Add your action code here
      // ...
    },
    commitBlock: function (context, event) {
      // Add your action code here
      // ...
    },
  },
  guards: {
    ifSenderIsProposer: function (context, event) {
      // Add your guard condition here
      return true;
    },
    isNextProposer: function (context, event) {
      // Add your guard condition here
      return true;
    },
    newValidatorIsSelf: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifPrevoteThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifPrecommitThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifNodeIsValidator: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
