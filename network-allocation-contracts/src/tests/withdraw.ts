import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedTokenInstance, MockedLockupInstance } from "@contracts";
import { Withdrawn } from "@contracts/Lockup";
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

describe("Method: withdraw(id: uint256, amount: uint256): bool", () => {
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

  describe("When caller is not owner", () => {
    testReject(() => contract.withdraw(0, 1, { from: notOwner }), "Not owner");
  });

  describe("When amount is zero", () => {
    testReject(() => contract.withdraw(0, 0), "Amount not positive");
  });

  describe("When not enoguh tokens to withdraw", () => {
    const AMOUNT = new BN(1e6);
    const TIMESTAMP_DIFF = LOCKUP_DURATION.mul(WEEK);
    let depositId: BN;

    before(async () => {
      depositId = await makeDeposit(AMOUNT, account, token, contract);
      await contract.increaseTime(TIMESTAMP_DIFF);
    });

    testReject(
      () => contract.withdraw(depositId, AMOUNT),
      "Not enough available tokens"
    );
  });

  describe("When all conditions are met", () => {
    const AMOUNT = new BN(1e6);

    describe("When withdrawing whole amount", () => {
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(UNLOCK_DURATION).mul(WEEK);
      let depositId: BN;
      let totalDepositedBefore: BN;
      let balanceBefore: BN;
      let result: Truffle.TransactionResponse<Withdrawn>;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        [totalDepositedBefore, balanceBefore] = await Promise.all([
          contract.totalDeposit(),
          token.balanceOf(account),
        ]);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it("should success", async () => {
        result = (await contract.withdraw(
          depositId,
          AMOUNT
        )) as Truffle.TransactionResponse<Withdrawn>;
      });

      it("balance should equal to balanceBefore + amount", async function () {
        if (!result) this.skip();
        const balanceAfter = await token.balanceOf(account);
        assert.strictEqual(
          balanceAfter.toString(),
          balanceBefore.add(AMOUNT).toString()
        );
      });

      it("totalDeposit should decrease on amount", async function () {
        if (!result) this.skip();
        const actual = await contract.totalDeposit();
        const expected = totalDepositedBefore.sub(AMOUNT);
        assert.strictEqual(actual.toString(), expected.toString());
      });

      it("deposit.withdrawn should equal to amount", async function () {
        if (!result) this.skip();
        const deposit = await contract.getDeposit(depositId);
        assert.strictEqual(deposit.withdrawn.toString(), AMOUNT.toString());
      });

      describe("should emit events", () => {
        before(function () {
          if (!result) this.skip();
        });

        describe("Event #1", () => {
          let event: Truffle.TransactionLog<Withdrawn>;
          before(() => {
            event = result.logs[0];
          });

          it("should be emitted", () =>
            assert.notStrictEqual(event, undefined));
          it("with event name equal to expected", () =>
            assert.strictEqual(event.event, "Withdrawn"));
          it("with 'account' field equal to caller", () =>
            assert.strictEqual(event.args.account, account));
          it("with 'depositId' field equal to expected", () =>
            assert.strictEqual(
              event.args.depositId.toString(),
              depositId.toString()
            ));
          it("with 'amount' field equal to amount", () =>
            assert.strictEqual(
              event.args.amount.toString(),
              AMOUNT.toString()
            ));
        });
      });
    });

    describe("When withdrawing half of amount", () => {
      const WITHDRAWNABLE = AMOUNT;
      const EXPECTED_AMOUNT = WITHDRAWNABLE.divn(2);
      const TIMESTAMP_DIFF = LOCKUP_DURATION.add(UNLOCK_DURATION).mul(WEEK);
      let depositId: BN;
      let totalDepositedBefore: BN;
      let balanceBefore: BN;
      let result: Truffle.TransactionResponse<Withdrawn>;

      before(async () => {
        depositId = await makeDeposit(AMOUNT, account, token, contract);
        [totalDepositedBefore, balanceBefore] = await Promise.all([
          contract.totalDeposit(),
          token.balanceOf(account),
        ]);
        await contract.increaseTime(TIMESTAMP_DIFF);
      });

      it("should success", async () => {
        result = (await contract.withdraw(
          depositId,
          EXPECTED_AMOUNT
        )) as Truffle.TransactionResponse<Withdrawn>;
      });

      it("balance should equal to balanceBefore + amount", async function () {
        if (!result) this.skip();
        const balanceAfter = await token.balanceOf(account);
        assert.strictEqual(
          balanceAfter.toString(),
          balanceBefore.add(EXPECTED_AMOUNT).toString()
        );
      });

      it("totalDeposit should decrease on amount", async function () {
        if (!result) this.skip();
        const actual = await contract.totalDeposit();
        const expected = totalDepositedBefore.sub(EXPECTED_AMOUNT);
        assert.strictEqual(actual.toString(), expected.toString());
      });

      it("deposit.withdrawn should equal to amount", async function () {
        if (!result) this.skip();
        const deposit = await contract.getDeposit(depositId);
        assert.strictEqual(
          deposit.withdrawn.toString(),
          EXPECTED_AMOUNT.toString()
        );
      });

      describe("should emit events", () => {
        before(function () {
          if (!result) this.skip();
        });

        describe("Event #1", () => {
          let event: Truffle.TransactionLog<Withdrawn>;
          before(() => {
            event = result.logs[0];
          });

          it("should be emitted", () =>
            assert.notStrictEqual(event, undefined));
          it("with event name equal to expected", () =>
            assert.strictEqual(event.event, "Withdrawn"));
          it("with 'account' field equal to caller", () =>
            assert.strictEqual(event.args.account, account));
          it("with 'depositId' field equal to expected", () =>
            assert.strictEqual(
              event.args.depositId.toString(),
              depositId.toString()
            ));
          it("with 'amount' field equal to amount", () =>
            assert.strictEqual(
              event.args.amount.toString(),
              EXPECTED_AMOUNT.toString()
            ));
        });
      });
    });
  });
});
