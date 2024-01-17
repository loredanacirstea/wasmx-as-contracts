// @ts-nocheck
/* eslint-disable */
import { createMachine } from "xstate";

export const machine = createMachine(
  {
    context: {
      sampleSize: 20,
      betaThreshold: 3,
      redConfidence: 0,
      roundsCounter: 0,
      alphaThreshold: 11,
      blueConfidence: 0,
    },
    id: "3_Snowball-BFT",
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
            type: "resetRedConfidence",
            params: {
              redConfidence: 0,
            },
          },
          {
            type: "resetBlueConfidence",
            params: {
              blueConfidence: 0,
            },
          },
        ],
        on: {
          newRedTransaction: {
            target: "red",
          },
          newBlueTransaction: {
            target: "blue",
          },
          queryRed: {
            target: "red",
            actions: {
              type: "sendResponse",
              params: {
                color: "red",
              },
            },
          },
          queryBlue: {
            target: "blue",
            actions: {
              type: "sendResponse",
              params: {
                color: "blue",
              },
            },
          },
        },
      },
      red: {
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
              color: "red",
            },
          },
          {
            type: "getMajorityColor",
            params: {
              threshold: "alphaThreshold",
            },
          },
        ],
        always: {
          target: "limboRed",
          guard: "ifMajorityIsBlue",
          actions: [
            {
              type: "resetRoundsCounter",
              params: {
                roundsCounter: 0,
              },
            },
            {
              type: "incrementBlueConfidence",
            },
          ],
        },
        on: {
          queryRed: {
            actions: {
              type: "sendResponse",
              params: {
                color: "red",
              },
            },
          },
          queryBlue: {
            actions: {
              type: "sendResponse",
              params: {
                color: "red",
              },
            },
          },
          reset: {
            target: "uncolored",
          },
        },
      },
      blue: {
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
              color: "blue",
            },
          },
          {
            type: "getMajorityColor",
            params: {
              threshold: "alphaThreshold",
            },
          },
        ],
        always: {
          target: "limboBlue",
          guard: "ifMajorityIsRed",
          actions: [
            {
              type: "resetRoundsCounter",
              params: {
                roundsCounter: 0,
              },
            },
            {
              type: "incrementRedConfidence",
            },
          ],
        },
        on: {
          queryRed: {
            actions: {
              type: "sendResponse",
              params: {
                color: "blue",
              },
            },
          },
          queryBlue: {
            actions: {
              type: "sendResponse",
              params: {
                color: "blue",
              },
            },
          },
          reset: {
            target: "uncolored",
          },
        },
      },
      limboRed: {
        always: [
          {
            target: "blue",
            guard: "ifBlueConfidenceGTRed",
          },
          {
            target: "red",
            guard: "ifIncrementedCounterLTBetaThreshold",
            actions: {
              type: "incrementRoundsCounter",
            },
          },
        ],
      },
      limboBlue: {
        always: [
          {
            target: "red",
            guard: "ifRedConfidenceGTBlue",
          },
          {
            target: "blue",
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
        | { type: "reset" }
        | { type: "queryRed" }
        | { type: "queryBlue" }
        | { type: "newRedTransaction" }
        | { type: "newBlueTransaction" }
        | { type: "newColoredTransaction"; color: string },
      context: {} as {
        rounds: number;
        sampleSize: number;
        betaThreshold: number;
        redConfidence: number;
        roundsCounter: number;
        alphaThreshold: number;
        blueConfidence: number;
      },
    },
  },
  {
    actions: {
      query: ({ context, event }) => {},
      reset: ({ context, event }) => {},
      sendQuery: ({ context, event }) => {},
      selectSample: ({ context, event }) => {},
      sendResponse: ({ context, event }) => {},
      subtractRound: ({ context, event }) => {},
      resetRedCounter: ({ context, event }) => {},
      getMajorityColor: ({ context, event }) => {},
      resetRedConfidence: ({ context, event }) => {},
      resetRoundsCounter: ({ context, event }) => {},
      selectRandomSample: ({ context, event }) => {},
      setRoundsRemaining: ({ context, event }) => {},
      resetBlueConfidence: ({ context, event }) => {},
      incrementRedConfidence: ({ context, event }) => {},
      incrementRoundsCounter: ({ context, event }) => {},
      incrementBlueConfidence: ({ context, event }) => {},
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
      ifRoundsRemaining: ({ context, event }, params) => {
        return false;
      },
      ifBlueConfidenceGTRed: ({ context, event }, params) => {
        return false;
      },
      ifRedConfidenceGTBlue: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTRounds: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTBetaThreshold: ({ context, event }, params) => {
        return false;
      },
    },
    delays: {},
  },
);
