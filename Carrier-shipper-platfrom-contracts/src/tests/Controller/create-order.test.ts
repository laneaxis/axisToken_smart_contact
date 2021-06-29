import { testReject, UnPromisify } from "solowei";

import { ControllerInstance, MockedFeeTokenInstance, MockedPaymentTokenInstance } from "@contracts";
import { OrderCreated } from "@contracts/Controller";

import { getAccounts, randomAccount, getFeeToken, getPaymentToken, BN_ONE_ATTO_MANTISSA } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: createOrder', () => {
  const accounts = getAccounts();
  const OWNER = accounts[0];

  let contract: ControllerInstance;
  let feeToken: MockedFeeTokenInstance;
  let paymentToken: MockedPaymentTokenInstance;
  before(async () => {
    feeToken = await getFeeToken();
    paymentToken = await getPaymentToken();
    contract = await Controller.new([OWNER], feeToken.address, feeToken.address, { mantissa: '0' })
  });

  describe('When caller is not owner', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = { mantissa: '0' };

    testReject(() => contract.createOrder(SALT, ID, SHIPPER, CARRIER, FEE, { from: accounts[1] }), 'Not owner');
  });

  describe('When already created', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    before(() => contract.createOrder(...params));
    testReject(() => contract.createOrder(...params), 'Create2: Failed on deploy');
  });

  describe('When locked', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = { mantissa: '0' };

    before(async () => {
      const precomputed = await contract.computeOrderAddress(SALT, ID, SHIPPER, CARRIER, FEE);
      await contract.lock(precomputed);
    });

    testReject(() => contract.createOrder(SALT, ID, SHIPPER, CARRIER, FEE), 'Order locked');
  });

  describe('When not locked', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '1';
    const SALT = '0xffff';
    const FEE = { mantissa: '0' };

    let result: UnPromisify<ReturnType<ControllerInstance["createOrder"]>> | undefined;

    it('should success', async () => {
      result = await contract.createOrder(SALT, ID, SHIPPER, CARRIER, FEE);
    });

    it('should emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'OrderCreated');
      assert.strictEqual(logs.length, 1);
    })

    it('created order address should equal to precomputed', async function () {
      if (!result) throw this.skip();
      const precomputed = await contract.computeOrderAddress(SALT, ID, SHIPPER, CARRIER, FEE);
      const order = result.logs.find(({ event }) => event === 'OrderCreated') as Truffle.TransactionLog<OrderCreated>;
      assert.strictEqual(order.args.order, precomputed);
    });
  });

});
