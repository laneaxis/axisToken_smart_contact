import { testTwoStageOwnable } from "solowei";

import { StakingContract, TwoStageOwnableInstance } from "@contracts";
import { setAccounts, getDefaultConstructorParams } from "@test-utils";

const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

contract("Staking", (accounts) => {
  before(() => setAccounts(accounts));
  require("./constructor");
  require("./increase_reward_pool");
  require("./set_min_stake_amount");
  require("./stake");
  require("./get_stakes");
  require("./decrease_reward_pool");
  require("./withdraw");
  testTwoStageOwnable(
    async (owner) => {
      const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
        MockedStakingToken,
        { owner_: owner }
      );
      return Staking.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingContract["new"]>)
      ) as Promise<TwoStageOwnableInstance>;
    },
    () => accounts
  );
});
