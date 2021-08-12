# staking_smartcontracts
This repo will have a code of axisToken Staking &amp; Smart Contracts.

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
  "GAS_PRICE": "",
  "STAKING": {
    "OWNER": "",
    "STAKING_TOKEN": "",
    "REVENUE": "",
    "INTERVALS_COUNT": "",
    "INTERVAL_DURATION": "",
    "SIZE": "",
    "MONTHLY": ""
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
$ yarn verify:kovan <CONTRACT_NAME> # (<CONTRACT_NAME> = Staking or StakingMonthly)
# Verify contracts mainnet
$ yarn verify:mainnet <CONTRACT_NAME> # (<CONTRACT_NAME> = Staking or StakingMonthly)
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
    1. freeSize - Get the maximum available amount of tokens for a stake
    2. intervalsCount - Get count intervals for unlock tokens
    3. intervalDuration - Get duration of one interval
    4. requiredRewards - The required number of tokens for withdraw
    5. rewardPool - The number of tokens replenished for withdrawn
    6. size - Size pool
    7. totalStaked - total staked token in this pool
    8. availableToWithdraw - count available token for user withdrawn
    9. getStake - get user stake info
    10. getStakesCount - get count stakes user
    11. getStakes - get stakes user
    
    External:
    1. increaseRewardPool - replenish the pool with tokens. (Maybe only owner)
    2. decreaseRewardPool - remove tokens from the pool. But no more than requiredRewards. (Maybe only owner)
    3. setMinStakeAmount - set minimum stake token amount
    4. stake - stake token.
        Conditions:
            Staking:
                1. amount > minStakeAmount
                2. amount > freeSize
                3. there are more tokens in the pool than the user needs to pay
            StakingMonthly
                1. amount > minStakeAmount
                2. amount > freeSize
                3. there are more tokens in the pool than the user needs to pay
                4. The user has no active stake during the lock period
    5. withdraw - withdraw token
        Conditions: 
            1. The number of available tokens is greater or earlier than the user is trying to withdraw
