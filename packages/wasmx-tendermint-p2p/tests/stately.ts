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
    roundTimeout: 2000,
    currentNodeId: "0",
    max_block_gas: "20000000",
    timeoutPropose: 3000,
    timeoutPrevote: 3000,
    timeoutPrecommit: 3000,
  },
  id: "Tendermint-P2P-5",
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
                  target: "#Tendermint-P2P-5.stopped",
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
                start: {
                  target: "Validator",
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
                        {
                          type: "cancelActiveIntervals",
                          params: {
                            after: "timeoutPropose",
                          },
                        },
                      ],
                      guard: {
                        type: "ifSenderIsProposer",
                      },
                    },
                  },
                  after: {
                    timeoutPropose: {
                      target: "prevote",
                      actions: {
                        type: "sendPrevoteNil",
                      },
                    },
                  },
                  always: {
                    target: "#Tendermint-P2P-5.initialized.started.Proposer",
                    guard: {
                      type: "isNextProposer",
                    },
                  },
                  entry: [
                    {
                      type: "incrementCurrentTerm",
                    },
                    {
                      type: "setRoundProposer",
                    },
                    {
                      type: "resetPrevotes",
                    },
                    {
                      type: "resetPrecommits",
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
                  after: {
                    timeoutPrevote: {
                      target: "precommit",
                      actions: {
                        type: "sendPrecommitNil",
                      },
                      guard: {
                        type: "ifPrevoteAnyThreshold",
                      },
                    },
                  },
                  always: {
                    target: "precommit",
                    actions: [
                      {
                        type: "setLockedValue",
                      },
                      {
                        type: "setLockedRound",
                      },
                      {
                        type: "sendPrecommit",
                      },
                      {
                        type: "setValidValue",
                      },
                      {
                        type: "setValidRound",
                      },
                      {
                        type: "cancelActiveIntervals",
                        params: {
                          after: "timeoutPrevote",
                        },
                      },
                    ],
                    guard: {
                      type: "ifPrevoteAcceptThreshold",
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
                  after: {
                    timeoutPrecommit: {
                      target: "active",
                      guard: {
                        type: "ifPrecommitAnyThreshold",
                      },
                    },
                  },
                  always: {
                    target: "commit",
                    actions: [
                      {
                        type: "commitBlock",
                      },
                      {
                        type: "resetLockedValue",
                      },
                      {
                        type: "resetLockedRound",
                      },
                      {
                        type: "resetValidValue",
                      },
                      {
                        type: "resetValidRound",
                      },
                      {
                        type: "cancelActiveIntervals",
                        params: {
                          after: "timeoutPrecommit",
                        },
                      },
                    ],
                    guard: {
                      type: "ifPrecommitAcceptThreshold",
                    },
                  },
                },
                commit: {
                  after: {
                    roundTimeout: {
                      target: "active",
                    },
                  },
                },
              },
            },
            Proposer: {
              initial: "active",
              on: {
                start: {
                  target: "Validator",
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
                stop: {
                  target: "#Tendermint-P2P-5.stopped",
                },
              },
              states: {
                active: {
                  always: {
                    target:
                      "#Tendermint-P2P-5.initialized.started.Validator.prevote",
                  },
                  entry: [
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
              },
            },
          },
        },
      },
    },
    stopped: {
      on: {
        restart: {
          target: "#Tendermint-P2P-5.initialized.unstarted",
        },
      },
    },
  },
}).withConfig({
  actions: {
    incrementCurrentTerm: function (context, event) {
      // Add your action code here
      // ...
    },
    setRoundProposer: function (context, event) {
      // Add your action code here
      // ...
    },
    resetPrevotes: function (context, event) {
      // Add your action code here
      // ...
    },
    resetPrecommits: function (context, event) {
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
    setLockedValue: function (context, event) {
      // Add your action code here
      // ...
    },
    setLockedRound: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrecommit: function (context, event) {
      // Add your action code here
      // ...
    },
    setValidValue: function (context, event) {
      // Add your action code here
      // ...
    },
    setValidRound: function (context, event) {
      // Add your action code here
      // ...
    },
    cancelActiveIntervals: function (context, event) {
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
    resetLockedValue: function (context, event) {
      // Add your action code here
      // ...
    },
    resetLockedRound: function (context, event) {
      // Add your action code here
      // ...
    },
    resetValidValue: function (context, event) {
      // Add your action code here
      // ...
    },
    resetValidRound: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrevoteNil: function (context, event) {
      // Add your action code here
      // ...
    },
    sendPrecommitNil: function (context, event) {
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
    ifPrevoteAcceptThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifPrecommitAcceptThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifNodeIsValidator: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifPrevoteAnyThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifPrecommitAnyThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
