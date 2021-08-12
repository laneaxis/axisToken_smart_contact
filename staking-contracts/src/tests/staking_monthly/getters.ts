import assert from "assert";
import BN from "bn.js";

import { MockedStakingTokenInstance, StakingMonthlyInstance } from "@contracts";
import { getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import { StakingMonthlyContract } from "@contracts/StakingMonthly";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const StakingMonthly = artifacts.require("StakingMonthly");

describe("Deprecated public view methods", () => {
  let contract: StakingMonthlyInstance;
  before(async () => {
    const token = await getTokenStaking(ERC20, MockedStakingToken).then(
      (res) => res as MockedStakingTokenInstance
    );
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken,
      true
    );
    contract = await StakingMonthly.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
    );
  });
  describe("Method: size(): uint256", () => {
    let size: BN;
    it("should success", async () => {
      size = await contract.size();
    });
    it("should size be equal to 0", () => assert.strictEqual(size.toString(10), "0"));
  });
  describe("Method: intervalsCount(): uint256", () => {
    let intervalsCount: BN;
    it("should success", async () => {
        intervalsCount = await contract.intervalsCount();
    });
    it("should size be equal to 1", () => assert.strictEqual(intervalsCount.toString(10), "1"));
  });
  
});
