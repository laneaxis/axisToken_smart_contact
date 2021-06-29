import assert from "assert";
import BN from "bn.js";

import { MockedStakingTokenInstance, StakingInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { getTokenStaking } from "@utils";
import { Staked, StakingContract } from "@contracts/Staking";

const ERC20 = artifacts.require("ERC20");
const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

describe("Method: getStakes(account: address, offset: uint256, limit: uint256): StakeData[]", () => {
  let account: string;
  let token: MockedStakingTokenInstance;
  let contract: StakingInstance;
  let stakes: {
    amount: BN;
    rewards: BN;
    withdrawn: BN;
    startsAt: BN;
  }[] = [];
  let result: {
    amount: BN;
    rewards: BN;
    withdrawn: BN;
    startsAt: BN;
  }[];
  let stakesCount: BN;
  before(async () => {
    const STAKE = new BN("1500000000000000000");
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
    await token.mint(account, STAKE.mul(new BN(3)));
    await token.approve(contract.address, STAKE.mul(new BN(3)));
    await contract.increaseRewardPool(STAKE);
    await contract
      .getStake(
        account,
        await contract
          .stake(STAKE)
          .then(
            (res) =>
              (res.logs[0] as Truffle.TransactionLog<Staked>).args.stakeId
          )
      )
      .then((res) => stakes.push(res));
    await contract
      .getStake(
        account,
        await contract
          .stake(STAKE.sub(new BN(100)))
          .then(
            (res) =>
              (res.logs[0] as Truffle.TransactionLog<Staked>).args.stakeId
          )
      )
      .then((res) => stakes.push(res));
    stakesCount = await contract.getStakesCount(account);
  });
  describe("When limit > stakes count", () => {
    it("should success", async () => {
      result = await contract.getStakes(
        account,
        0,
        stakesCount.add(new BN(500))
      );
    });
    it("should result length be equal to stakes count", () =>
      assert.strictEqual(result.length.toString(10), stakesCount.toString(10)));
    it("should result contains valid objects", () => {
      for (let i = 0; i < stakesCount.toNumber(); i++) {
        assert.strictEqual(
          JSON.stringify(result[i]),
          JSON.stringify(stakes[stakes.length - i - 1])
        );
      }
    });
  });
  describe("When offset > stakes count - 1", () => {
    it("should success", async () => {
      result = await contract.getStakes(account, stakesCount, 1);
    });
    it("should result length be equal to zero", () =>
      assert.strictEqual(result.length.toString(10), "0"));
  });
  describe("when offset <= stakes count - 1; limit < stakes count", () => {
    it("should success", async () => {
      result = await contract.getStakes(account, 1, 1);
    });
    it("should result length be equal to 1", () =>
      assert.strictEqual(result.length.toString(10), "1"));
    it("should result contains valid objects", () =>
      assert.strictEqual(JSON.stringify(result[0]), JSON.stringify(stakes[0])));
  });
});
