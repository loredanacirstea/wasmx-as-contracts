import { JSON } from "json-as/assembly";
import { QueryRegisterDescendantChainRequest } from "./types";
import { setChainData } from "./storage";

export function RegisterDescendantChain(req: QueryRegisterDescendantChainRequest): ArrayBuffer {
    // TODO authorization
    //
    // the higher level chain that these chains have composed
    setChainData(req.data);
    return new ArrayBuffer(0)
}
