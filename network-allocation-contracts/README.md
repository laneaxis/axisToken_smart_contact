# lockup_contract
This repo will have a code of axisToken Lockup &amp; Smart Contracts.

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
  "MIGRATION_DIRECTORY": "./dist/migrations",
  "GAS_PRICE": ,
  "LOCKUP": {
    "OWNER": "",
    "TOKEN": "",
    "LOCKUP_DURATION": "",
    "UNLOCK_DURATION": "",
    "UNLOCK_INTERVALS_COUNT": ""
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
$ yarn verify:kovan Lockup
# Verify contracts mainnet
$ yarn verify:mainnet Lockup
```
### Tests
For tests running its needed to pre install and run [ganache-cli](https://github.com/trufflesuite/ganache-cli)
```bash
yarn test
```
For coverage:
```bash
yarn coverage
```

### METHODS CONTRACT ###
    
    Getters:
    1. unlockIntervalsCount - get inlock intervals count 
    2. lockupDuration - get the duration of the blocking period before the start of token defrosting
    3. unlockDuration - get the duration of the token unlock period
    4. totalDeposit - get total deposit token
    5. availableToWithdraw - Get available to withdraw token for user
    6. getDeposit - get user deposit info
    7. getDeposits - get deosits user
    8. getDepositsCount - get count deposits user
    
    External:
    1. deposit - deposit token.
        Conditions:
            1. amount > 0
            2. sender = owner contract
    5. withdraw - withdraw token
        Conditions: 
            1. the number of available tokens is more than the user is trying to withdraw
            2. sender = onwer contract