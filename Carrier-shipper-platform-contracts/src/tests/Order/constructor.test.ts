import { ControllerInstance, MockedFeeTokenInstance, MockedPaymentTokenInstance } from "@contracts";
import { BN_ONE_ATTO_MANTISSA, getAccounts, getFeeToken, getPaymentToken, randomAccount } from "../utils";
import BN from 'bn.js';

const Controller = artifacts.require('Controller');

describe('Method: constructor', () => {
  const accounts = getAccounts();
  const OWNER = accounts[0];

  let feeToken: MockedFeeTokenInstance;
  let paymentToken: MockedPaymentTokenInstance;
  let controller: ControllerInstance; 

  before(async () => {
    feeToken = await getFeeToken();
    paymentToken = await getPaymentToken();
    controller = await Controller.new([OWNER], feeToken.address, paymentToken.address, { mantissa: '0' });
  });

  describe('When was not locked and payment amount is 1000 and fee is 20%', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const FEE_AMOUNT = new BN('1000');
    const PAYMENT_AMOUNT  = new BN('1000');

    const CONTROLLER_CHANGE_IN_PAYMENT_TOKEN = PAYMENT_AMOUNT.mul(FEE).div(BN_ONE_ATTO_MANTISSA);
    const CARRIER_CHANGE_IN_PAYMENT_TOKEN = PAYMENT_AMOUNT.sub(CONTROLLER_CHANGE_IN_PAYMENT_TOKEN);

    let precomputed: string;
    let inititalBalances: {
      feeToken: {
        controller: BN;
        shipper: BN;
        carrier: BN;
      },
      paymentToken: {
        controller: BN,
        shipper: BN,
        carrier: BN,
      },
    };

    before(async () => {
      precomputed = await controller.computeOrderAddress(...params);
      await feeToken.mint(OWNER, FEE_AMOUNT);
      await feeToken.transfer(precomputed, FEE_AMOUNT);
      await paymentToken.mint(OWNER, PAYMENT_AMOUNT);
      await paymentToken.transfer(precomputed, PAYMENT_AMOUNT);
      inititalBalances = {
        feeToken: {
          controller: await feeToken.balanceOf(controller.address),
          shipper: await feeToken.balanceOf(SHIPPER),
          carrier: await feeToken.balanceOf(CARRIER),
        },
        paymentToken: {
          controller: await paymentToken.balanceOf(controller.address),
          shipper: await paymentToken.balanceOf(SHIPPER),
          carrier: await paymentToken.balanceOf(CARRIER),
        }
      }
    });

    it('should success', async () => {
      await controller.createOrder(...params);
    });

    it(`controller balance in fee token should increase on fee amount`, async () => {
      const balance = await feeToken.balanceOf(controller.address);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.controller.add(FEE_AMOUNT).toString());
    });

    it('shipper balance in fee token should not change', async () => {
      const balance = await feeToken.balanceOf(SHIPPER);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.shipper.toString());
    });

    it('carrier balance in fee token should not change', async () => {
      const balance = await feeToken.balanceOf(CARRIER);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.carrier.toString());
    });

    it(`controller balance in fee token should increase on payment amount mul controller fee`, async () => {
      const balance = await paymentToken.balanceOf(controller.address);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.controller.add(CONTROLLER_CHANGE_IN_PAYMENT_TOKEN).toString())
    });

    it('shipper balance in payment token should not change', async () => {
      const balance = await paymentToken.balanceOf(SHIPPER);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.shipper.toString());
    });

    it(`carrier balance in payment token should increase on payment amount mul (one sub controller fee)`, async () => {
      const balance = await paymentToken.balanceOf(CARRIER);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.carrier.add(CARRIER_CHANGE_IN_PAYMENT_TOKEN).toString());
    });

  });

  describe('When was locked', () => {
    const SHIPPER = randomAccount();
    const CARRIER = randomAccount();
    const ID = '2';
    const SALT = '0xffff';
    const FEE = BN_ONE_ATTO_MANTISSA.divn(5);
    const params = [SALT, ID, SHIPPER, CARRIER, { mantissa: FEE.toString() }] as const;
    const FEE_AMOUNT = new BN('1000');
    const PAYMENT_AMOUNT  = new BN('1000');
    const PENALTY = BN_ONE_ATTO_MANTISSA.divn(2);

    const CONTROLLER_CHANGE_IN_PAYMENT_TOKEN = PAYMENT_AMOUNT.mul(FEE).div(BN_ONE_ATTO_MANTISSA);
    const SHIPPER_CHANGE_IN_PAYMENT_TOKEN = PAYMENT_AMOUNT.sub(CONTROLLER_CHANGE_IN_PAYMENT_TOKEN).mul(PENALTY).div(BN_ONE_ATTO_MANTISSA);
    const CARRIER_CHANGE_IN_PAYMENT_TOKEN = PAYMENT_AMOUNT.sub(CONTROLLER_CHANGE_IN_PAYMENT_TOKEN).sub(SHIPPER_CHANGE_IN_PAYMENT_TOKEN);

    let precomputed: string;
    let inititalBalances: {
      feeToken: {
        controller: BN;
        shipper: BN;
        carrier: BN;
      },
      paymentToken: {
        controller: BN,
        shipper: BN,
        carrier: BN,
      },
    };

    before(async () => {
      precomputed = await controller.computeOrderAddress(...params);
      await feeToken.mint(OWNER, FEE_AMOUNT);
      await feeToken.transfer(precomputed, FEE_AMOUNT);
      await paymentToken.mint(OWNER, PAYMENT_AMOUNT);
      await paymentToken.transfer(precomputed, PAYMENT_AMOUNT);
      inititalBalances = {
        feeToken: {
          controller: await feeToken.balanceOf(controller.address),
          shipper: await feeToken.balanceOf(SHIPPER),
          carrier: await feeToken.balanceOf(CARRIER),
        },
        paymentToken: {
          controller: await paymentToken.balanceOf(controller.address),
          shipper: await paymentToken.balanceOf(SHIPPER),
          carrier: await paymentToken.balanceOf(CARRIER),
        }
      };
      await controller.lock(precomputed);
    });

    it('should success', async () => {
      await controller.unlock(precomputed, { mantissa: PENALTY.toString() }, ...params);
    });

    it(`controller balance in fee token should increase on fee amount`, async () => {
      const balance = await feeToken.balanceOf(controller.address);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.controller.add(FEE_AMOUNT).toString());
    });

    it('shipper balance in fee token should not change', async () => {
      const balance = await feeToken.balanceOf(SHIPPER);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.shipper.toString());
    });

    it('carrier balance in fee token should not change', async () => {
      const balance = await feeToken.balanceOf(CARRIER);
      assert.strictEqual(balance.toString(), inititalBalances.feeToken.carrier.toString());
    });

    it(`controller balance in fee token should increase on payment amount mul controller fee`, async () => {
      const balance = await paymentToken.balanceOf(controller.address);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.controller.add(CONTROLLER_CHANGE_IN_PAYMENT_TOKEN).toString())
    });

    it(`shipper balance in payment token should increase on penalty`, async () => {
      const balance = await paymentToken.balanceOf(SHIPPER);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.shipper.add(SHIPPER_CHANGE_IN_PAYMENT_TOKEN).toString());
    });

    it(`carrier balance in payment token should increase on payment amount mul (one sub controller fee) sub penalty`, async () => {
      const balance = await paymentToken.balanceOf(CARRIER);
      assert.strictEqual(balance.toString(), inititalBalances.paymentToken.carrier.add(CARRIER_CHANGE_IN_PAYMENT_TOKEN).toString());
    });

  });

});
