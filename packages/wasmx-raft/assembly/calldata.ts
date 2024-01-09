import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { ExternalActionCallData } from './fsm';

export function getCallDataWrap(): ExternalActionCallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<ExternalActionCallData>(String.UTF8.decode(calldraw));
}
