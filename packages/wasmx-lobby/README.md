# lobby contract

Consensusless contract used to negotiate a new chain with other validators.

Trustworthy checks:
* an off-chain list of trustworthy node bech32 addresses (operators) - can be taken from mythos verified users & updated each minute/hour.

* new node sends `MsgNewChainRequest`
* nodes in-waiting add the node to their list & send `MsgNewChainResponse`; where they sign the new validator list (lexicographically ordered);
* nodes receive `MsgNewChainResponse` & update their list of signatures
* if last known chainId changes, we need to start again
* when a `MsgNewChainResponse` circulates with min number of validators, the first validator in the list prepares genesis & gentx & subchains infomation (for > level1)) & sends it to a room specific to the chainId
* when validators collect all needed gentx, the lobby contract initializes the new chain.





