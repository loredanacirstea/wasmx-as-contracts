// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
    context: {
      sampleSize: "2",
      betaThreshold: 2,
      roundsCounter: "0",
      alphaThreshold: 80,
    },
    id: "general_4_Snowman-BFT_2",
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
                target: "validator",
              },
              setupNode: {
                target: "unstarted",
                actions: {
                  type: "setupNode",
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
                actions: {
                  type: "proposeBlock",
                  params: {
                    transaction: "$transaction",
                  },
                },
              },
              query: [
                {
                  target: "preProposer",
                  guard: "ifBlockNotFinalized",
                  actions: [
                    {
                      type: "setProposedBlock",
                      params: {
                        block: "$block",
                        header: "$header",
                      },
                    },
                    {
                      type: "sendResponse",
                      params: {
                        block: "$block",
                        header: "$header",
                      },
                    },
                  ],
                },
                {
                  target: "validator",
                  actions: {
                    type: "sendResponse",
                  },
                },
              ],
              stop: {
                target: "stopped",
              },
            },
          },
          prestart: {
            after: {
              "500": {
                target: "#general_4_Snowman-BFT_2.initialized.validator",
                actions: [],
                meta: {},
              },
            },
          },
          proposer: {
            entry: {
              type: "majorityFromRandomSet",
              params: {
                k: "$sampleSize",
              },
            },
            always: [
              {
                target: "proposer",
                guard: "ifMajorityLTAlphaThreshold",
                actions: {
                  type: "resetRoundsCounter",
                  params: {
                    roundsCounter: 0,
                  },
                },
              },
              {
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
                      hash: "$majority",
                    },
                  },
                ],
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
            on: {
              query: {
                actions: {
                  type: "sendResponse",
                  params: {
                    block: "$proposedBlock",
                    header: "$proposedHeader",
                  },
                },
              },
              stop: {
                target: "stopped",
              },
            },
          },
          preProposer: {
            after: {
              "500": {
                target: "#general_4_Snowman-BFT_2.initialized.proposer",
                actions: [],
                meta: {},
              },
            },
            on: {
              query: {
                actions: {
                  type: "sendResponse",
                  params: {
                    block: "$proposedBlock",
                    header: "$proposedHeader",
                  },
                },
              },
            },
          },
          stopped: {
            on: {
              restart: {
                target: "unstarted",
              },
            },
          },
          limboProposer: {
            always: [
              {
                target: "proposer",
                guard: "ifMajorityConfidenceGTCurrent",
                actions: {
                  type: "changeProposedBlock",
                  params: {
                    hash: "$majority",
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
        | { type: "stop" }
        | { type: "query"; block: string; header: string }
        | { type: "setup"; address: string }
        | { type: "start" }
        | { type: "restart" }
        | { type: "prestart" }
        | {
            type: "setupNode";
            nodeIPs: string;
            currentNodeId: string;
            initChainSetup: string;
          }
        | { type: "initialize" }
        | { type: "newTransaction"; transaction: string },
      context: {} as {
        sampleSize: string;
        betaThreshold: number;
        roundsCounter: string;
        alphaThreshold: string;
      },
    },
  },
  {
    actions: {
      setup: ({ context, event }) => {},
      assign: ({ context, event }) => {},
      selectRan: ({ context, event }) => {},
      sendQuery: ({ context, event }) => {},
      setupNode: ({ context, event }) => {},
      resetRounds: ({ context, event }) => {},
      prepareBlock: ({ context, event }) => {},
      proposeBlock: ({ context, event }) => {},
      sendResponse: ({ context, event }) => {},
      setBlockHash: ({ context, event }) => {},
      finalizeBlock: ({ context, event }) => {},
      setProposedHash: ({ context, event }) => {},
      resetConfidences: ({ context, event }) => {},
      setProposedBlock: ({ context, event }) => {},
      changeProposedHash: ({ context, event }) => {},
      resetRoundsCounter: ({ context, event }) => {},
      selectRandomSample: ({ context, event }) => {},
      incrementConfidence: ({ context, event }) => {},
      sendQueryToRandomSet: ({ context, event }) => {},
      setMajorityAsCurrent: ({ context, event }) => {},
      calculateMajorityHash: ({ context, event }) => {},
      calculateMajorityColor: ({ context, event }) => {},
      incrementRoundsCounter: ({ context, event }) => {},
      incrementProposedBlockConfidence: ({ context, event }) => {},
      getMajorityFromToRandomSet: ({ context, event }) => {},
      majorityFromRandomSet: ({ context, event }) => {},
      changeProposedBlock: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      ifMajorityIsOther: ({ context, event }, params) => {
        return false;
      },
      ifBlockNotFinalized: ({ context, event }, params) => {
        return false;
      },
      ifMajorityConfidenceGTCurrent: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTBetaThreshold: ({ context, event }, params) => {
        return false;
      },
      ifGTAlphaThreshold: ({ context, event }, params) => {
        return false;
      },
      ifMajorityLTAlphaThreshold: ({ context, event }, params) => {
        return false;
      },
      "New guard": ({ context, event }, params) => {
        return false;
      },
    },
    delays: {},
  },
);
