// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine({
  context: {
    erc20CodeId: 28,
    derc20CodeId: 29,
    current_level: 1,
    newchainTimeout: 20000,
    enable_eid_check: false,
    heartbeatTimeout: 5000,
    min_validators_count: 2,
    level_initial_balance: 10000000000000000000,
  },
  id: "Lobby-P2P-1",
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
              target: "started",
              actions: [
                {
                  type: "connectNode",
                },
                {
                  type: "p2pConnectLobbyRoom",
                },
                {
                  type: "sendNewChainRequest",
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
            setupNode: {
              target: "unstarted",
              actions: {
                type: "setupNode",
              },
            },
          },
        },
        started: {
          initial: "requesting",
          on: {
            receiveLastChainId: {
              actions: {
                type: "receiveLastChainId",
              },
            },
            receiveLastNodeId: {
              actions: {
                type: "receiveLastNodeId",
              },
            },
            start: {
              target: "started",
              actions: [
                {
                  type: "connectNode",
                },
                {
                  type: "p2pConnectLobbyRoom",
                },
                {
                  type: "sendNewChainRequest",
                },
              ],
            },
          },
          states: {
            requesting: {
              on: {
                receiveNewChainResponse: {
                  target: "negotiating",
                  actions: {
                    type: "receiveNewChainResponse",
                  },
                  guard: {
                    type: "ifIncludesUs",
                  },
                },
                receiveNewChainRequest: {
                  actions: {
                    type: "receiveNewChainRequest",
                  },
                },
              },
              after: {
                newchainTimeout: {
                  target: "negotiating",
                  actions: [
                    {
                      type: "createNewChainResponse",
                    },
                    {
                      type: "sendNewChainResponse",
                    },
                  ],
                },
              },
            },
            negotiating: {
              on: {
                receiveNewChainResponse: {
                  target: "negotiating",
                  actions: {
                    type: "receiveNewChainResponse",
                  },
                  guard: {
                    type: "ifIncludesUs",
                  },
                },
                receiveNewChainRequest: {
                  actions: [
                    {
                      type: "receiveNewChainRequest",
                    },
                    {
                      type: "sendNewChainResponse",
                    },
                  ],
                },
              },
              always: {
                target: "#Lobby-P2P-1.initialized.initializing",
                actions: [
                  {
                    type: "p2pConnectNewChainRoom",
                  },
                  {
                    type: "tryCreateNewChainGenesisData",
                  },
                ],
                guard: {
                  type: "ifValidatorThreshold",
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
        initializing: {
          on: {
            receiveNewChainGenesisData: {
              target: "initializing",
              actions: {
                type: "receiveNewChainGenesisData",
              },
            },
            start: {
              target: "initializing",
              actions: [
                {
                  type: "connectNode",
                },
                {
                  type: "p2pConnectNewChainRoom",
                },
              ],
            },
            addGenTx: {
              target: "initializing",
              actions: {
                type: "addGenTx",
              },
            },
          },
          always: {
            target: "initialized",
            actions: [
              {
                type: "initializeChain",
              },
              {
                type: "p2pDisconnectNewChainRoom",
              },
            ],
            guard: {
              type: "ifGenesisDataComplete",
            },
          },
        },
        initialized: {
          on: {
            receiveLastChainId: {
              actions: {
                type: "receiveLastChainId",
              },
            },
          },
          after: {
            heartbeatTimeout: {
              target: "initialized",
              actions: [
                {
                  type: "sendLastChainId",
                },
                {
                  type: "sendLastNodeId",
                },
              ],
            },
          },
          always: {
            target: "done",
            guard: {
              type: "ifLobbyDisconnect",
            },
          },
        },
        done: {
          entry: {
            type: "p2pDisconnectLobbyRoom",
          },
        },
      },
    },
  },
}).withConfig({
  actions: {
    p2pDisconnectLobbyRoom: function (context, event) {
      // Add your action code here
      // ...
    },
    connectNode: function (context, event) {
      // Add your action code here
      // ...
    },
    p2pConnectLobbyRoom: function (context, event) {
      // Add your action code here
      // ...
    },
    sendNewChainRequest: function (context, event) {
      // Add your action code here
      // ...
    },
    setup: function (context, event) {
      // Add your action code here
      // ...
    },
    setupNode: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveLastChainId: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveLastNodeId: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveNewChainResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    initializeChain: function (context, event) {
      // Add your action code here
      // ...
    },
    p2pDisconnectNewChainRoom: function (context, event) {
      // Add your action code here
      // ...
    },
    p2pConnectNewChainRoom: function (context, event) {
      // Add your action code here
      // ...
    },
    tryCreateNewChainGenesisData: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveNewChainGenesisData: function (context, event) {
      // Add your action code here
      // ...
    },
    sendLastChainId: function (context, event) {
      // Add your action code here
      // ...
    },
    sendLastNodeId: function (context, event) {
      // Add your action code here
      // ...
    },
    createNewChainResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    sendNewChainResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveNewChainRequest: function (context, event) {
      // Add your action code here
      // ...
    },
    addGenTx: function (context, event) {
      // Add your action code here
      // ...
    },
  },
  guards: {
    ifIncludesUs: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifGenesisDataComplete: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifValidatorThreshold: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifLobbyDisconnect: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
