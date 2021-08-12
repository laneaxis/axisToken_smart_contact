import { STAKING } from "config";
import { Network } from "@utils";
import { getTokenStaking } from "@utils";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");
const StakingMonthly = artifacts.require("StakingMonthly");

export = async function (_deployer, _network: Network, [account]) {
  const stakeToken = await getTokenStaking(ERC20, MockedStakingToken);
  const owner = STAKING.OWNER || account;

  if (STAKING.MONTHLY) {
    await _deployer.deploy(
      StakingMonthly,
      owner,
      stakeToken.address,
      STAKING.REVENUE,
      STAKING.INTERVAL_DURATION
    );
  } else {
    await _deployer.deploy(
      Staking,
      owner,
      stakeToken.address,
      STAKING.REVENUE,
      STAKING.INTERVALS_COUNT,
      STAKING.INTERVAL_DURATION,
      STAKING.SIZE
    );
  }
} as Migration;
