// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
    id: "general_4_Snowman-BFT_LoresVersion",
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
        initial: "validator",
        states: {
          validator: {
            entry: [
              {
                type: "resetRoundsCounter",
              },
              {
                type: "resetConfidences",
              },
            ],
            on: {
              newTransaction: {
                target: "proposer",
                actions: [
                  {
                    type: "prepareBlock",
                  },
                  {
                    type: "setProposedHash",
                    params: {
                      proposedHash: "proposedHash",
                    },
                  },
                  {
                    type: "incrementConfidence",
                    params: {
                      field: "proposedHash",
                    },
                  },
                ],
              },
              query: {
                target: "proposer",
                actions: [
                  {
                    type: "setProposedHash",
                    params: {
                      proposedHash: "hash",
                    },
                  },
                  {
                    type: "sendResponse",
                    params: {
                      hash: "hash",
                    },
                  },
                ],
              },
            },
          },
          proposer: {
            entry: [
              {
                type: "selectRandomSample",
                params: {
                  k: "sampleSize",
                },
              },
              {
                type: "sendQuery",
                params: {
                  hash: "proposedHash",
                },
              },
              {
                type: "calculateMajorityHash",
                params: {
                  field: "majority",
                  threshold: "alphaThreshold",
                },
              },
            ],
            always: {
              target: "limboProposer",
              guard: "ifMajorityIsOther",
              actions: [
                {
                  type: "resetRoundsCounter",
                  params: {
                    roundsCounter: 0,
                  },
                },
                {
                  type: "incrementConfidence",
                  params: {
                    field: "majority",
                  },
                },
              ],
            },
            on: {
              query: {
                actions: {
                  type: "sendResponse",
                  params: {
                    hash: "proposedHash",
                  },
                },
              },
            },
          },
          limboProposer: {
            always: [
              {
                target: "proposer",
                guard: "ifMajorityConfidenceGTCurrent",
                actions: {
                  type: "setProposedHash",
                  params: {
                    proposedHash: "majority",
                  },
                },
              },
              {
                target: "proposer",
                guard: "ifIncrementedCounterLTBetaThreshold",
                actions: {
                  type: "incrementRoundsCounter",
                },
              },
              {
                target: "validator",
                actions: {
                  type: "finalizeBlock",
                },
              },
            ],
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "" }
        | { type: "query"; hash: string }
        | { type: "initialize" }
        | { type: "newTransaction"; transaction: string },
    },
  },
  {
    actions: {
      selectRan: ({ context, event }) => {},
      sendQuery: ({ context, event }) => {},
      resetRounds: ({ context, event }) => {},
      prepareBlock: ({ context, event }) => {},
      sendResponse: ({ context, event }) => {},
      setBlockHash: ({ context, event }) => {},
      finalizeBlock: ({ context, event }) => {},
      setProposedHash: ({ context, event }) => {},
      resetConfidences: ({ context, event }) => {},
      resetRoundsCounter: ({ context, event }) => {},
      selectRandomSample: ({ context, event }) => {},
      incrementConfidence: ({ context, event }) => {},
      calculateMajorityHash: ({ context, event }) => {},
      calculateMajorityColor: ({ context, event }) => {},
      incrementRoundsCounter: ({ context, event }) => {},
      incrementProposedBlockConfidence: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      ifMajorityIsOther: ({ context, event }, params) => {
        return false;
      },
      ifMajorityConfidenceGTCurrent: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTBetaThreshold: ({ context, event }, params) => {
        return false;
      },
    },
    delays: {},
  },
);
