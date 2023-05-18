import { getEnvWrap } from './evm';
import { Stack } from "./stack";
import { OpcodeLogger } from "./logger";
import { interpret } from './interpreter';
import { Context } from './context';
import { Memory } from './memory';
import { GasMeter } from './gas_meter';

export function main(): u8[] {
  const stack = new Stack([]);
  const memory = new Memory([]);
  const env = getEnvWrap();
  const logger = new OpcodeLogger("debug");
  const gasmeter = new GasMeter(env.currentCall.gasLimit);
  const ctx = new Context(stack, memory, env, logger, gasmeter);
  interpret(ctx);
  return ctx.env.currentCall.returnData;
}
