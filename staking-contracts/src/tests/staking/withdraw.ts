import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedStakingInstance, MockedStakingTokenInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import {
  MockedStakingContract,
  Staked,
  Withdrawn,
} from "@contracts/MockedStaking";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const MockedStaking = artifacts.require("MockedStaking");

describe("Method: withdraw(id: uint256, amount: uint256): bool", () => {
  const STAKE = new BN("1500000000000000000");
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: MockedStakingInstance;
  let revenue: BN;
  let intervalsCount: BN;
  let intervalDuration: BN;
  before(async () => {
    [account] = getAccounts();
    token = await getTokenStaking(ERC20, MockedStakingToken).then(
      (res) => res as MockedStakingTokenInstance
    );
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken
    );
    contract = await MockedStaking.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<MockedStakingContract["new"]>)
    );
    revenue = await contract.revenue();
    intervalsCount = await contract.intervalsCount();
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
    let intervalRewards: BN;
    let halfOfintervalRewards: BN;
    let result: Truffle.TransactionResponse<Withdrawn>;

    before(async () => {
      const INCREASE_REWARD = STAKE.mul(new BN(15)).div(new BN(100));
      const AMOUNT = STAKE.add(INCREASE_REWARD);
      const constructorParams = await getDefaultConstructorParams(
        MockedStakingToken
      );
      contract = await MockedStaking.new(
        ...(constructorParams as Parameters<MockedStakingContract["new"]>)
      );
      revenue = await contract.revenue();
      intervalsCount = await contract.intervalsCount();
      intervalDuration = await contract.intervalDuration();
      await token.mint(account, AMOUNT);
      await token.approve(contract.address, AMOUNT);
      await contract.increaseRewardPool(INCREASE_REWARD);
      stakeId = await contract
        .stake(STAKE)
        .then(
          (res) => (res.logs[0] as Truffle.TransactionLog<Staked>).args.stakeId
        );
      stake = await contract.getStake(account, stakeId);
      intervalRewards = new BN(stake.rewards).div(intervalsCount);
      halfOfintervalRewards = intervalRewards.div(new BN(2));
    });
    describe("When before first interval ending", () => {
      it("should availableToWithdraw be equal to zero", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(availableToWithdraw.toString(10), "0");
      });
    });
    describe("When first interval ended", () => {
      let stakeDecreaseAmount: BN;
      let totalStakedBefore: BN;
      let rewardPoolBefore: BN;
      let balanceBefore: BN;
      let contractBalanceBefore: BN;
      before(async () => {
        await contract.increaseTime(intervalDuration);
        stakeDecreaseAmount = halfOfintervalRewards
          .mul(new BN(100))
          .div(new BN(100).add(revenue));
        totalStakedBefore = await contract.totalStaked();
        rewardPoolBefore = await contract.rewardPool();
        balanceBefore = await token.balanceOf(account);
        contractBalanceBefore = await token.balanceOf(contract.address);
      });
      it("should availableToWithdraw be equal for one interval rewards", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(
          availableToWithdraw.toString(10),
          intervalRewards.toString(10)
        );
      });
      it("should success", async () => {
        result = await contract
          .withdraw(stakeId, halfOfintervalRewards)
          .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
      });
      it("should availableToWithdraw be equal for half of one interval rewards", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(
          availableToWithdraw.toString(10),
          halfOfintervalRewards.toString(10)
        );
      });
      it("should update 'withdrawn' field of stake object be equal to half of one interval rewards", async () => {
        stake = await contract.getStake(account, stakeId);
        assert.strictEqual(
          new BN(stake.withdrawn).toString(10),
          halfOfintervalRewards.toString(10)
        );
      });
      it("should decrease rewardPool for reward part of amount", async () => {
        const rewardPool = await contract.rewardPool();
        assert.strictEqual(
          rewardPool.toString(10),
          rewardPoolBefore
            .sub(halfOfintervalRewards.sub(stakeDecreaseAmount))
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
          contractBalanceBefore.sub(halfOfintervalRewards).toString(10)
        );
      });
      it("should increase account balance for amount", async () => {
        const balance = await token.balanceOf(account);
        assert.strictEqual(
          balance.toString(10),
          balanceBefore.add(halfOfintervalRewards).toString(10)
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
              halfOfintervalRewards.toString(10)
            ));
        });
      });
    });
    describe("When all intervals ended", () => {
      let resultAmountToWithdraw: BN;
      let stakeDecreaseAmount: BN;
      let totalStakedBefore: BN;
      let rewardPoolBefore: BN;
      let balanceBefore: BN;
      let contractBalanceBefore: BN;
      before(async () => {
        await contract.increaseTime(intervalDuration.mul(intervalsCount));
        resultAmountToWithdraw = intervalRewards
          .mul(intervalsCount)
          .sub(halfOfintervalRewards);
        stakeDecreaseAmount = resultAmountToWithdraw
          .mul(new BN(100))
          .div(new BN(100).add(revenue));
        totalStakedBefore = await contract.totalStaked();
        rewardPoolBefore = await contract.rewardPool();
        balanceBefore = await token.balanceOf(account);
        contractBalanceBefore = await token.balanceOf(contract.address);
      });
      it("should availableToWithdraw be equal for all rewards without half of one interval part", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(
          availableToWithdraw.toString(10),
          resultAmountToWithdraw.toString(10)
        );
      });
      it("should success", async () => {
        result = await contract
          .withdraw(stakeId, resultAmountToWithdraw)
          .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
      });
      it("should availableToWithdraw be equal to zero", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(availableToWithdraw.toString(10), "0");
      });

      it("should update 'withdrawn' field of stake object be equal to total account rewards", async () => {
        stake = await contract.getStake(account, stakeId);
        assert.strictEqual(
          new BN(stake.withdrawn).toString(10),
          intervalRewards.mul(intervalsCount).toString(10)
        );
        assert.strictEqual(
          new BN(stake.withdrawn).toString(10),
          new BN(stake.rewards).toString(10)
        );
      });
      it("should decrease rewardPool for reward part of amount", async () => {
        const rewardPool = await contract.rewardPool();
        assert.strictEqual(
          rewardPool.toString(10),
          rewardPoolBefore
            .sub(resultAmountToWithdraw.sub(stakeDecreaseAmount))
            .toString(10)
        );
        assert.strictEqual(rewardPool.toString(10), "0");
      });
      it("should decrease totalStaked for stake part of amount", async () => {
        const totalStaked = await contract.totalStaked();
        assert.strictEqual(
          totalStaked.toString(10),
          totalStakedBefore.sub(stakeDecreaseAmount).toString(10)
        );
        assert.strictEqual(totalStaked.toString(10), "0");
      });
      it("should decrease contract balance for amount", async () => {
        const contractBalance = await token.balanceOf(contract.address);
        assert.strictEqual(
          contractBalance.toString(10),
          contractBalanceBefore.sub(resultAmountToWithdraw).toString(10)
        );
      });
      it("should increase account balance for amount", async () => {
        const balance = await token.balanceOf(account);
        assert.strictEqual(
          balance.toString(10),
          balanceBefore.add(resultAmountToWithdraw).toString(10)
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
              resultAmountToWithdraw.toString(10)
            ));
        });
      });
    });
  });
});
