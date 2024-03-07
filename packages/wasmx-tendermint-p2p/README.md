# tendermint p2p


## States

Node - Validator - Proposer

- simpleNodesInfo[index] - for Nodes
- validatorNodesInfo[index] - for Validators

- prevoteArray[nodeindex] = prevotes for each block
- precommitArray[nodeIndex] = precommit for each block

- prevotes, precommits, new transactions -> sent to chat rooms

