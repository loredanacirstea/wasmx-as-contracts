// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
    context: {
      rounds: 3,
      sampleSize: 20,
      roundsCounter: 0,
      alphaThreshold: 11,
    },
    id: "general_3_Snowball",
    initial: "uncolored",
    states: {
      uncolored: {
        entry: [
          {
            type: "resetRoundsCounter",
            params: {
              roundsCounter: 0,
            },
          },
          {
            type: "resetColorConfidences",
          },
        ],
        on: {
          newColoredTransaction: {
            target: "colored",
            actions: {
              type: "setColor",
              params: {
                color: "color",
              },
            },
          },
          query: {
            target: "colored",
            actions: [
              {
                type: "sendResponse",
                params: {
                  color: "color",
                },
              },
              {
                type: "setColor",
                params: {
                  color: "color",
                },
              },
            ],
          },
        },
      },
      colored: {
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
              color: "color",
            },
          },
          {
            type: "calculateMajorityColor",
            params: {
              field: "majority",
              threshold: "alphaThreshold",
            },
          },
        ],
        always: {
          target: "limboColor",
          guard: "ifMajorityIsOther",
          actions: [
            {
              type: "resetRoundsCounter",
              params: {
                roundsCounter: 0,
              },
            },
            {
              type: "incrementColorConfidence",
              params: {
                color: "majority",
              },
            },
          ],
        },
        on: {
          query: {
            actions: {
              type: "sendResponse",
              params: {
                color: "color",
              },
            },
          },
          reset: {
            target: "uncolored",
          },
        },
      },
      limboColor: {
        always: [
          {
            target: "colored",
            guard: "ifMajorityConfidenceGTCurrent",
            actions: {
              type: "setColor",
              params: {
                color: "majority",
              },
            },
          },
          {
            target: "colored",
            guard: "ifIncrementedCounterLTBetaThreshold",
            actions: {
              type: "incrementRoundsCounter",
            },
          },
        ],
      },
    },
    types: {
      events: {} as
        | { type: "query"; color: string }
        | { type: "reset" }
        | { type: "newColoredTransaction"; color: string },
      context: {} as {
        rounds: number;
        sampleSize: number;
        roundsCounter: number;
        alphaThreshold: number;
      },
    },
  },
  {
    actions: {
      query: ({ context, event }) => {},
      reset: ({ context, event }) => {},
      setColor: ({ context, event }) => {},
      setcolor: ({ context, event }) => {},
      sendQuery: ({ context, event }) => {},
      selectSample: ({ context, event }) => {},
      sendResponse: ({ context, event }) => {},
      subtractRound: ({ context, event }) => {},
      getMajorityColor: ({ context, event }) => {},
      setColorReceived: ({ context, event }) => {},
      setColorFromEvent: ({ context, event }) => {},
      assignTemporaryCtx: ({ context, event }) => {},
      resetRoundsCounter: ({ context, event }) => {},
      selectRandomSample: ({ context, event }) => {},
      setRoundsRemaining: ({ context, event }) => {},
      incrementRoundCounter: ({ context, event }) => {},
      resetColorConfidences: ({ context, event }) => {},
      calculateMajorityColor: ({ context, event }) => {},
      incrementRoundsCounter: ({ context, event }) => {},
      incrementColorConfidence: ({ context, event }) => {},
    },
    actors: {},
    guards: {
      ifR: ({ context, event }, params) => {
        return false;
      },
      ifMajorityRed: ({ context, event }, params) => {
        return false;
      },
      "some condition": ({ context, event }, params) => {
        return false;
      },
      ifMajorityIsRed: ({ context, event }, params) => {
        return false;
      },
      ifMajorityIsBlue: ({ context, event }, params) => {
        return false;
      },
      ifCounterLTRounds: ({ context, event }, params) => {
        return false;
      },
      ifMajorityIsOther: ({ context, event }, params) => {
        return false;
      },
      ifRoundsRemaining: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTRounds: ({ context, event }, params) => {
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
