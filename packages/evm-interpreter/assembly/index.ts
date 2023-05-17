import { getEnvWrap } from './ethereum';
import { Stack } from "./stack";
import { Logger } from "./logger";
import { interpret } from './interpreter';
import { Context } from './context';
import { Memory } from './memory';

export function main(): u8[] {
  const stack = new Stack([]);
  const memory = new Memory([]);
  const env = getEnvWrap();
  const logger = new Logger();
  const ctx = new Context(stack, memory, env, logger);
  interpret(ctx);
  return ctx.env.currentCall.returnData;
}
