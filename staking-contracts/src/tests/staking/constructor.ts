import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { StakingContract, StakingInstance } from "@contracts";
import { getDefaultConstructorParams } from "@test-utils";

const Staking = artifacts.require("Staking");
const MockedStakingToken = artifacts.require("MockedStakingToken");

describe("Constructor", () => {
  let contract: StakingInstance;
  let defaultParams: string[];
  const INVALID_VALUE = "0";
  describe("When revenue is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, false, {
        revenue_: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        Staking.new(...(defaultParams as Parameters<StakingContract["new"]>)),
      "Revenue not positive"
    );
  });
  describe("When intervals count is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, false, {
        intervalsCount_: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        Staking.new(...(defaultParams as Parameters<StakingContract["new"]>)),
      "IntervalsCount not positive"
    );
  });
  describe("When interval duration is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, false, {
        intervalDuration: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        Staking.new(...(defaultParams as Parameters<StakingContract["new"]>)),
      "IntervalDuration not positive"
    );
  });
  describe("When size is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken, false, {
        size_: INVALID_VALUE,
      });
    });
    testReject(
      () =>
        Staking.new(...(defaultParams as Parameters<StakingContract["new"]>)),
      "Size not positive"
    );
  });
  describe("When all conditions are good", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedStakingToken);
    });
    it("should success", async () => {
      contract = await Staking.new(
        ...(defaultParams as Parameters<StakingContract["new"]>)
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
    it("should intervalsCount be equal to expected", async () => {
      const contractIntervalsCount = await contract.intervalsCount();
      assert.strictEqual(contractIntervalsCount.toString(10), defaultParams[3]);
    });
    it("should intervalDuration be equal to expected", async () => {
      const contractIntervalDuration = await contract.intervalDuration();
      const expectedIntervalDuration = new BN(defaultParams[4]).muln(86400);
      assert.strictEqual(
        contractIntervalDuration.toString(10),
        expectedIntervalDuration.toString(10)
      );
    });
    it("should size be equal to expected", async () => {
      const contractSize = await contract.size();
      assert.strictEqual(contractSize.toString(10), defaultParams[5]);
    });
    it("should freeSize be equal to expected", async () => {
      const contractFreeSize = await contract.freeSize();
      assert.strictEqual(contractFreeSize.toString(10), defaultParams[5]);
    });
  });
});
