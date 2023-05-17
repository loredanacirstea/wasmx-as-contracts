import { JSON } from "json-as/assembly";
import { getEnv } from './wasmx';
import { Env } from './types';

export function getEnvWrap(): Env {
    return JSON.parse<Env>(String.UTF8.decode(getEnv()));
}
