import { uint8ArrayToHex } from "./utils";

export class OpcodeLog {
    name: string;
    inputs: Array<Uint8Array> = [];
    outputs: Array<Uint8Array> = [];
    pc: i32 = 0;
    constructor(name: string, inputs: Array<Uint8Array> = [], outputs: Array<Uint8Array> = [], pc: i32 = 0) {
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

    debug(name: string, inputs: Array<Uint8Array> = [], outputs: Array<Uint8Array> = [], pc: i32 = 0): void {
        const log = new OpcodeLog(name, inputs, outputs, pc);
        this.logs.push(log);
        console.log("op: " + name);
        console.log("inputs: " + toHex(inputs).toString());
        console.log("outputs: " + toHex(outputs).toString());
    }
}

function toHex(arr: Array<Uint8Array>): string[] {
    return arr.map((v: Uint8Array) => uint8ArrayToHex(v));
}
