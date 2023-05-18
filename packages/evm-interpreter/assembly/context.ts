import { Stack } from './stack';
import { OpcodeLogger } from './logger';
import { Env } from './types';
import { Memory } from './memory';
import { GasMeter } from './gas_meter';

export class Context {
    stack: Stack;
    memory: Memory;
    env: Env;
    logger: OpcodeLogger;
    gasmeter: GasMeter;
    bytecode: Array<u8>; // cached value for easy access
    pc: i32 = 0; // program counter

    constructor(stack: Stack, memory: Memory, env: Env, logger: OpcodeLogger, gasmeter: GasMeter) {
        this.stack = stack;
        this.memory = memory;
        this.env = env;
        this.logger = logger;
        this.bytecode = env.contract.bytecode;
        this.gasmeter = gasmeter;
    }
}
