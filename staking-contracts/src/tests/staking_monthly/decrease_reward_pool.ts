import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedStakingTokenInstance, StakingMonthlyInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import { RewardPoolDecreased, StakingMonthlyContract } from "@contracts/StakingMonthly";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const StakingMonthly = artifacts.require("StakingMonthly");

describe("Method: decreaseRewardPool(amount: uint256): bool", () => {
  const DECREASE_AMOUNT = new BN("1500000000000000000");
  let CONSTRUCTOR_PARAMS: string[];
  let notOwner: string;
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: StakingMonthlyInstance;
  let revenue: BN;

  before(async () => {
    [account, notOwner] = getAccounts();
    token = await getTokenStaking(ERC20, MockedStakingToken).then(
      (res) => res as MockedStakingTokenInstance
    );
    CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken,
      true
    );
    contract = await StakingMonthly.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
    );
    revenue = await contract.revenue();
  });
  describe("When caller is not owner", () => {
    testReject(
      () => contract.decreaseRewardPool(DECREASE_AMOUNT, { from: notOwner }),
      "Not owner"
    );
  });
  describe("When amount equal to 0", () => {
    testReject(() => contract.decreaseRewardPool(0), "Amount not positive");
  });
  describe("When no tokens to decrease", () => {
    before(async () => {
      contract = await StakingMonthly.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
      );
      revenue = await contract.revenue();
      const STAKE_AMOUNT = new BN("1500000000000000000");
      const INCREASE_AMOUNT = STAKE_AMOUNT.mul(revenue).div(new BN(100));
      const TOKEN_AMOUNT = STAKE_AMOUNT.add(INCREASE_AMOUNT);
      await token.mint(account, TOKEN_AMOUNT);
      await token.approve(contract.address, TOKEN_AMOUNT);
      await contract.increaseRewardPool(INCREASE_AMOUNT);
      await contract.stake(STAKE_AMOUNT);
    });
    testReject(
      () => contract.decreaseRewardPool(DECREASE_AMOUNT),
      "No tokens to decrease"
    );
  });
  describe("When amount gt than possible to decrease", () => {
    before(async () => {
      contract = await StakingMonthly.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
      );
      const AMOUNT = DECREASE_AMOUNT.mul(new BN(2));
      await token.mint(account, AMOUNT);
      await token.approve(contract.address, AMOUNT);
      await contract.increaseRewardPool(DECREASE_AMOUNT);
      await contract.stake(DECREASE_AMOUNT);
    });
    testReject(
      () => contract.decreaseRewardPool(DECREASE_AMOUNT),
      "Not enough amount"
    );
  });
  describe("When all conditions are good", () => {
    let result: Truffle.TransactionResponse<RewardPoolDecreased>;
    let rewardPoolBefore: BN;
    let contractBalanceBefore: BN;
    let balanceBefore: BN;
    before(async () => {
      contract = await StakingMonthly.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingMonthlyContract["new"]>)
      );
      revenue = await contract.revenue();
      await token.mint(account, DECREASE_AMOUNT);
      await token.approve(contract.address, DECREASE_AMOUNT);
      await contract.increaseRewardPool(DECREASE_AMOUNT);
      rewardPoolBefore = await contract.rewardPool();
      contractBalanceBefore = await token.balanceOf(contract.address);
      balanceBefore = await token.balanceOf(account);
    });
    it("should success", async () => {
      result = await contract
        .decreaseRewardPool(DECREASE_AMOUNT)
        .then((res) => res as Truffle.TransactionResponse<RewardPoolDecreased>);
    });
    it("should decrease rewardPool for amount", async () => {
      const rewardPool = await contract.rewardPool();
      assert.strictEqual(
        rewardPool.toString(10),
        rewardPoolBefore.sub(DECREASE_AMOUNT).toString(10)
      );
    });
    it("should decrease contract balance for amount", async () => {
      const contractBalance = await token.balanceOf(contract.address);
      assert.strictEqual(
        contractBalance.toString(10),
        contractBalanceBefore.sub(DECREASE_AMOUNT).toString(10)
      );
    });
    it("should increase caller balance for amount", async () => {
      const balance = await token.balanceOf(account);
      assert.strictEqual(
        balance.toString(10),
        balanceBefore.add(DECREASE_AMOUNT).toString(10)
      );
    });
    describe("should emit events", () => {
      let RewardPoolDecreasedEvent: Truffle.TransactionLog<RewardPoolDecreased>;
      before(async () => {
        RewardPoolDecreasedEvent = result
          .logs[0] as Truffle.TransactionLog<RewardPoolDecreased>;
      });
      describe("Event #1", () => {
        it("with event name equal to expected", () =>
          assert.strictEqual(
            RewardPoolDecreasedEvent.event,
            "RewardPoolDecreased"
          ));
        it("with 'owner' field equal to caller", () =>
          assert.strictEqual(RewardPoolDecreasedEvent.args.owner, account));
        it("with 'amount' field equal to amount", () =>
          assert.strictEqual(
            RewardPoolDecreasedEvent.args.amount.toString(10),
            DECREASE_AMOUNT.toString(10)
          ));
      });
    });
  });
});
