import { BigInt } from "./bn";
import { Context } from './context';
import { opByCode } from './opcodes_info';
import { opcodesMap, handlePush, handleDup, handleSwap } from './opcodes';

export function interpret(ctx: Context): void {
    interpretOpcode(ctx);
    if (ctx.pc > 0) {
        interpret(ctx);
    }
}

function interpretOpcode (ctx: Context): void {
    const bytecode = ctx.env.contract.bytecode;
    let code: u8;
    const args: BigInt[] = [];
    if (ctx.pc > bytecode.length) throw new Error(`Invalid pc ${ctx.pc}. Codesize ${bytecode.length}`);
    if (bytecode.length > ctx.pc) {
        code = bytecode[ctx.pc];
    }
    else {
        opcodesMap.get('stop')(ctx, []);
        return;
    }
    ctx.pc += 1;
    const invalidError = `Invalid opcode ${code}`;
    if (ctx.logger.isDebug) {
        console.log("opcode: " + code.toString())
    }

    if (u8(0x60) <= code && code < u8(0x80)) {
        handlePush(ctx, code);
    } else if (u8(0x80) <= code && code < u8(0x90)) {
        handleDup(ctx, code);
    } else if (u8(0x90) <= code && code < u8(0xa0)) {
        handleSwap(ctx, code);
    } else if (opByCode.has(code)) {
        const opcode = opByCode.get(code);
        if (!opcodesMap.has(opcode.name)) {
            throw new Error('No function for opcode ' + code.toString() + ' - ' + opcode.name);
        }

        for (let i = 0; i < opcode.arity; i++) {
            args.push(ctx.stack.pop());
        }
        opcodesMap.get(opcode.name)(ctx, args);
        if (opcode.name === 'jump') {
            if (bytecode[ctx.pc] !== 0x5b) {
                throw new Error(`Invalid JUMP destination ${ctx.pc}`);
            }
        }
    } else {
        throw new Error(invalidError);
    }
}
