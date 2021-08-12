import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { StakingMonthlyContract, StakingMonthlyInstance } from "@contracts";
import { getDefaultConstructorParams } from "@test-utils";

const StakingMonthly = artifacts.require("StakingMonthly");
const MockedStakingToken = artifacts.require("MockedStakingToken");

describe("Constructor", () => {
  let contract: StakingMonthlyInstance;
  let defaultParams: string[];
  const INVALID_VALUE = "0";
  describe("When revenue is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, true, {
        revenue_: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        StakingMonthly.new(...(defaultParams as Parameters<StakingMonthlyContract["new"]>)),
      "Revenue not positive"
    );
  });
  describe("When interval duration is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, true, {
        intervalDuration: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        StakingMonthly.new(...(defaultParams as Parameters<StakingMonthlyContract["new"]>)),
      "IntervalDuration not positive"
    );
  });
  describe("When all conditions are good", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, true);
    });
    it("should success", async () => {
      contract = await StakingMonthly.new(
        ...(defaultParams as Parameters<StakingMonthlyContract["new"]>)
      );
    });
    it("should stakingToken be equal to expected", async () => {
      const contractStakingToken = await contract.stakingToken();
      assert.strictEqual(contractStakingToken, defaultParams[1]);
    });
    it("should revenue be equal to expected", async () => {
      const contractRevenue = await contract.revenue();
      assert.strictEqual(contractRevenue.toString(10), defaultParams[2]);
    });
    it("should intervalDuration be equal to expected", async () => {
      const contractIntervalDuration = await contract.intervalDuration();
      const expectedIntervalDuration = new BN(defaultParams[3]).muln(86400);
      assert.strictEqual(
        contractIntervalDuration.toString(10),
        expectedIntervalDuration.toString(10)
      );
    });
  });
});
