import { testReject, UnPromisify, ZERO_ADDRESS } from "solowei";

import { ControllerInstance } from "@contracts";

import { getAccounts, randomAccount } from "../utils";

const Controller = artifacts.require('Controller');

describe('Method: lock', () => {
  const accounts = getAccounts();
  const OWNER = accounts[0];

  let contract: ControllerInstance;
  before(async () => {
    contract = await Controller.new([OWNER], ZERO_ADDRESS, ZERO_ADDRESS, { mantissa: '0' })
  });

  describe('When caller is not owner', () => {
    testReject(() => contract.lock(ZERO_ADDRESS, { from: accounts[1] }), 'Not owner');
  });

  describe('When order address is invalid', () => {
    testReject(() => contract.lock(ZERO_ADDRESS), 'Order is zero address');
  });

  describe('When already locked', () => {
    const order = randomAccount();

    let result: UnPromisify<ReturnType<ControllerInstance["lock"]>> | undefined;

    before(() => contract.lock(order));

    it('should success', async () => {
      result = await contract.lock(order);
    });

    it('should not emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'OrderLocked');
      assert.strictEqual(logs.length, 0);
    })

    it('order should be locked', async function () {
      if (!result) throw this.skip();
      const isLocked = await contract.locked(order);
      assert.strictEqual(isLocked, true);
    });
  });

  describe('When not locked', () => {
    const order = randomAccount();

    let result: UnPromisify<ReturnType<ControllerInstance["lock"]>> | undefined;

    it('should success', async () => {
      result = await contract.lock(order);
    });

    it('should emit event', function () {
      if (!result) throw this.skip();
      const logs = result.logs.filter(({ event }) => event === 'OrderLocked');
      assert.strictEqual(logs.length, 1);
    })

    it('order should be locked', async function () {
      if (!result) throw this.skip();
      const isLocked = await contract.locked(order);
      assert.strictEqual(isLocked, true);
    });
  });

});
