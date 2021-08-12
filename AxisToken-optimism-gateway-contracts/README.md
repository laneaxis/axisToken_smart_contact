# Bridge Contracts

Contracts to swap tokens between L1 (ethereum) chain to L2 (optimism) chain.

## Prerequisite Software

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)

## Installation

1. Install dependencies
```bash
yarn install
```
2. Compile contracts
```bash
yarn compile
```

## Deploy contracts
The script will deploy 3 contracts and make some test transactions
```bash
node example.js
```
### L1 ERC
Mocked ERC token. _This is done only for development and testing._
### L1 Gateway 
Contract for L1 ethereum chain to lock (unlock) tokens on L1 chain and mint (burn) for inter-chains transfers.
### L2 ERC + Gateway
ERC token and gateway for L2 optimism chain

## L1 <> L2 Communication: Brief Summary

For example, you would pass data from L1 to L2 when initiating a process on L1, and finalizing it on L2, such as an L1 deposit and L2 withdrawal.
The [`L1CrossDomainMessenger`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol) will pass the L1 data to L2 by calling [`sendMessage`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/messaging/Abs_BaseCrossDomainMessenger.sol#L51-L61).
Then, the [`L2CrossDomainMessenger`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/messaging/OVM_L2CrossDomainMessenger.sol) calls [`relayMessage`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol#L79-L89) to relay the L1 data back to the receiving user.

Similarly, for an L2 to L1 deposit-withdrawal, message passing would start at the `L2CrossDomainMessenger` calling `sendMessage` and end with the message being relayed by the `L1CrossDomainMessenger` to L1.

For further information, you can review our [documentation on L1 <> L2 Communication on our community hub](https://community.optimism.io/docs/developers/integration.html#%E2%98%8E%EF%B8%8F-l1-l2-communication).

## Message Passing

In this repository, on [line 97](https://github.com/ethereum-optimism/l1-l2-deposit-withdrawal/blob/main/example.js#L97), we wait for the message to relayed by the `L2CrossDomainMessenger` and use the [`@eth-optimism/watcher`](https://www.npmjs.com/package/@eth-optimism/watcher) to retrieve the hash of message of the previous transaction, a deposit of an ERC20 on L1.

Likewise, on [line 115](https://github.com/ethereum-optimism/l1-l2-deposit-withdrawal/blob/main/example.js#L115), we wait for a second message to be relayed, but this time by the `L1CrossDomainMessenger` so that we can retrieve the message of `tx3`, a withdraw of an ERC20 on L2.
