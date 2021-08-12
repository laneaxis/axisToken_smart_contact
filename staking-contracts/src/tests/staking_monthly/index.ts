import { testTwoStageOwnable } from "solowei";

import { StakingMonthlyContract, TwoStageOwnableInstance } from "@contracts";
import { setAccounts, getDefaultConstructorParams } from "@test-utils";

const MockedStakingToken = artifacts.require("MockedStakingToken");
const StakingMonthly = artifacts.require("StakingMonthly");

contract("StakingMonthly", (accounts) => {
  before(() => setAccounts(accounts));
  require("./constructor");
  require("./getters");
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
        true,
        { owner_: owner }
      );
      return StakingMonthly.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
      ) as Promise<TwoStageOwnableInstance>;
    },
    () => accounts
  );
});
