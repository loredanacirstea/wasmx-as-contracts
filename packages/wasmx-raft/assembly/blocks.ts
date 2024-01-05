
import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class LastBlockIndexResult {
    index: i64
    constructor(index: i64) {
        this.index = index;
    }
}
