import { testTwoStageOwnable } from "solowei";

import { LockupContract, TwoStageOwnableInstance } from "@contracts";
import { setAccounts, getDefaultConstructorParams } from "@test-utils";

const MockedToken = artifacts.require("MockedToken");
const Lockup = artifacts.require("Lockup");

contract("Lockup", (accounts) => {
  before(() => setAccounts(accounts));
  require("./constructor");
  require("./deposit");
  require("./available-to-withdraw");
  require("./withdraw");
  require("./get-deposits");
  testTwoStageOwnable(
    async (owner) => {
      const CONSTRUCTOR_PARAMS = await getDefaultConstructorParams(
        MockedToken,
        { owner_: owner }
      );
      return Lockup.new(
        ...(CONSTRUCTOR_PARAMS as Parameters<LockupContract["new"]>)
      ) as Promise<TwoStageOwnableInstance>;
    },
    () => accounts
  );
});
