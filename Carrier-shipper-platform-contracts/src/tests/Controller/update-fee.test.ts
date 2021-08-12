import { testReject, UnPromisify } from "solowei";

import { ControllerInstance, MockedFeeTokenInstance, MockedPaymentTokenInstance } from "@contracts";

import { getAccounts, getFeeToken, getPaymentToken, BN_ONE_ATTO_MANTISSA } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: updateFee', () => {
  const accounts = getAccounts();
  const OWNER = accounts[0];

  let contract: ControllerInstance;
  let feeToken: MockedFeeTokenInstance;
  let paymentToken: MockedPaymentTokenInstance;
  before(async () => {
    feeToken = await getFeeToken();
    paymentToken = await getPaymentToken();
    contract = await Controller.new([OWNER], feeToken.address, paymentToken.address, { mantissa: '0' })
  });

  describe('When caller is not owner', () => {
    testReject(() => contract.updateFee({ mantissa: '0' }, { from: accounts[1] }), 'Not owner');
  });

  describe('When fee is greater than 1', () => {
    testReject(() => contract.updateFee({ mantissa: BN_ONE_ATTO_MANTISSA.muln(2).toString() }), 'Invalid percent value');
  });

  describe('When all conditions are met', () => {
    const FEE = '10';
    let result: UnPromisify<ReturnType<ControllerInstance["unlock"]>> | undefined;

    it('should success', async () => {
      result = await contract.updateFee({ mantissa: FEE.toString() });
    });

    it('should emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'FeeUpdated');
      assert.strictEqual(logs.length, 1);
    });

    it('fee should be set', async () => {
      const fee = await contract.fee();
      assert.strictEqual(fee.mantissa.toString(), FEE.toString());
    });
  });
 
});
