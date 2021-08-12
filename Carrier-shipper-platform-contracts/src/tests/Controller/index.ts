import { MultiOwnableInstance } from "@contracts";
import { multiOwnableTest } from "../MultiOwnable";
import { ZERO_ADDRESS } from "solowei";
import { setAccounts } from "../utils";

const Controller = artifacts.require('Controller');

contract('Controller', (accounts) => {
  setAccounts(accounts);
  require('./constructor.test');
  require('./create-order.test');
  require('./lock.test');
  require('./unlock.test');
  require('./update-fee.test');
  require('./withdraw-fee-token-fees.test');
  require('./withdraw-payment-token-fees.test');
  multiOwnableTest(
    async (owners) => await Controller.new(
      owners,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      { mantissa: '0' },
    ) as MultiOwnableInstance,
    () => accounts,
  );
});
