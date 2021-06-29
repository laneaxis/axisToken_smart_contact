import { testReject, UnPromisify, ZERO_ADDRESS } from "solowei";

import { ControllerInstance, MockedFeeTokenInstance, MockedPaymentTokenInstance } from "@contracts";

import { getAccounts, randomAccount, getFeeToken, getPaymentToken, BN_ONE_ATTO_MANTISSA } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: unlock', () => {
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
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const PENALTY = BN_ONE_ATTO_MANTISSA.muln(2);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const precomputed = randomAccount();

    testReject(() => contract.unlock(
      precomputed,
      { mantissa: PENALTY.toString() },
      ...params,
      { from: accounts[1] },
    ), 'Not owner');
  });

  describe('When order address is invalid', () => {
    testReject(() => contract.lock(ZERO_ADDRESS), 'Order is zero address');
  });

  describe('When penalty is greater than 1', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const PENALTY = BN_ONE_ATTO_MANTISSA.muln(2);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const precomputed = randomAccount();

    testReject(() => contract.unlock(
      precomputed,
      { mantissa: PENALTY.toString() },
      ...params,
    ), 'Invalid percent value');
  });

  describe('When order is not locked', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const PENALTY = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const precomputed = randomAccount();

    testReject(() => contract.unlock(
      precomputed,
      { mantissa: PENALTY.toString() },
      ...params,
    ), 'Order not locked');
  });

  describe('When order address was wrong computed', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const PENALTY = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const precomputed = randomAccount();

    before(() => contract.lock(precomputed));

    testReject(() => contract.unlock(
      precomputed,
      { mantissa: PENALTY.toString() },
      ...params,
    ), 'Invalid order address');
  });

  describe('When all conditions are met', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const PENALTY = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    let precomputed: string;
    let result: UnPromisify<ReturnType<ControllerInstance["unlock"]>> | undefined;

    before(async () => {
      precomputed = await contract.computeOrderAddress(...params);
      await contract.lock(precomputed);
    });

    it('should success', async () => {
      result = await contract.unlock(precomputed, { mantissa: PENALTY.toString() }, ...params);
    });

    it('should emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'OrderUnlocked');
      assert.strictEqual(logs.length, 1);
    });

    it('order should be unlocked', async () => {
      const isLocked = await contract.locked(precomputed);
      assert.strictEqual(isLocked, false);
    });

    it('penalty should be set', async () => {
      const actualPenalty = await contract.shipperDistribution(precomputed);
      assert.strictEqual(actualPenalty.mantissa.toString(), PENALTY.toString());
    });

    it('order contract should be created', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'OrderCreated');
      assert.strictEqual(logs.length, 1);
    })

  });


  
});
