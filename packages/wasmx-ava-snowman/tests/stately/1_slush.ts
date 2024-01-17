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
    id: "1_Slush",
    initial: "uncolored",
    states: {
      uncolored: {
        entry: {
          type: "resetRoundsCounter",
          params: {
            roundsCounter: 0,
          },
        },
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
          {
            type: "incrementRoundCounter",
          },
        ],
        always: [
          {
            target: "blue",
            guard: "ifMajorityIsBlue",
          },
          {
            target: "red",
            guard: "ifCounterLTRounds",
          },
        ],
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
          {
            type: "incrementRoundCounter",
          },
        ],
        always: [
          {
            target: "red",
            guard: "ifMajorityIsRed",
          },
          {
            target: "blue",
            guard: "ifCounterLTRounds",
          },
        ],
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
        roundsCounter: number;
        alphaThreshold: number;
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
      getMajorityColor: ({ context, event }) => {},
      resetRoundsCounter: ({ context, event }) => {},
      selectRandomSample: ({ context, event }) => {},
      setRoundsRemaining: ({ context, event }) => {},
      incrementRoundCounter: ({ context, event }) => {},
      incrementRoundsCounter: ({ context, event }) => {},
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
      ifRoundsRemaining: ({ context, event }, params) => {
        return false;
      },
      ifIncrementedCounterLTRounds: ({ context, event }, params) => {
        return false;
      },
    },
    delays: {},
  },
);
