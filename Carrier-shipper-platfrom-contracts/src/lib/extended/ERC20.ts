import { Erc20 as BaseErc20 } from '../generated/ERC20';
import { Abi } from '../generated/IERC20.abi';
import BN from "bn.js";

const MAX_UINT = new BN(2).pow(new BN(256)).subn(1).toString();

export class Erc20 extends BaseErc20 {
  
  async isApproved(owner: string, spender: string): Promise<boolean> {
    const allowance = await this.allowance(owner, spender);
    return allowance !== '0';
  }
  
  // TODO: rm contractAddress use this address`
  async encodeApproveTx(spender: string, amount: string = MAX_UINT): Promise<string> {
    const txApprove = this.native.methods.approve(spender, amount);
    const options = {
      from: this.getSenderOrFail(),
      to: this.native.options.address,
      data: txApprove.encodeABI(),
      gasPrice: 0, // TODO: use await this.web3.eth.getGasPrice(), in production
      gasLimit: 0,
    };
    options.gasLimit = await this.web3.eth.estimateGas(options);
    const signedTx = await this.web3.eth.signTransaction(options, options.from);
    return signedTx.raw;
  }

  static getApproveAbi() {
    const abi = Abi.find(({ name }) => name === 'approve');
    if (!abi) {
      throw new Error('Not approve abi found');
    }
    return abi;
  }

  static getApproveParametersTypes() {
    const methodAbi = this.getApproveAbi();
    return methodAbi.inputs?.map(({ type }) => type) || [];
  }
  
}
