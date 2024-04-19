// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine({
  context: {
    maxLevel: 0,
    blockTimeout: 3000,
    currentLevel: 0,
    membersCount: 3,
    seekTimeout: 5000,
    currentMembers: 1,
  },
  id: "Levels-P2P-0",
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
          initial: "Seeker",
          states: {
            Seeker: {
              on: {
                receiveJoinInvite: {
                  target: "Seeker",
                  actions: [
                    {
                      type: "receiveJoinInvite",
                    },
                    {
                      type: "sendJoinResponse",
                    },
                  ],
                },
              },
              after: {
                seekTimeout: {
                  target: "Seeker",
                  actions: {
                    type: "sendJoinInvite",
                  },
                },
              },
              always: {
                target: "Member",
                actions: {
                  type: "deployNextLevel",
                },
                guard: {
                  type: "ifEnoughMembers",
                },
              },
            },
            Member: {
              initial: "active",
              on: {
                receiveJoinInvite: {
                  actions: {
                    type: "sendKnownSeekers",
                  },
                },
              },
              states: {
                active: {
                  after: {
                    blockTimeout: {
                      target: "proposer",
                      actions: {
                        type: "sendSubBlock",
                      },
                    },
                  },
                },
                proposer: {
                  on: {
                    receiveSubBlock: {
                      target: "proposer",
                      actions: {
                        type: "receiveSubBlock",
                      },
                    },
                  },
                  always: {
                    target: "active",
                    actions: [
                      {
                        type: "newBlock",
                      },
                      {
                        type: "broadcastNewBlock",
                      },
                    ],
                    guard: {
                      type: "ifAllSubBlocks",
                    },
                  },
                },
              },
            },
            Representative: {},
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
  },
}).withConfig({
  actions: {
    setup: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveJoinInvite: function (context, event) {
      // Add your action code here
      // ...
    },
    sendJoinResponse: function (context, event) {
      // Add your action code here
      // ...
    },
    deployNextLevel: function (context, event) {
      // Add your action code here
      // ...
    },
    sendSubBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    receiveSubBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    newBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    broadcastNewBlock: function (context, event) {
      // Add your action code here
      // ...
    },
    sendKnownSeekers: function (context, event) {
      // Add your action code here
      // ...
    },
    sendJoinInvite: function (context, event) {
      // Add your action code here
      // ...
    },
  },
  guards: {
    ifEnoughMembers: function (context, event) {
      // Add your guard condition here
      return true;
    },
    ifAllSubBlocks: function (context, event) {
      // Add your guard condition here
      return true;
    },
  },
});
