import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { LockupInstance } from "@contracts";
import { DefaultParameters, getDefaultConstructorParams } from "@test-utils";

const Lockup = artifacts.require("Lockup");
const MockedToken = artifacts.require("MockedToken");

describe("Constructor", () => {
  let contract: LockupInstance;
  let defaultParams: DefaultParameters;
  const INVALID_VALUE = "0";
  describe("When lockupDuration is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedToken, {
        lockupDuration_: INVALID_VALUE,
      });
    });
    testReject(
      () => Lockup.new(...defaultParams),
      "LockupDuration not positive"
    );
  });
  describe("When unlockDuration is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedToken, {
        unlockDuration_: INVALID_VALUE,
      });
    });
    testReject(
      () => Lockup.new(...defaultParams),
      "UnlockDuration not positive"
    );
  });
  describe("When unlockIntervalsCount is not positive", () => {
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedToken, {
        unlockIntervalsCount_: INVALID_VALUE,
      });
    });
    testReject(
      () => Lockup.new(...defaultParams),
      "UnlockIntervalsCount not positive"
    );
  });
  describe("When all condition are good", () => {
    const WEEK = new BN("604800");
    before(async () => {
      defaultParams = await getDefaultConstructorParams(MockedToken);
    });
    it("should success", async () => {
      contract = await Lockup.new(...defaultParams);
    });
    it("should token be equal to expected", async () => {
      const contractToken = await contract.token();
      assert.strictEqual(contractToken, defaultParams[1]);
    });
    it("should lockupDuration be equal to expected", async () => {
      const contractLockupDuration = await contract.lockupDuration();
      assert.strictEqual(
        contractLockupDuration.toString(10),
        new BN(defaultParams[2]).mul(WEEK).toString(10)
      );
    });
    it("should unlockDuration be equal to expected", async () => {
      const contractUnlockDuration = await contract.unlockDuration();
      assert.strictEqual(
        contractUnlockDuration.toString(10),
        new BN(defaultParams[3]).mul(WEEK).toString(10)
      );
    });
    it("should unlockIntervalsCount be equal to expected", async () => {
      const contractUnlockIntervalsCount =
        await contract.unlockIntervalsCount();
      assert.strictEqual(
        contractUnlockIntervalsCount.toString(10),
        defaultParams[4]
      );
    });
  });
});
