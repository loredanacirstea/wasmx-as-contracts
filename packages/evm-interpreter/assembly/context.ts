import { Stack } from "./stack";
import { Logger } from "./logger";
import { Env } from './types';
import { Memory } from "./memory";

export class Context {
    stack: Stack;
    memory: Memory;
    env: Env;
    logger: Logger;
    bytecode: Array<u8>; // cached value for easy access
    pc: i32 = 0; // program counter

    constructor(_stack: Stack, _memory: Memory, _env: Env, _logger: Logger) {
        this.stack = _stack;
        this.memory = _memory;
        this.env = _env;
        this.logger = _logger;
        this.bytecode = _env.contract.bytecode;
    }
}
