import assert from "assert";
import BN from "bn.js";

import { MockedTokenInstance, MockedLockupInstance } from "@contracts";
import {
  DefaultParameters,
  getAccounts,
  getDefaultConstructorParams,
  makeDeposit,
  WEEK,
} from "@test-utils";
import { getToken } from "@utils";

const ERC20 = artifacts.require("ERC20");
const MockedToken = artifacts.require("MockedToken");
const MockedLockup = artifacts.require("MockedLockup");

interface IDeposit {
  amount: string;
  withdrawn: string;
  depositedAt: string;
  lockupEndsAt: string;
  unlockEndsAt: string;
}

describe("Method: getDeposits(offset: uint256, limit: uint256): DepositData[]", () => {
  const LOCKUP_DURATION = new BN(1e5);
  const UNLOCK_DURATION = new BN(30);
  let account: string;
  let notOwner: string;
  let token: MockedTokenInstance;
  let constructorParams: DefaultParameters;

  before(async () => {
    [account, notOwner] = getAccounts();
    token = (await getToken(ERC20, MockedToken)) as MockedTokenInstance;
    constructorParams = await getDefaultConstructorParams(MockedToken, {
      lockupDuration_: LOCKUP_DURATION.toString(),
      unlockDuration_: UNLOCK_DURATION.toString(),
    });
  });

  describe("When there not deposits", () => {
    let contract: MockedLockupInstance;
    let result: any[];

    before(async () => {
      contract = await MockedLockup.new(...constructorParams);
    });

    it("should success", async () => {
      result = await contract.getDeposits(0, 1e5);
    });

    it("result should be empty array", function () {
      if (!result) this.skip();
      assert.strictEqual(result.length, 0);
    });
  });

  describe("When there deposits", () => {
    const COUNT = 10;
    const AMOUNT = new BN(100);
    let contract: MockedLockupInstance;
    let expected: IDeposit[];

    const depositFactory = async (i: number): Promise<IDeposit> => {
      const depositedAt = await contract.mockedTimestamp();
      return {
        amount: AMOUNT.addn(i).toString(),
        withdrawn: "0",
        depositedAt: depositedAt.toString(),
        lockupEndsAt: depositedAt.add(LOCKUP_DURATION.mul(WEEK)).toString(),
        unlockEndsAt: depositedAt
          .add(LOCKUP_DURATION.add(UNLOCK_DURATION).mul(WEEK))
          .toString(),
      };
    };

    const getDeposits = async (
      ...args: Parameters<MockedLockupInstance["getDeposits"]>
    ): Promise<IDeposit[]> => {
      const result = await contract.getDeposits(...args);
      return result.map((deposit) => ({
        amount: deposit.amount.toString(),
        withdrawn: deposit.withdrawn.toString(),
        depositedAt: deposit.depositedAt.toString(),
        lockupEndsAt: deposit.lockupEndsAt.toString(),
        unlockEndsAt: deposit.unlockEndsAt.toString(),
      }));
    };

    const testPagination = (
      describeName: string,
      offset: number,
      limit: number | BN,
      itName: string = "result should equal to expected"
    ) => {
      describe(describeName, () => {
        let result: IDeposit[];

        it("should success", async () => {
          result = await getDeposits(offset, limit);
        });

        it(itName, function () {
          if (!result) this.skip();
          const nLimit = typeof limit === "number" ? limit : limit.toNumber();
          assert.deepStrictEqual(
            result,
            expected.slice(offset, offset + nLimit)
          );
        });
      });
    };

    before(async () => {
      contract = await MockedLockup.new(...constructorParams);
      expected = await Promise.all(
        Array.from({ length: COUNT }, async (_, i) => depositFactory(i))
      );
      for (const deposit of expected) {
        await makeDeposit(deposit.amount, account, token, contract);
      }
    });

    testPagination("When offset is zero and limit is COUNT", 0, COUNT);
    testPagination(
      "When offset is count",
      COUNT,
      COUNT,
      "result should be empty array"
    );
    testPagination("When offset is 1 and limit is 1", 1, 1);
    testPagination("When limit is greater than COUNT", 1, 1);
    testPagination(
      "When offset is index of last element limit is greater than COUNT",
      COUNT - 2,
      COUNT
    );
  });
});
