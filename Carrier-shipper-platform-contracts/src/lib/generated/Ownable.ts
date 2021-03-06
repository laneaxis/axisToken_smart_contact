/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import BN from "bn.js";
import Web3 from "web3";
import { PromiEvent, TransactionReceipt } from "web3-core/types";

import { Abi } from "./Ownable.abi";
import { Ownable as Web3Contract } from "./Ownable.web3";
import { PayableTransactionObject, NonPayableTransactionObject } from "./types";

interface IParams {
  address: string;
  web3: Web3;
  sender?: string; // the address of sender, if undefined then web3.eth.defaultAccount used
  gasEstimationMultiplayer?: number; // if undefined then 1
}

const DEFAULT_GAS_ESTIMATION_MULTIPLAYER = 1.1; // + 10 %

export class Ownable {
  native: Web3Contract;
  gasEstimationMultiplayer: number;
  web3: Web3;
  _sender: string | undefined;

  get sender(): string | undefined {
    if (this._sender) return this._sender;
    if (this.web3.defaultAccount) return this.web3.defaultAccount;
    return undefined;
  }

  protected getSenderOrFail(): string {
    const sender = this.sender;
    if (!sender) {
      throw new Error("Sender is required");
    }
    return sender;
  }

  constructor({ address, web3, sender, gasEstimationMultiplayer }: IParams) {
    this._sender = sender;
    this.native = new web3.eth.Contract(Abi, address) as any;
    this.gasEstimationMultiplayer =
      gasEstimationMultiplayer ?? DEFAULT_GAS_ESTIMATION_MULTIPLAYER;
    this.web3 = web3;
  }

  protected async estimateGas<
    K,
    T extends PayableTransactionObject<K> | NonPayableTransactionObject<K>
  >(method: T, args?: Parameters<T["estimateGas"]>) {
    const originalEstimation = await method.estimateGas(...(args ?? []));
    return new BN(originalEstimation)
      .muln(this.gasEstimationMultiplayer)
      .toString();
  }

  async owner(): Promise<string> {
    return this.native.methods.owner().call();
  }

  async renounceOwnership(): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.renounceOwnership();
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async transferOwnership(
    newOwner: string
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.transferOwnership(newOwner);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }
}
