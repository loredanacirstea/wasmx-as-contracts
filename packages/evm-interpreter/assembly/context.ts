import { Stack } from './stack';
import { OpcodeLogger } from './logger';
import { Env } from './types';
import { Memory } from './memory';
import { GasMeter } from './gas_meter';

export class Context {
    keccakOffset: usize; // 1024 bytes reserved context space
    stack: Stack;
    memory: Memory;
    env: Env;
    logger: OpcodeLogger;
    gasmeter: GasMeter;
    pc: i32 = 0; // program counter

    constructor(stack: Stack, memory: Memory, env: Env, logger: OpcodeLogger, gasmeter: GasMeter) {
        this.stack = stack;
        this.memory = memory;
        this.env = env;
        this.logger = logger;
        this.gasmeter = gasmeter;
        this.keccakOffset = heap.alloc(1024);
    }

    resetKeccakSpace(): void {
        memory.fill(this.keccakOffset, 0, 1024);
    }
}
