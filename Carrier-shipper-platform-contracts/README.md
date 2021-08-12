# Carrier-shipper-platfrom-contracts

## Overview
---

### Deploy Contracts
---

#### Deployment config ####
```
{
  "INFURA_KEY": "",
  "PRIVATE_KEY": "",
  "ETHERSCAN_KEY": "",
  "BSCSCAN_KEY": "",
  "MIGRATION_DIRECTORY": "./output/migrations",
  "GAS_PRICE": "",
  "USDC": {
    "ADDRESS": ""
  },
  "CONTROLLER": {
    "AXIS_ADDRESS": "",
    "INITIAL_FEE": "",
    "OWNERS": ""
  }
}
```

#### Migration ####

```bash
# Install packages
$ yarn
# Compile contracts
$ yarn compile
# Testnet
$ yarn migrate:kovan
# Mainnet
$ yarn migrate:mainnet
# Verify contracts testnet
$ yarn verify:kovan <CONTRACT_NAME>
# Verify contracts mainnet
$ yarn verify:mainnet <CONTRACT_NAME>
```

### Tests
For tests running its needed to pre install and run [ganache-cli](https://github.com/trufflesuite/ganache-cli)
```bash
yarn test
```
For coverage:
```bash
yarn coverage