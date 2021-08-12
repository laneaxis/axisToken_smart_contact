import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import {
  MockedTokenInstance,
  LockupInstance,
  LockupContract,
} from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getToken } from "@utils";
import { Deposited } from "@contracts/Lockup";

const ERC20 = artifacts.require("ERC20");
const MockedToken = artifacts.require("MockedToken");
const Lockup = artifacts.require("Lockup");

describe("Method: stake(amount: uint256): bool", () => {
  const DEPOSIT = new BN("1500000000000000000");
  let account: string;
  let notOwner: string;
  let token: MockedTokenInstance;
  let contract: LockupInstance;
  before(async () => {
    [account, notOwner] = getAccounts();
    token = await getToken(ERC20, MockedToken).then(
      (res) => res as MockedTokenInstance
    );
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(MockedToken);
    contract = await Lockup.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<LockupContract["new"]>)
    );
  });
  describe("When caller is not owner", () => {
    testReject(() => contract.deposit(15, { from: notOwner }), "Not owner");
  });
  describe("When amount equal to 0", () => {
    testReject(() => contract.deposit(0), "Amount not positive");
  });
  describe("When all conditions are good", () => {
    let result: Truffle.TransactionResponse<Deposited>;
    let totalDepositBefore: BN;
    let balanceBefore: BN;
    let contractBalanceBefore: BN;
    let depositObjectsCountBefore: BN;
    before(async () => {
      await token.mint(account, DEPOSIT);
      await token.approve(contract.address, DEPOSIT);
      totalDepositBefore = await contract.totalDeposit();
      balanceBefore = await token.balanceOf(account);
      contractBalanceBefore = await token.balanceOf(contract.address);
      depositObjectsCountBefore = await contract.getDepositsCount();
    });
    it("should success", async () => {
      result = await contract
        .deposit(DEPOSIT)
        .then((res) => res as Truffle.TransactionResponse<Deposited>);
    });
    it("should increase totalDeposit for amount", async () => {
      const totalDeposit = await contract.totalDeposit();
      assert.strictEqual(
        totalDeposit.toString(10),
        totalDepositBefore.add(DEPOSIT).toString(10)
      );
    });
    it("should decrease caller balance for amount", async () => {
      const balance = await token.balanceOf(account);
      assert.strictEqual(
        balance.toString(10),
        balanceBefore.sub(DEPOSIT).toString(10)
      );
    });
    it("should increase contract balance from amount", async () => {
      const contractBalance = await token.balanceOf(contract.address);
      assert.strictEqual(
        contractBalance.toString(10),
        contractBalanceBefore.add(DEPOSIT).toString(10)
      );
    });
    it("should increment deposit objects count", async () => {
      const depositObjectsCount = await contract.getDepositsCount();
      assert.strictEqual(
        depositObjectsCount.toString(10),
        depositObjectsCountBefore.add(new BN(1)).toString(10)
      );
    });
    describe("When deposit object created", () => {
      let deposit: {
        amount: BN;
        withdrawn: BN;
        depositedAt: BN;
        lockupEndsAt: BN;
        unlockEndsAt: BN;
      };
      let expectedDepositedAt: BN;
      let expectedLockupEndsAt: BN;
      let expectedUnlockEndsAt: BN;
      before(async () => {
        const currentBlockNumber = await web3.eth
          .getBlock(result.receipt.blockNumber)
          .then((res) => new BN(res.timestamp));
        expectedDepositedAt = currentBlockNumber;
        expectedLockupEndsAt = await contract
          .lockupDuration()
          .then((res) => res.add(currentBlockNumber));
        expectedUnlockEndsAt = await contract
          .unlockDuration()
          .then((res) => res.add(expectedLockupEndsAt));
        deposit = await contract.getDeposit(depositObjectsCountBefore);
      });
      it("should 'amount' field be equal to deposited amount", () =>
        assert.strictEqual(deposit.amount.toString(10), DEPOSIT.toString(10)));
      it("should 'withdrawn' field be equal to zero", () =>
        assert.strictEqual(deposit.withdrawn.toString(10), "0"));
      it("should 'depositedAt' field be equal to transaction timestamp", () =>
        assert.strictEqual(
          deposit.depositedAt.toString(10),
          expectedDepositedAt.toString(10)
        ));
      it("should 'lockupEndsAt' field be equal to transaction timestamp", () =>
        assert.strictEqual(
          deposit.lockupEndsAt.toString(10),
          expectedLockupEndsAt.toString(10)
        ));
      it("should 'depositedAt' field be equal to transaction timestamp", () =>
        assert.strictEqual(
          deposit.unlockEndsAt.toString(10),
          expectedUnlockEndsAt.toString(10)
        ));
    });
    describe("should emit events", () => {
      let depositedEvent: Truffle.TransactionLog<Deposited>;
      before(async () => {
        depositedEvent = result.logs[0] as Truffle.TransactionLog<Deposited>;
      });
      describe("Event #1", () => {
        it("with event name equal to expected", () =>
          assert.strictEqual(depositedEvent.event, "Deposited"));
        it("with 'account' field equal to caller", () =>
          assert.strictEqual(depositedEvent.args.account, account));
        it("with 'depositId' field equal to expected", () =>
          assert.strictEqual(
            depositedEvent.args.depositId.toString(10),
            depositObjectsCountBefore.toString(10)
          ));
        it("with 'amount' field equal to amount", () =>
          assert.strictEqual(
            depositedEvent.args.amount.toString(10),
            DEPOSIT.toString(10)
          ));
      });
    });
  });
});
