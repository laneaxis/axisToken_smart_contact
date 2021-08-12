import BN from "bn.js";

import { Executor as Base } from '../generated/Executor';
import { Executor as BaseWeb3 } from '../generated/Executor.web3';
import { PayableTransactionObject, NonPayableTransactionObject } from '../generated/types';

export class Executor extends Base {
  
  protected async estimateGas<
    K,
    T extends PayableTransactionObject<K> | NonPayableTransactionObject<K>
  >(method: T) {
    const originalEstimation = await method.estimateGas({
      data: method.encodeABI(),
      to: this.native.options.address,
      from: this.sender,
    });
    return new BN(originalEstimation)
      .muln(this.gasEstimationMultiplayer)
      .toString();
  }

  async viewPriceIn(tokenIn: string, tokenOut: string, amountIn: string | BN | number): Promise<string> {
    const [fee, sqrtPriceLimitX96] = await Promise.all([
      this.swapFee(),
      this.swapSqrtPriceLimitX96(),
    ]);
    return this.native.methods.priceInput(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96).call();
  }

  async viewPriceOut(tokenIn: string, tokenOut: string, amountOut: string | BN | number): Promise<string> {
    const [fee, sqrtPriceLimitX96] = await Promise.all([
      this.swapFee(),
      this.swapSqrtPriceLimitX96(),
    ]);
    return this.native.methods.priceOutput(tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96).call();
  }

}
