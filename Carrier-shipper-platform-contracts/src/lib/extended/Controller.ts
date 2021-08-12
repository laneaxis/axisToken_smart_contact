import BN from "bn.js";

import { Controller as Base } from '../generated/Controller';
import { PayableTransactionObject, NonPayableTransactionObject } from '../generated/types';

export class Controller extends Base {
  
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

}
