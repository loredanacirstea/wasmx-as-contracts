// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
    id: "Tendermint_1",
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
              next: {
                target: "Validator",
              },
            },
          },
          Validator: {
            always: {
              target: "ValidatorProposer",
              guard: "isNextProposer",
            },
            on: {
              newBlockPrevote: {
                target: "Validator",
                actions: {
                  type: "sendPrevoteResponse",
                },
              },
              newBlockPrecommit: {
                target: "Validator",
                actions: {
                  type: "sendPrecommitResponse",
                },
              },
            },
          },
          ValidatorProposer: {
            entry: {
              type: "proposeBlock",
            },
            after: {
              roundTimeout: {
                target: "#Tendermint_1.initialized.Validator",
                actions: [],
                meta: {},
              },
            },
            initial: "prevoteState",
            states: {
              prevoteState: {
                always: {
                  target: "precommitState",
                  guard: "ifPrevoteThreshold",
                },
                on: {
                  prevote: {
                    target: "prevoteState",
                  },
                },
              },
              precommitState: {
                always: {
                  target: "commitState",
                  guard: "ifPrecommitThreshold",
                },
                on: {
                  precommit: {
                    target: "precommitState",
                  },
                },
              },
              commitState: {
                entry: [
                  {
                    type: "commit",
                  },
                  {
                    type: "cancelActiveIntervals",
                  },
                ],
                always: {
                  target: "#Tendermint_1.initialized.Validator",
                },
              },
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "" }
        | { type: "next" }
        | { type: "prevote" }
        | { type: "precommit" }
        | { type: "initialize" }
        | { type: "newBlockPrevote" }
        | { type: "newBlockPrecommit" },
    },
  },
  {
    actions: {
      reset: ({ context, event }) => {},
      commit: ({ context, event }) => {},
      proposeBlock: ({ context, event }) => {},
      sendPrevoteResponse: ({ context, event }) => {},
      sendPrecommitResponse: ({ context, event }) => {},
      cancelActiveIntervals: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      isNextProposer: ({ context, event }, params) => {
        return false;
      },
      "some condition": ({ context, event }, params) => {
        return false;
      },
      ifPrevoteThreshold: ({ context, event }, params) => {
        return false;
      },
      ifPrecommitThreshold: ({ context, event }, params) => {
        return false;
      },
      "New guard": ({ context, event }, params) => {
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
