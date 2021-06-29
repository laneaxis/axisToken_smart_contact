import BN from 'bn.js';
import { testReject, UnPromisify, ZERO_ADDRESS } from "solowei";

import { ControllerInstance, MockedFeeTokenInstance, MockedPaymentTokenInstance } from "@contracts";

import { getAccounts, randomAccount, getFeeToken, getPaymentToken, BN_ONE_ATTO_MANTISSA } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: withdrawFeeTokenFees', () => {
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
    testReject(() => contract.withdrawFeeTokenFees(randomAccount(), '1', { from: accounts[1] }), 'Not owner');
  });

  describe('When requested amount is zero', () => {
    testReject(() => contract.withdrawFeeTokenFees(randomAccount(), '0'), 'Amount not positive');
  });

  describe('When there is no such fees amount', () => {
    let amount: BN;
    before(async () => amount = await contract.feeTokenBalance());
    testReject(() => contract.withdrawFeeTokenFees(randomAccount(), amount.addn(1).toString()), 'No enough fees');
  });

  describe('When receiver is zero address', () => {
    const amount = 1;
    before(async () => feeToken.mint(contract.address, amount.toString()));
    testReject(() => contract.withdrawFeeTokenFees(ZERO_ADDRESS, amount.toString()), 'To is zero address');
  });

  describe('When all conditions are met', () => {
    const RECEIVER = randomAccount();
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const FEE_AMOUNT = new BN('1000');
    const PAYMENT_AMOUNT  = new BN('1000');

    let initialBalances: Record<string, BN>;
    let precomputed: string;
    let result: UnPromisify<ReturnType<ControllerInstance["withdrawFeeTokenFees"]>> | undefined;

    before(async () => {
      precomputed = await contract.computeOrderAddress(...params);
      await feeToken.mint(OWNER, FEE_AMOUNT);
      await feeToken.transfer(precomputed, FEE_AMOUNT);
      await paymentToken.mint(OWNER, PAYMENT_AMOUNT);
      await paymentToken.transfer(precomputed, PAYMENT_AMOUNT);
      await contract.createOrder(...params);
      initialBalances = {
        controller: await feeToken.balanceOf(contract.address),
        receiver: await feeToken.balanceOf(RECEIVER),
      };
    });

    it('should success', async () => {
      result = await contract.withdrawFeeTokenFees(RECEIVER, FEE_AMOUNT);
    });

    it('should emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'FeeWithdrawed');
      assert.strictEqual(logs.length, 1);
    })

    it('contract balance in fee token should decrease on configured fee amount', async () => {
      const balance = await feeToken.balanceOf(contract.address);
      assert.strictEqual(balance.toString(), initialBalances.controller.sub(FEE_AMOUNT).toString());
    })

    it('receiver balance in fee token should increase on configured fee amount', async () => {
      const balance = await feeToken.balanceOf(RECEIVER);
      assert.strictEqual(balance.toString(), initialBalances.receiver.add(FEE_AMOUNT).toString());
    });

  });
 
});
