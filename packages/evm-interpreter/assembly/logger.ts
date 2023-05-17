export class Logger {
    logs!: string[];

    push(log: string): void {
        this.logs.push(log);
    }
}
