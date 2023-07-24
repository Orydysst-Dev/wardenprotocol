package types

import (
	"fmt"
	"math/big"
)

func (w *Wallet) SetId(id uint64) { w.Id = id }

type WalletI interface {
	// Address returns a human readable version of the address.
	Address() string
}

var ErrUnknownWalletType = fmt.Errorf("error in NewWalletI: unknown wallet type")

func NewWalletI(w *Wallet, k *Key) (WalletI, error) {
	if w.KeyId != k.Id {
		return nil, fmt.Errorf("invalid key id, wallet wants key with id %d, got key with id %d", w.KeyId, k.Id)
	}

	switch w.Type {
	case WalletType_WALLET_TYPE_QRDO:
		return NewFusionWallet(w, k)
	case WalletType_WALLET_TYPE_ETH:
		return NewEthereumWallet(w, k)
	case WalletType_WALLET_TYPE_ETH_SEPOLIA:
		return NewEthereumWallet(w, k)
	}

	return nil, ErrUnknownWalletType
}

// Transfer represents a generic transfer of tokens on a layer 1 blockchain.
// Ideally, this will be the object passed to Blackbird for applying policy.
type Transfer struct {
	To             []byte
	Amount         *big.Int
	CoinIdentifier []byte
}

// TxParser can be implemented by wallets that are able to parse unsigned
// transactions into the common Layer1Tx format.
//
// By doing that, wallets can expose more functionalities (i.e. Blackbird
// policies).
type TxParser interface {
	ParseTx(b []byte) (Transfer, error)
}
