import { STAKING } from "config";
import { Network } from "@utils";
import { getTokenStaking } from "@utils";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

export = async function (_deployer, _network: Network, [account]) {
  const stakeToken = await getTokenStaking(ERC20, MockedStakingToken);
  const owner = STAKING.OWNER || account;

  await _deployer.deploy(
    Staking,
    owner,
    stakeToken.address,
    STAKING.REVENUE,
    STAKING.INTERVALS_COUNT,
    STAKING.INTERVAL_DURATION,
    STAKING.SIZE
  );
} as Migration;
