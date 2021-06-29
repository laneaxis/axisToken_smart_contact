import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedStakingTokenInstance, StakingInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import { Staked, StakingContract } from "@contracts/Staking";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

describe("Method: stake(amount: uint256): bool", () => {
  const STAKE = new BN("1500000000000000000");
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: StakingInstance;
  before(async () => {
    [account] = getAccounts();
    token = await getTokenStaking(ERC20, MockedStakingToken).then(
      (res) => res as MockedStakingTokenInstance
    );
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken
    );
    contract = await Staking.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<StakingContract["new"]>)
    );
  });
  describe("When amount equal to 0", () => {
    testReject(() => contract.stake(0), "Amount not positive");
  });
  describe("When amount less than minStakeAmount", () => {
    const AMOUNT = 5;
    before(async () => {
      await contract.setMinStakeAmount(AMOUNT);
    });
    testReject(() => contract.stake(AMOUNT - 1), "Amount lt minimum stake");
  });
  describe("When amount greater than freeSize", () => {
    let localContract: StakingInstance;
    before(async () => {
      const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
        MockedStakingToken,
        { size_: "100" }
      );
      localContract = await Staking.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<StakingContract["new"]>)
      );
    });
    testReject(() => localContract.stake(STAKE), "Amount gt free size");
  });
  describe("When calculated reward amount more than available", () => {
    testReject(() => contract.stake(STAKE), "Not enough rewards");
  });
  describe("When all conditions are good", () => {
    let result: Truffle.TransactionResponse<Staked>;
    let totalStakedBefore: BN;
    let balanceBefore: BN;
    let contractBalanceBefore: BN;
    let stakeObjectsCountBefore: BN;
    let freeSizeBefore: BN;
    before(async () => {
      await token.mint(account, STAKE.muln(2));
      await token.approve(contract.address, STAKE.muln(2));
      await contract.increaseRewardPool(STAKE);
      totalStakedBefore = await contract.totalStaked();
      balanceBefore = await token.balanceOf(account);
      contractBalanceBefore = await token.balanceOf(contract.address);
      stakeObjectsCountBefore = await contract.getStakesCount(account);
      freeSizeBefore = await contract.freeSize();
    });
    it("should success", async () => {
      result = await contract
        .stake(STAKE)
        .then((res) => res as Truffle.TransactionResponse<Staked>);
    });
    it("should increase totalStaked for amount", async () => {
      const totalStaked = await contract.totalStaked();
      assert.strictEqual(
        totalStaked.toString(10),
        totalStakedBefore.add(STAKE).toString(10)
      );
    });
    it("should decrease caller balance for amount", async () => {
      const balance = await token.balanceOf(account);
      assert.strictEqual(
        balance.toString(10),
        balanceBefore.sub(STAKE).toString(10)
      );
    });
    it("should increase contract balance from amount", async () => {
      const contractBalance = await token.balanceOf(contract.address);
      assert.strictEqual(
        contractBalance.toString(10),
        contractBalanceBefore.add(STAKE).toString(10)
      );
    });
    it("should decrease freeSize for amount", async () => {
      const freeSize = await contract.freeSize();
      assert.strictEqual(
        freeSize.toString(10),
        freeSizeBefore.sub(STAKE).toString(10)
      );
    });
    it("should increment stake objects count", async () => {
      const stakeObjectsCount = await contract.getStakesCount(account);
      assert.strictEqual(
        stakeObjectsCount.toString(10),
        stakeObjectsCountBefore.add(new BN(1)).toString(10)
      );
    });
    describe("When stake object created", () => {
      let stake: { amount: BN; rewards: BN; withdrawn: BN; startsAt: BN };
      let expectedRewards: BN;
      let expectedStartsAt: BN;
      before(async () => {
        const revenue = await contract.revenue();
        expectedRewards = STAKE.mul(revenue.addn(100)).divn(100);
        expectedStartsAt = await web3.eth
          .getBlock(result.receipt.blockNumber)
          .then((res) => new BN(res.timestamp));
        stake = await contract.getStake(account, stakeObjectsCountBefore);
      });
      it("should 'amount' field be equal to amount", () =>
        assert.strictEqual(stake.amount.toString(10), STAKE.toString(10)));
      it("should 'reward' field be equal to expected", () =>
        assert.strictEqual(
          stake.rewards.toString(10),
          expectedRewards.toString(10)
        ));
      it("should 'withdrawn' field be equal to zero", () =>
        assert.strictEqual(stake.withdrawn.toString(10), "0"));
      it("should 'timestamp' field be equal to transaction timestamp", () =>
        assert.strictEqual(
          stake.startsAt.toString(10),
          expectedStartsAt.toString(10)
        ));
    });
    describe("should emit events", () => {
      let stakedEvent: Truffle.TransactionLog<Staked>;
      before(async () => {
        stakedEvent = result.logs[0] as Truffle.TransactionLog<Staked>;
      });
      describe("Event #1", () => {
        it("with event name equal to expected", () =>
          assert.strictEqual(stakedEvent.event, "Staked"));
        it("with 'account' field equal to caller", () =>
          assert.strictEqual(stakedEvent.args.account, account));
        it("with 'stakeId' field equal to expected", () =>
          assert.strictEqual(
            stakedEvent.args.stakeId.toString(10),
            stakeObjectsCountBefore.toString(10)
          ));
        it("with 'amount' field equal to amount", () =>
          assert.strictEqual(
            stakedEvent.args.amount.toString(10),
            STAKE.toString(10)
          ));
      });
    });
  });
});
