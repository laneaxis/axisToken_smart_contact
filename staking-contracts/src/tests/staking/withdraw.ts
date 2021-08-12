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
  let stakeId: BN;
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
    before(async () => {
      const INCREASE_AMOUNT = STAKE.mul(revenue).divn(100);
      const AMOUNT = STAKE.add(INCREASE_AMOUNT);
      await token.mint(account, AMOUNT);
      await token.approve(contract.address, AMOUNT);
      await contract.increaseRewardPool(INCREASE_AMOUNT);
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
    let stake: { amount: BN; rewards: BN; withdrawn: BN; startsAt: BN };
    let intervalRewards: BN;
    let result: Truffle.TransactionResponse<Withdrawn>;
    before(async () => {
      stake = await contract.getStake(account, stakeId);
      intervalRewards = new BN(stake.rewards).div(intervalsCount);
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
    describe("When amount only from rewards part", () => {
      let totalStakedBefore: BN;
      let rewardPoolBefore: BN;
      let balanceBefore: BN;
      let contractBalanceBefore: BN;
      before(async () => {
        await contract.increaseTime(intervalDuration);
        totalStakedBefore = await contract.totalStaked();
        rewardPoolBefore = await contract.rewardPool();
        balanceBefore = await token.balanceOf(account);
        contractBalanceBefore = await token.balanceOf(contract.address);
      });
      it("should availableToWithdraw be equal to one interval rewards", async () => {
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
          .withdraw(stakeId, intervalRewards)
          .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
      });
      it("should availableToWithdraw be equal to zero", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(availableToWithdraw.toString(10), '0');
      });
      it("should update 'withdrawn' field of stake object be equal to one interval rewards", async () => {
        stake = await contract.getStake(account, stakeId);
        assert.strictEqual(
          new BN(stake.withdrawn).toString(10),
          intervalRewards.toString(10)
        );
      });
      it("should decrease rewardPool for amount", async () => {
        const rewardPool = await contract.rewardPool();
        assert.strictEqual(
          rewardPool.toString(10),
          rewardPoolBefore
            .sub(intervalRewards)
            .toString(10)
        );
      });
      it("should no effect totalStaked", async () => {
        const totalStaked = await contract.totalStaked();
        assert.strictEqual(
          totalStaked.toString(10),
          totalStakedBefore.toString(10)
        );
      });
      it("should decrease contract balance for amount", async () => {
        const contractBalance = await token.balanceOf(contract.address);
        assert.strictEqual(
          contractBalance.toString(10),
          contractBalanceBefore.sub(intervalRewards).toString(10)
        );
      });
      it("should increase account balance for amount", async () => {
        const balance = await token.balanceOf(account);
        assert.strictEqual(
          balance.toString(10),
          balanceBefore.add(intervalRewards).toString(10)
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
              intervalRewards.toString(10)
            ));
        });
      });
    });
    describe("When all intervals ended", () => {
      let totalStakedBefore: BN;
      let rewardPoolBefore: BN;
      let balanceBefore: BN;
      let contractBalanceBefore: BN;
      let available: BN;
      let withdrawAmount: BN;
      let residual: BN;
      before(async () => {
        await contract.increaseTime(intervalDuration.mul(intervalsCount));
        available = intervalRewards.mul(intervalsCount.subn(1)).add(STAKE);
        residual = new BN(10);
        withdrawAmount = available.sub(residual);
      });
      it("should availableToWithdraw be equal for all rewards", async () => {
        const availableToWithdraw = await contract.availableToWithdraw(
          account,
          stakeId
        );
        assert.strictEqual(
          availableToWithdraw.toString(10),
          available.toString(10)
        );
      });
      describe("When amount partly from rewards and stakeAmount parts", () => {
        before(async () => {
          totalStakedBefore = await contract.totalStaked();
          rewardPoolBefore = await contract.rewardPool();
          balanceBefore = await token.balanceOf(account);
          contractBalanceBefore = await token.balanceOf(contract.address);
        });
        it("should success", async () => {
          result = await contract
            .withdraw(stakeId, withdrawAmount)
            .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
        });
        it("should availableToWithdraw be equal residual rewards", async () => {
          const availableToWithdraw = await contract.availableToWithdraw(
            account,
            stakeId
          );
          assert.strictEqual(availableToWithdraw.toString(10), residual.toString(10));
        });
        it("should update 'withdrawn' field of stake object", async () => {
          stake = await contract.getStake(account, stakeId);
          assert.strictEqual(
            new BN(stake.withdrawn).toString(10),
            new BN(stake.rewards).add(new BN(stake.amount)).sub(residual).toString(10)
          );
        });
        it("should decrease rewardPool for reward part of amount", async () => {
          const rewardPool = await contract.rewardPool();
          assert.strictEqual(
            rewardPool.toString(10),
            rewardPoolBefore
              .sub(intervalRewards.mul(intervalsCount.subn(1)))
              .toString(10)
          );
        });
        it("should decrease totalStaked for stake part of amount", async () => {
          const totalStaked = await contract.totalStaked();
          assert.strictEqual(
            totalStaked.toString(10),
            totalStakedBefore.sub(STAKE.sub(residual)).toString(10)
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
              )
            );
          });
        });
      });
      describe("When amount only from stakeAmount part", () => {
        before(async () => {
          totalStakedBefore = await contract.totalStaked();
          rewardPoolBefore = await contract.rewardPool();
          balanceBefore = await token.balanceOf(account);
          contractBalanceBefore = await token.balanceOf(contract.address);
        });
        it("should success", async () => {
          result = await contract
            .withdraw(stakeId, residual)
            .then((res) => res as Truffle.TransactionResponse<Withdrawn>);
        });
        it("should availableToWithdraw be equal to zero", async () => {
          const availableToWithdraw = await contract.availableToWithdraw(
            account,
            stakeId
          );
          assert.strictEqual(availableToWithdraw.toString(10), "0");
        });
        it("should update 'withdrawn' field of stake object be updated", async () => {
          stake = await contract.getStake(account, stakeId);
          assert.strictEqual(
            new BN(stake.withdrawn).toString(10),
            new BN(stake.rewards).add(new BN(stake.amount)).toString(10)
          );
        });
        it("should no effect rewardPool", async () => {
          const rewardPool = await contract.rewardPool();
          assert.strictEqual(
            rewardPool.toString(10),
            rewardPoolBefore.toString(10)
          );
        });
        it("should decrease totalStaked for amount", async () => {
          const totalStaked = await contract.totalStaked();
          assert.strictEqual(totalStaked.toString(10), "0");
        });
        it("should decrease contract balance for amount", async () => {
          const contractBalance = await token.balanceOf(contract.address);
          assert.strictEqual(contractBalance.toString(10), "0");
        });
        it("should increase account balance for amount", async () => {
          const balance = await token.balanceOf(account);
          assert.strictEqual(
            balance.toString(10),
            balanceBefore.add(residual).toString(10)
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
                residual.toString(10)
              )
            );
          });
        });
      });
    });
  });
});
