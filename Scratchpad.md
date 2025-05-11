
## tendermint

Node - Validator - Proposer

- simpleNodesInfo[index] - for Nodes
- validatorNodesInfo[index] - for Validators

- prevoteArray[nodeindex] = prevotes for each block
- precommitArray[nodeIndex] = precommit for each block

- prevotes, precommits, new transactions -> sent to chat rooms


TODO:
- verifies the block headers and the commit signatures when receiving a block
- cancel active intervals dont start them if the contract canceled them.
- after delay once = true; -> we only trigger one interval, once the condition is fulfilled and not a second time during the state!!!
- include in the block commit - CommitInfo (RequestProcessProposal, RequestFinalizeBlock)
- fix getNextProposer()
- TODO prdction read remove all logdebugs
- TODO FROM field: from what peer we have received the message
- cache decoded input, so event actions dont need to decode each time

## level0

creates blocks on demand - send fake tx bytes
interval for masterhash -> layer1room(name(3 nodes))
interval for enscribing the masterhash back into the L0

content: Base64String[]
hash content -> entropy -> timechain
- get block with that entropy

-> create L0 block - take time block has header & hash
add tx data
-> if masterhash interval -> send block in a common room for L1

time from l0 (same for all 3)

l0; - registry
requestToJoin - l0 creates L1

- not have L1 -> create the contract
- accept invitation
- standby ; keep info in l0
-> start chain when 3
- instantiate contract, first block has the nodes;

receiveInvite
sendInvite for level
tryCreateNextLayer - deploy contract if not deployed

level0 - registry
- invite -> add to registry
- if 3 -> send first block to all (deterministic block; alphab order of addresses)
-> spawn level 1

nodes  - members - representative

promoting
seeker

blocktime - mempool - prepareblock -> send to other 2


addToMempool
sendNewTransactionResponse

setmembers
chatroom, chainid

- deploy chainid, deploy base contracts for staking, bank, whatever
- only one node -> our own chain;


storage - chainid key - when initializing it

ticker
level0 - receive all invites
level0 -> deploys level when members come
levelx -> deployed with genesis & members -
-> role "levelx"

produceBlock -> getLastBlock from ticker/leveln-1

newtx -> 1 node introduces it;
lock contract state for storage key xxxxx_
tx - (contractAddress, storage key) - lift - send to representative - > next representative -> to correct level
-> payment for all; fixes fees for each level - received on the last level

- each group - inwaiting nodes -
representative sends his peer list as inwaiting nodes
node is down -> a node from the list is invited to the level

- create level with members & possible members
- validator, inwaitingValidator
- staking info - contract

newtransaction
transaction -> chain
run tx on chain data
consensusStorageType = chainid; any migration will migrate chainids

-> chainid + role will determine the contract address
- each tx - chainid;
- processes for each chain level;


state hash

addAssets - can be lifted to some other chain
moveCrossChain - data hash - + blockhash + all hashes to top hash + merkle proof data
challenges - that execute all tx; - punish the validator

deployNextLevel - also register StartNode hook

- lifting a tx to a higher level; -

storage; deploy set of contracts

group of people -> create their own chain

MsgInitGenesis


mythosd query wasmx call mythos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpsks57yc "{\"GetAllValidators\":{}}" --from node0 --keyring-backend test --chain-id mythos_7000-23 --home=./testnet/node0/mythosd


parent creation - atomic tx on child chains
gentx - presigned by a validator for each chain
- sent as atomic tx at node setup

create atomictx from smart contract - from registry contract

createLevelAtomicTx -> signed offchain -> when registering a validator
- chainId
- subchainId
execmsg

parent chains create

multichain registry - genesis
set multichain registry genesis - store the setup transactions for current chain
multichain registry - create atomictx

atomictx -> calls multichain registry on parent -> makes a call to child chain with its info.
child chain - verifies the caller is a multichainregistry address by consensus
TODO roles should be addresses

registry can check address now, but should be role.

setup()

- child chains - validators propose a level2 chain on their own chain

- consensus - initialize chain (deterministic request)
-> mythos creates new chain
-> each node receives event -> mythos to child chains cross chain tx
-

- chain - validator proposes for level2
- another chain
- validators - register configs for another chain
- so, cross chain tx can be done
- atomic tx signed, from each chain, that stores on all other chains

- register default level2 ->
- crosschain tx between chains

messages that create a level1 chain
lobby contract - nonconsensus

lobby ; level0 contract

level0 -> leveln contract
level0 = lobby

level0 - p2p negotiation.
level0 - creates identity -
lobby part of level0 ?

level0 - store temp genesis/gentx
- create, init chain
level1 - store temp genesis/gents -> create, init new chain
lobby contract - just storage contract for level0

sdk for lobby contract
sdk.ts

- registry local
- multichain registry - keep gentx
- multichain local registry - keeps our chainids ; should also keep temp gentx data.
- multichain data - nonconsensusless; crosschain tx

createIdentity

- level0 - connect to room
- multichain registry - keep configs;
- governance - propose representative;
- nc negotiation -> validator repres makes tx to store data in multichain registry

lobby - in level0/1 etc.
lobby ->

- level0 - init chain

- receive chainId
- gentx
- node - add new node; - send to peers; order alphabetically if competing validators;
- add node, send message

- get assigned a chain index
-

lobby - on level0 for level1; on level1 for level2
currentlevel
last chainindex

level1 - has lobby contract - its own general room for creating level1 chains

level1 - lobby - identity; registered on each layer1 - validators from a chain should check identity on the other chains; & send transactions

level0 - each validator can offline check mythos & decide.

- signatures with last chain id - how do you verify the node is trustworthy? an off-chain list of trustworthy node addresses - can be mythos verified users


TODO
- reuse previous term block proposal - expect new signatures with correct round
- make level0 private - or be able to set a chain as private; or unique ID
- last received chain id fix by new nodes
