import { ControllerInstance } from "@contracts";

import { BN_ONE_ATTO_MANTISSA, getAccounts, lowercaseEqual, randomAccount } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: Constructor', () => {
  const accounts = getAccounts();
  const OWNER = accounts[0];

  describe('When all conditions are met', () => {
    const FEE_TOKEN = randomAccount();
    const PAYMENT_TOKEN = randomAccount();
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    let contract: ControllerInstance;

    it('should success', async () => {
      contract = await Controller.new([OWNER], FEE_TOKEN, PAYMENT_TOKEN, { mantissa: FEE.toString() });
    });

    it('fee token should be set', async () => {
      const actualToken = await contract.feeToken();
      lowercaseEqual(actualToken, FEE_TOKEN);
    });

    it('payment token should be set', async () => {
      const actualToken = await contract.paymentToken();
      lowercaseEqual(actualToken, PAYMENT_TOKEN);
    });

    it('fee should be set', async () => {
      const actualFee = await contract.fee();
      assert.strictEqual(actualFee.mantissa.toString(), FEE.toString());
    });

  });

});
