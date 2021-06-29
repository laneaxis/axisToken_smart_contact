import assert from "assert";
import BN from "bn.js";
import { testReject } from "solowei";

import { StakingInstance } from "@contracts";
import { getAccounts, getDefaultConstructorParams } from "@test-utils";
import { MinStakeAmountUpdated, StakingContract } from "@contracts/Staking";

const MockedStakingToken = artifacts.require("MockedStakingToken");
const Staking = artifacts.require("Staking");

describe("Method: setMinStakeAmount(value: uint256): bool", () => {
  const VALUE = new BN("1500000000000000000");
  let notOwner: string;
  let account: string;
  let contract: StakingInstance;
  before(async () => {
    [account, notOwner] = getAccounts();
    const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
      MockedStakingToken
    );
    contract = await Staking.new(
      ...(CONSTRUCTOR_PARAMS as Parameters<StakingContract["new"]>)
    );
  });
  describe("When caller is not owner", () => {
    testReject(
      () => contract.setMinStakeAmount(VALUE, { from: notOwner }),
      "Not owner"
    );
  });
  describe("When all conditions are good", () => {
    let result: Truffle.TransactionResponse<MinStakeAmountUpdated>;
    it("should success", async () => {
      result = await contract
        .setMinStakeAmount(VALUE)
        .then(
          (res) => res as Truffle.TransactionResponse<MinStakeAmountUpdated>
        );
    });
    it("should minStakeValue be equal to value", async () => {
      const minStakeAmount = await contract.minStakeAmount();
      assert.strictEqual(minStakeAmount.toString(10), VALUE.toString(10));
    });
    describe("should emit events", () => {
      let minStakeAmountUpdatedEvent: Truffle.TransactionLog<MinStakeAmountUpdated>;
      before(async () => {
        minStakeAmountUpdatedEvent = result
          .logs[0] as Truffle.TransactionLog<MinStakeAmountUpdated>;
      });
      describe("Event #1", () => {
        it("with event name equal to expected", () =>
          assert.strictEqual(
            minStakeAmountUpdatedEvent.event,
            "MinStakeAmountUpdated"
          ));
        it("with 'owner' field equal to expected", () =>
          assert.strictEqual(minStakeAmountUpdatedEvent.args.owner, account));
        it("with 'amount' field equal to expected", () =>
          assert.strictEqual(
            minStakeAmountUpdatedEvent.args.value.toString(10),
            VALUE.toString(10)
          ));
      });
    });
  });
});
