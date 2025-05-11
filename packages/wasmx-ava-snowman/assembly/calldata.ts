import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    ExternalActionCallData,
} from 'xstate-fsm-as/assembly/types';


export function getCallDataWrap(): ExternalActionCallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<ExternalActionCallData>(String.UTF8.decode(calldraw));
}
