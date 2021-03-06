/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import BN from "bn.js";
import Web3 from "web3";
import { PromiEvent, TransactionReceipt } from "web3-core/types";

import { Abi } from "./IERC20.abi";
import { Ierc20 as Web3Contract } from "./IERC20.web3";
import { PayableTransactionObject, NonPayableTransactionObject } from "./types";

interface IParams {
  address: string;
  web3: Web3;
  sender?: string; // the address of sender, if undefined then web3.eth.defaultAccount used
  gasEstimationMultiplayer?: number; // if undefined then 1
}

const DEFAULT_GAS_ESTIMATION_MULTIPLAYER = 1.1; // + 10 %

export class Ierc20 {
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

  async totalSupply(): Promise<string> {
    return this.native.methods.totalSupply().call();
  }

  async balanceOf(account: string): Promise<string> {
    return this.native.methods.balanceOf(account).call();
  }

  async transfer(
    recipient: string,
    amount: number | string | BN
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.transfer(recipient, amount);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async allowance(owner: string, spender: string): Promise<string> {
    return this.native.methods.allowance(owner, spender).call();
  }

  async approve(
    spender: string,
    amount: number | string | BN
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.approve(spender, amount);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async transferFrom(
    sender: string,
    recipient: string,
    amount: number | string | BN
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.transferFrom(sender, recipient, amount);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }
}
