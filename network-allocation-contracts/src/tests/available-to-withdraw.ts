import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedTokenInstance, MockedLockupInstance } from "@contracts";
import {
  getAccounts,
  getDefaultConstructorParams,
  makeDeposit,
  WEEK,
} from "@test-utils";
import { getToken } from "@utils";

const ERC20 = artifacts.require("ERC20");
const MockedToken = artifacts.require("MockedToken");
const MockedLockup = artifacts.require("MockedLockup");

describe("Method: availableToWithdraw(id: uint256): uint256", () => {
  const LOCKUP_DURATION = new BN(100);
  const UNLOCK_INTERVALS_COUNT = new BN(5);
  const UNLOCK_INTERVAL_DURATION = new BN(100);
  const UNLOCK_DURATION = UNLOCK_INTERVALS_COUNT.mul(UNLOCK_INTERVAL_DURATION);

  let account: string;
  let notOwner: string;
  let token: MockedTokenInstance;
  let contract: MockedLockupInstance;

  before(async () => {
    [account, notOwner] = getAccounts();
    token = (await getToken(ERC20, MockedToken)) as MockedTokenInstance;
    const params = {
      lockupDuration_: LOCKUP_DURATION.toString(),
      unlockDuration_: UNLOCK_DURATION.toString(),
      unlockIntervalsCount_: UNLOCK_INTERVALS_COUNT.toString(),
    };
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedToken,
      params
    );
    contract = await MockedLockup.new(...CONSTRUCTOR_PARAMS);
  });

  describe("When invalid deposit id", () => {
    let depositsCount: string;
    before(async () => {
      depositsCount = await contract
        .getDepositsCount()
        .then((v) => v.toString());
    });
    testReject(
      () => contract.availableToWithdraw(depositsCount),
      "Invalid deposit id"
    );
  });

  describe("When all conditions are met", () => {
    const AMOUNT = new BN(1e6);

    describe("When locked", () => {
      const EXPTECTED = 0;
      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
      });

      it("should equal to zero", async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPTECTED.toString());
      });
    });

    describe("When lockup period finished", () => {
      const EXPTECTED = 0;
      let depositId: BN;
      const TIMESTAMP_DIFF = LOCKUP_DURATION.mul(WEEK);

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it("should equal to zero", async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPTECTED.toString());
      });
    });

    describe("When first unlock interval passed", () => {
      const INTERVAL = new BN(1);
      const EXPECTED = AMOUNT.mul(INTERVAL).div(UNLOCK_INTERVALS_COUNT);
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL)
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it(`should equal to amount / intervalsCount * 1`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });

    describe("When first unlock interval passed and already withdrawn", () => {
      const INTERVAL = new BN(1);
      const WITHDRAWNABLE = AMOUNT.mul(INTERVAL).div(UNLOCK_INTERVALS_COUNT);
      const EXPECTED = WITHDRAWNABLE.divn(2);
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL)
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
        await contract.withdraw(depositId, WITHDRAWNABLE.sub(EXPECTED));
      });

      it(`should equal to amount / intervalsCount * 1 - alreadyWithdawn`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });

    describe("When all intervals passed", () => {
      const INTERVAL = UNLOCK_INTERVALS_COUNT;
      const WITHDRAWNABLE = AMOUNT;
      const EXPECTED = WITHDRAWNABLE;
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL)
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it(`should equal to whole amount`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });

    describe("When all intervals passed and already withdrawn", () => {
      const INTERVAL = UNLOCK_INTERVALS_COUNT;
      const WITHDRAWNABLE = AMOUNT;
      const EXPECTED = WITHDRAWNABLE.divn(2);
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL)
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
        await contract.withdraw(depositId, WITHDRAWNABLE.sub(EXPECTED));
      });

      it(`should equal to whole amount - alreadyWithdawn`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });

    describe("When all intevals and some time passed", () => {
      const INTERVAL = UNLOCK_INTERVALS_COUNT;
      const WITHDRAWNABLE = AMOUNT;
      const EXPECTED = WITHDRAWNABLE;
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL.addn(5))
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it(`should equal to whole amount`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });

    describe("When all intevals and some time passed and already withdrawn", () => {
      const INTERVAL = UNLOCK_INTERVALS_COUNT;
      const WITHDRAWNABLE = AMOUNT;
      const EXPECTED = WITHDRAWNABLE.divn(2);
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(
        UNLOCK_INTERVAL_DURATION.mul(INTERVAL.addn(5))
      ).mul(WEEK);

      let depositId: BN;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        await contract.increaseTime(TIMESTAMP_DIFF);
        await contract.withdraw(depositId, WITHDRAWNABLE.sub(EXPECTED));
      });

      it(`should equal to whole amount - alreadyWithdawn`, async () => {
        const actual = await contract.availableToWithdraw(depositId);
        assert.strictEqual(actual.toString(), EXPECTED.toString());
      });
    });
  });
});
