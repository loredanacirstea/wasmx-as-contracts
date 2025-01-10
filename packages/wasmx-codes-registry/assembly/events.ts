
// WasmModuleEventType is stored with any contract TX that returns non empty EventAttributes
export const WasmModuleEventType = "wasmx"
// CustomContractEventPrefix contracts can create custom events. To not mix them with other system events they got the `wasmx-` prefix.
export const CustomContractEventPrefix = "wasmx"

export const EventTypeStoreCode   = "store_code"
export const EventTypeInstantiate = "instantiate"
export const EventTypeDeploy      = "deploy"
export const EventTypeExecute     = "execute"
export const EventTypeExecuteEth  = "execute-eth"
export const EventTypeMigrate     = "migrate"
export const EventTypePinCode     = "pin_code"
export const EventTypeUnpinCode   = "unpin_code"

// event attributes returned from contract execution
export const AttributeReservedPrefix = "_"

export const AttributeKeyContractAddr        = "contract_address"
export const AttributeKeyCodeID              = "code_id"
export const AttributeKeyChecksum            = "code_checksum"
export const AttributeKeyResultDataHex       = "result"
export const AttributeKeyRequiredCapability  = "required_capability"

export const AttributeKeyDependency = "dependency"

// this is prefixed with types CustomContractEventPrefix
export const EventTypeWasmxLog               = "log"
export const AttributeKeyEventType           = "type"
export const AttributeKeyIndex               = "index"
export const AttributeKeyData                = "data"
export const AttributeKeyTopic               = "topic"
export const AttributeKeyCallContractAddress = "contract_address_call"
