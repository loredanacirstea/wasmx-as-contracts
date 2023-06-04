import { AccAddress, Coin, Coins, Balance, Params, SendEnabled, DenomMetadata } from './types';
import * as storage from './storage';
import { BigInt } from './bn';

// ValidateBalance(ctx context.Context, addr sdk.AccAddress) error
export function ValidateBalance(addr: AccAddress): void {

}

// HasBalance(ctx context.Context, addr sdk.AccAddress, amt sdk.Coin) bool
export function HasBalance(addr: AccAddress, amt: Coin): bool {
    return true;
}

// GetAllBalances(ctx context.Context, addr sdk.AccAddress) sdk.Coins
export function GetAllBalances(addr: AccAddress): Coins {
    return [];
}

// GetAccountsBalances(ctx context.Context) []types.Balance
export function GetAccountsBalances(): Balance[] {
    // Iterate all balances
    return [];
}

// GetBalance(ctx context.Context, addr sdk.AccAddress, denom string) sdk.Coin
export function GetBalance(addr: AccAddress, denom: string): Coin {
    return new Coin(denom, storage.getBalance(addr, denom));
}

// LockedCoins(ctx context.Context, addr sdk.AccAddress) sdk.Coins
export function LockedCoins(addr: AccAddress): Coins {
    return [];
}

// SpendableCoins(ctx context.Context, addr sdk.AccAddress) sdk.Coins
export function SpendableCoins(addr: AccAddress): Coins {
    return [];
}

// SpendableCoin(ctx context.Context, addr sdk.AccAddress, denom string) sdk.Coin
export function SpendableCoin(addr: AccAddress, denom: string): Coin {
    return new Coin(denom, BigInt.empty());
}

// IterateAccountBalances(ctx context.Context, addr sdk.AccAddress, cb func(coin sdk.Coin) (stop bool))
// IterateAllBalances(ctx context.Context, cb func(address sdk.AccAddress, coin sdk.Coin) (stop bool))

/** Send */


// InputOutputCoins(ctx context.Context, inputs types.Input, outputs []types.Output) error

// SendCoins(ctx context.Context, fromAddr sdk.AccAddress, toAddr sdk.AccAddress, amt sdk.Coins) error
export function SendCoins(fromAddr: AccAddress, toAddr: AccAddress, amt: Coins): void {
    //
}

// GetParams(ctx context.Context) types.Params
export function GetParams(): Params {
    return new Params();
}

// SetParams(ctx context.Context, params types.Params) error
export function SetParams(params: Params): void {

}

// IsSendEnabledDenom(ctx context.Context, denom string) bool
export function IsSendEnabledDenom(denom: string): bool {
    return true
}

// SetSendEnabled(ctx context.Context, denom string, value bool)
export function SetSendEnabled(denom: string, value: bool) {

}

// SetAllSendEnabled(ctx context.Context, sendEnableds []*types.SendEnabled)
export function SetAllSendEnabled(sendEnableds: SendEnabled[]) {

}

// DeleteSendEnabled(ctx context.Context, denom string)
export function DeleteSendEnabled(denom: string) {

}

// IterateSendEnabledEntries(ctx context.Context, cb func(denom string, sendEnabled bool) (stop bool))
// GetAllSendEnabledEntries(ctx context.Context) []types.SendEnabled

// IsSendEnabledCoin(ctx context.Context, coin sdk.Coin) bool
export function IsSendEnabledCoin(coin: Coin): bool {
    return true;
}

// IsSendEnabledCoins(ctx context.Context, coins ...sdk.Coin) error
export function IsSendEnabledCoins(coins: Coins) {

}

// BlockedAddr(addr sdk.AccAddress) bool
export function BlockedAddr(addr: AccAddress): bool {
    return true;
}


/** BaseKeeper */

// WithMintCoinsRestriction(MintingRestrictionFn) BaseKeeper

// InitGenesis(context.Context, *types.GenesisState)
// ExportGenesis(context.Context) *types.GenesisState

// GetSupply(ctx context.Context, denom string) sdk.Coin
export function GetSupply(denom: string): Coin {
    const amount = storage.getSupply(denom);
    return new Coin(denom, amount);
}

// HasSupply(ctx context.Context, denom string) bool
export function HasSupply(denom: string): bool {
    return true;
}

// GetPaginatedTotalSupply(ctx context.Context, pagination *query.PageRequest) (sdk.Coins, *query.PageResponse, error)
// IterateTotalSupply(ctx context.Context, cb func(sdk.Coin) bool)

// GetDenomMetaData(ctx context.Context, denom string) (types.Metadata, bool)
export function GetDenomMetaData(denom: string): DenomMetadata {
    return new DenomMetadata()
}

// HasDenomMetaData(ctx context.Context, denom string) bool
export function HasDenomMetaData(denom: string): bool {
    return true;
}

// SetDenomMetaData(ctx context.Context, denomMetaData types.Metadata)
export function SetDenomMetaData(denomMetaData: DenomMetadata): void {

}

// IterateAllDenomMetaData(ctx context.Context, cb func(types.Metadata) bool)

// SendCoinsFromModuleToAccount(ctx context.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
export function SendCoinsFromModuleToAccount(senderAddress: AccAddress, recipientAddr: AccAddress, amt: Coins): void {

}

// SendCoinsFromModuleToModule(ctx context.Context, senderModule, recipientModule string, amt sdk.Coins) error
export function SendCoinsFromModuleToModule(senderAddress: AccAddress, recipientAddress: AccAddress, amt: Coins): void {

}

// SendCoinsFromAccountToModule(ctx context.Context, senderAddr sdk.AccAddress, recipientModule string, amt sdk.Coins) error
export function SendCoinsFromAccountToModule(senderAddr: AccAddress, recipientAddress: AccAddress, amt: Coins): void {

}

// DelegateCoinsFromAccountToModule(ctx context.Context, senderAddr sdk.AccAddress, recipientModule string, amt sdk.Coins) error
export function DelegateCoinsFromAccountToModule(senderAddr: AccAddress, recipientAddress: AccAddress, amt: Coins): void {

}

// UndelegateCoinsFromModuleToAccount(ctx context.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
export function UndelegateCoinsFromModuleToAccount(senderAddr: AccAddress, recipientAddr: AccAddress, amt: Coins): void {

}

// MintCoins(ctx context.Context, moduleName string, amt sdk.Coins) error
export function MintCoins(moduleAddress: AccAddress, amt: Coins): void {
    // TODO module & denom permissions

    for (let i = 0; i < amt.length; i++) {
        const supply = GetSupply(amt[i].GetDenom());
        supply.Add(amt[i])
		setSupply(supply);

        const balance = storage.getBalance(moduleAddress, amt[i].GetDenom());
        storage.setBalance(moduleAddress, amt[i].GetDenom(), balance.add(amt[i].GetAmount()));
    }

}

// BurnCoins(ctx context.Context, moduleName string, amt sdk.Coins) error
export function BurnCoins(moduleAddress: AccAddress, amt: Coins): void {
    // TODO module & denom permissions
    // TODO underflow check

    for (let i = 0; i < amt.length; i++) {
        const supply = GetSupply(amt[i].GetDenom());
        supply.Sub(amt[i])
		setSupply(supply);

        const balance = storage.getBalance(moduleAddress, amt[i].GetDenom());
        storage.setBalance(moduleAddress, amt[i].GetDenom(), balance.sub(amt[i].GetAmount()));
    }
}

// DelegateCoins(ctx context.Context, delegatorAddr, moduleAccAddr sdk.AccAddress, amt sdk.Coins) error
export function DelegateCoins(delegatorAddr: AccAddress, moduleAccAddr: AccAddress, amt: Coins): void {

}

// UndelegateCoins(ctx context.Context, moduleAccAddr, delegatorAddr sdk.AccAddress, amt sdk.Coins) error
export function UndelegateCoins(moduleAccAddr: AccAddress, delegatorAddr: AccAddress, amt: Coins): void {

}

/** internal functions */


// setSupply sets the supply for the given coin
function setSupply(coin: Coin): void {
	// Bank invariants and IBC requires to remove zero coins.
	if (coin.IsZero()) {
        storage.removeSupply(coin.GetDenom())
	} else {
		storage.setSupply(coin.GetDenom(), coin.GetAmount());
	}
}
