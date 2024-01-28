import { JSON } from "json-as/assembly";
import { getParamsInternal, setParams, setNewValidator, getParams, getValidatorsAddresses, getValidator } from './storage';
import { MsgInitGenesis, MsgCreateValidator, Validator, Unbonded, Commission, CommissionRates, ValidatorUpdate, QueryValidatorsResponse } from './types';
import { revert } from './utils';

export function GetAllValidators(): ArrayBuffer {
    const addrs = getValidatorsAddresses()
    const validators = new Array<Validator>(addrs.length)
    for (let i = 0; i < validators.length; i++) {
        const valid = getValidator(addrs[i]);
        if (valid != null) {
            validators[i] = valid;
        }
    }
    let data = JSON.stringify<QueryValidatorsResponse>(new QueryValidatorsResponse(validators))
    data = data.replaceAll(`"anytype"`, `"@type"`)
    return String.UTF8.encode(data)
}
