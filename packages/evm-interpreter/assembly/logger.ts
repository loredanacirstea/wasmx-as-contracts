import { u8ArrayToHex } from "./utils";

export class OpcodeLog {
    name: string;
    inputs: u8[][] = [];
    outputs: u8[][] = [];
    pc: i32 = 0;
    constructor(name: string, inputs: u8[][] = [], outputs: u8[][] = [], pc: i32 = 0) {
        this.name = name;
        this.inputs = inputs;
        this.outputs = outputs;
        this.pc = pc;
    }
}

export class OpcodeLogger {
    logs: OpcodeLog[] = [];
    level: string;
    isDebug: bool = false;
    constructor(level: string) {
        this.level = level;
        if (this.level === 'debug') this.isDebug = true;
    }

    debug(name: string, inputs: u8[][] = [], outputs: u8[][] = [], pc: i32 = 0): void {
        const log = new OpcodeLog(name, inputs, outputs, pc);
        this.logs.push(log);
        console.log("op: " + name);
        console.log("inputs: " + toHex(inputs).toString());
        console.log("outputs: " + toHex(outputs).toString());
    }
}

function toHex(arr: u8[][]): string[] {
    return arr.map((v: u8[]) => u8ArrayToHex(v));
}
