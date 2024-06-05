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
    roundTimeout: 4000,
    currentNodeId: "0",
    max_block_gas: "20000000",
    timeoutPrevote: 3000,
    timeoutPropose: 3000,
    timeoutPrecommit: 3000,
  },
  id: "Tendermint-P2P-6",
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
                  type: "requestBlockSync",
                },
                {
                  type: "StartNode",
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
              guard: {
                type: "ifNewTransaction",
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
                receiveStateSyncResponse: {
                  actions: {
                    type: "receiveStateSyncResponse",
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
                      type: "requestBlockSync",
                    },
                    {
                      type: "StartNode",
                    },
                  ],
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
              initial: "active",
              on: {
                receiveBlockProposal: {
                  actions: {
                    type: "receiveBlockProposal",
                  },
                  guard: {
                    type: "ifSenderIsProposer",
                  },
                },
                stop: {
                  target: "#Tendermint-P2P-6.stopped",
                },
                receiveUpdateNodeResponse: {
                  actions: {
                    type: "receiveUpdateNodeResponse",
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
                      type: "registerValidatorWithNetwork",
                    },
                    {
                      type: "requestBlockSync",
                    },
                    {
                      type: "StartNode",
                    },
                  ],
                },
                receiveCommit: {
                  actions: {
                    type: "receiveCommit",
                  },
                },
                receiveUpdateNodeRequest: {
                  actions: {
                    type: "receiveUpdateNodeRequest",
                  },
                },
                receiveStateSyncResponse: {
                  actions: [
                    {
                      type: "receiveStateSyncResponse",
                    },
                    {
                      type: "requestValidatorNodeInfoIfSynced",
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
                    target: "#Tendermint-P2P-6.initialized.started.Proposer",
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
                    receivePrevote: {
                      actions: {
                        type: "receivePrevote",
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
                        type: "sendCommit",
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
                      {
                        type: "resetLockedValue",
                      },
                    ],
                    guard: {
                      type: "ifPrecommitAcceptThreshold",
                    },
                  },
                },
                commit: {
                  on: {
                    receivePrecommit: {
                      actions: {
                        type: "receivePrecommit",
                      },
                    },
                  },
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
                      type: "registerValidatorWithNetwork",
                    },
                    {
                      type: "requestBlockSync",
                    },
                    {
                      type: "StartNode",
                    },
                  ],
                },
                stop: {
                  target: "#Tendermint-P2P-6.stopped",
                },
                receiveUpdateNodeRequest: {
                  actions: {
                    type: "receiveUpdateNodeRequest",
                  },
                },
              },
              states: {
                active: {
                  always: {
                    target:
                      "#Tendermint-P2P-6.initialized.started.Validator.prevote",
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
          target: "#Tendermint-P2P-6.initialized.unstarted",
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
    registerValidatorWithNetwork: function (context, event) {
      // Add your action code here
      // ...
    },
    requestBlockSync: function (context, event) {
      // Add your action code here
      // ...
    },
    StartNode: function (context, event) {
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
    sendCommit: function (context, event) {
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
    resetLockedValue: function (context, event) {
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
    receiveCommit: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveUpdateNodeRequest: function (context, event) {
      // Add your action code here
      // ...
    },
    requestValidatorNodeInfoIfSynced: function (context, event) {
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
    ifNewTransaction: function (context, event) {
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
