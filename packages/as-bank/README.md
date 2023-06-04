# bank

Modeled after
https://github.com/cosmos/cosmos-sdk/tree/8f6a94cd1f9f1c6bf1ad83a751da86270db92e02/x/bank

## Data


address => denom => balance
0x2 | byte(address length) | []byte(address) | []byte(balance.Denom) -> ProtocolBuffer(balance)

denom => metadata
0x1 | byte(denom) -> ProtocolBuffer(Metadata)

denom => total supply
0x0 | byte(denom) -> byte(amount)

Reverse Denomination to Address Index
0x03 | byte(denom) | 0x00 | []byte(address) -> 0

- total supply

Account balances
Denomination metadata
The total supply of all balances
Information on which denominations are allowed to be sent.

## API

- mint
- burn
- transfer

- accounts already exist

## Permissions

- whitelist for denoms and accounts
- blacklist for denoms and accounts
- eid only
- coins might be locked (eg. staked)


## Special Accounts

- module accounts? - e.g. account for Go modules

permissions for modules:
- minter
- burner
- staking



