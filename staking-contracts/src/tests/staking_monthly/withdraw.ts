import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedStakingMonthlyInstance, MockedStakingTokenInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import {
  MockedStakingMonthlyContract,
  Staked,
  Withdrawn,
} from "@contracts/MockedStakingMonthly";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const MockedStakingMonthly = artifacts.require("MockedStakingMonthly");

describe("Method: withdraw(id: uint256, amount: uint256): bool", () => {
  const STAKE = new BN("1500000000000000000");
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: MockedStakingMonthlyInstance;
  let revenue: BN;
  let intervalDuration: BN;
  before(async () => {
    [account] = getAccounts();
    token = await getTokenStaking(ERC20, MockedStakingToken).then(
      (res) => res as MockedStakingTokenInstance
    );
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken,
      true
    );
    contract = await MockedStakingMonthly.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<MockedStakingMonthlyContract["new"]>)
    );
    revenue = await contract.revenue();
    intervalDuration = await contract.intervalDuration();
  });
  describe("When amount equal to 0", () => {
    testReject(() => contract.withdraw(0, 0), "Amount not positive");
  });
  describe("When invalid stake id", () => {
    testReject(() => contract.withdraw(0, 1), "Invalid stake id");
  });
  describe("When amount more than available", () => {
    let stakeId: BN;
    before(async () => {
      const AMOUNT = STAKE.mul(new BN(2));
      await token.mint(account, AMOUNT);
      await token.approve(contract.address, AMOUNT);
      await contract.increaseRewardPool(STAKE);
      stakeId = await contract
        .stake(STAKE)
        .then(
          (res) => (res.logs[0] as Truffle.TransactionLog<Staked>).args.stakeId
        );
    });
    testReject(
      () => contract.withdraw(stakeId, 1),
      "Not enough available tokens"
    );
  });
  describe("When all conditions are good", () => {
    let stakeId: BN;
    let stake: { amount: BN; rewards: BN; withdrawn: BN; startsAt: BN };
    let result: Truffle.TransactionResponse<Withdrawn>;
    let withdrawAmount: BN
    before(async () => {
      const INCREASE_REWARD = STAKE.mul(new BN(15)).div(new BN(100));
      const AMOUNT = STAKE.add(INCREASE_REWARD);
      const constructorParams = await getDefaultConstructorParams(
        MockedStakingToken,
        true
      );
      contract = await MockedStakingMonthly.new(
        ...(constructorParams as Parameters<MockedStakingMonthlyContract["new"]>)
      );
      revenue = await contract.revenue();
      intervalDuration = await contract.intervalDuration();
      await token.mint(account, AMOUNT);
      await token.approve(contract.address, AMOUNT);
      await contract.increaseRewardPool(INCREASE_REWARD);
      await contract.increaseTime(intervalDuration);
      stakeId = await contract
        .stake(STAKE)
        .then(
          (res) => (res.logs[0] as Truffle.TransactionLog<Staked>).args.stakeId
        );
      stake = await contract.getStake(account, stakeId);
      withdrawAmount = new BN(stake.amount).add(new BN(stake.rewards));
    });
    describe("When interval ends", () => {
      let stakeDecreaseAmount: BN;
      let totalStakedBefore: BN;
      let rewardPoolBefore: BN;
      let balanceBefore: BN;
      let contractBalanceBefore: BN;
      before(async () => {
        await contract.increaseTime(intervalDuration);
        stakeDecreaseAmount = withdrawAmount
          .mul(new BN(100))
          .div(new BN(100).add(revenue));
        totalStakedBefore = await contract.totalStaked();
        rewardPoolBefore = await contract.rewardPool();
        balanceBefore = await token.balanceOf(account);
        contractBalanceBefore = await token.balanceOf(contract.address);
      });
      it("should availableToWithdraw be equal for stake rewards + amount", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(
          availableToWithdraw.toString(10),
          withdrawAmount.toString(10)
        );
      });
      it("should success", async () => {
        result = await contract
          .withdraw(stakeId, withdrawAmount)
          .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
      });
      it("should availableToWithdraw be equal to 0", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(availableToWithdraw.toString(10), "0");
      });
      it("should update 'withdrawn' field of stake object", async () => {
        stake = await contract.getStake(account, stakeId);
        assert.strictEqual(
          new BN(stake.withdrawn).toString(10),
          withdrawAmount.toString(10)
        );
      });
      it("should decrease rewardPool for reward part of amount", async () => {
        const rewardPool = await contract.rewardPool();
        assert.strictEqual(
          rewardPool.toString(10),
          rewardPoolBefore
            .sub(withdrawAmount.sub(stakeDecreaseAmount))
            .toString(10)
        );
      });
      it("should decrease totalStaked for stake part of amount", async () => {
        const totalStaked = await contract.totalStaked();
        assert.strictEqual(
          totalStaked.toString(10),
          totalStakedBefore.sub(stakeDecreaseAmount).toString(10)
        );
      });
      it("should decrease contract balance for amount", async () => {
        const contractBalance = await token.balanceOf(contract.address);
        assert.strictEqual(
          contractBalance.toString(10),
          contractBalanceBefore.sub(withdrawAmount).toString(10)
        );
      });
      it("should increase account balance for amount", async () => {
        const balance = await token.balanceOf(account);
        assert.strictEqual(
          balance.toString(10),
          balanceBefore.add(withdrawAmount).toString(10)
        );
      });
      describe("should emit events", () => {
        let withdrawnEvent: Truffle.TransactionLog<Withdrawn>;
        before(async () => {
          withdrawnEvent = result.logs[0] as Truffle.TransactionLog<Withdrawn>;
        });
        describe("Event #1", () => {
          it("with event name equal to expected", () =>
            assert.strictEqual(withdrawnEvent.event, "Withdrawn"));
          it("with 'account' field equal to caller", () =>
            assert.strictEqual(withdrawnEvent.args.account, account));
          it("with 'stakeId' field equal to expected", () =>
            assert.strictEqual(
              withdrawnEvent.args.stakeId.toString(10),
              stakeId.toString(10)
            ));
          it("with 'amount' field equal to amount", () =>
            assert.strictEqual(
              withdrawnEvent.args.amount.toString(10),
              withdrawAmount.toString(10)
            ));
        });
      });
    });
  });
});
