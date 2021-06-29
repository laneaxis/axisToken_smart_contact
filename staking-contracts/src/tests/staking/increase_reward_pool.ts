import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { MockedStakingTokenInstance, StakingInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import { RewardPoolIncreased, StakingContract } from "@contracts/Staking";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

describe("Method: increaseRewardPool(amount: uint256): bool", () => {
  const INCREASE_AMOUNT = new BN("1500000000000000000");
  let notOwner: string;
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: StakingInstance;
  before(async () => {
    [account, notOwner] = getAccounts();
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
  describe("When caller is not owner", () => {
    testReject(
      () => contract.increaseRewardPool(INCREASE_AMOUNT, { from: notOwner }),
      "Not owner"
    );
  });
  describe("When amount equal to 0", () => {
    testReject(() => contract.increaseRewardPool(0), "Amount not positive");
  });
  describe("When all conditions are good", () => {
    let result: Truffle.TransactionResponse<RewardPoolIncreased>;
    let rewardPoolBefore: BN;
    let balanceBefore: BN;
    let contractBalanceBefore: BN;
    before(async () => {
      await token.mint(account, INCREASE_AMOUNT);
      await token.approve(contract.address, INCREASE_AMOUNT);
      rewardPoolBefore = await contract.rewardPool();
      balanceBefore = await token.balanceOf(account);
      contractBalanceBefore = await token.balanceOf(contract.address);
    });
    it("should success", async () => {
      result = await contract
        .increaseRewardPool(INCREASE_AMOUNT)
        .then((res) => res as Truffle.TransactionResponse<RewardPoolIncreased>);
    });
    it("should increase rewardPool for amount", async () => {
      const rewardPool = await contract.rewardPool();
      assert.strictEqual(
        rewardPool.toString(10),
        rewardPoolBefore.add(INCREASE_AMOUNT).toString(10)
      );
    });
    it("should increase contract balance from amount", async () => {
      const contractBalance = await token.balanceOf(contract.address);
      assert.strictEqual(
        contractBalance.toString(10),
        contractBalanceBefore.add(INCREASE_AMOUNT).toString(10)
      );
    });
    it("should decrease caller balance for amount", async () => {
      const balance = await token.balanceOf(account);
      assert.strictEqual(
        balance.toString(10),
        balanceBefore.sub(INCREASE_AMOUNT).toString(10)
      );
    });
    describe("should emit events", () => {
      let rewardPoolIncreasedEvent: Truffle.TransactionLog<RewardPoolIncreased>;
      before(async () => {
        rewardPoolIncreasedEvent = result
          .logs[0] as Truffle.TransactionLog<RewardPoolIncreased>;
      });
      describe("Event #1", () => {
        it("with event name equal to expected", () =>
          assert.strictEqual(
            rewardPoolIncreasedEvent.event,
            "RewardPoolIncreased"
          ));
        it("with 'owner' field equal to expected", () =>
          assert.strictEqual(rewardPoolIncreasedEvent.args.owner, account));
        it("with 'amount' field equal to expected", () =>
          assert.strictEqual(
            rewardPoolIncreasedEvent.args.amount.toString(10),
            INCREASE_AMOUNT.toString(10)
          ));
      });
    });
  });
});
