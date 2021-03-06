/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import BN from "bn.js";
import Web3 from "web3";
import { PromiEvent, TransactionReceipt } from "web3-core/types";

import { Abi } from "./Controller.abi";
import { Controller as Web3Contract } from "./Controller.web3";
import { PayableTransactionObject, NonPayableTransactionObject } from "./types";

interface IParams {
  address: string;
  web3: Web3;
  sender?: string; // the address of sender, if undefined then web3.eth.defaultAccount used
  gasEstimationMultiplayer?: number; // if undefined then 1
}

const DEFAULT_GAS_ESTIMATION_MULTIPLAYER = 1.1; // + 10 %

export class Controller {
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

  async addOwners(
    newOwners: string[]
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.addOwners(newOwners);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async owners(): Promise<string[]> {
    return this.native.methods.owners().call();
  }

  async ownersCount(): Promise<string> {
    return this.native.methods.ownersCount().call();
  }

  async removeOwners(
    previousOwners: string[]
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.removeOwners(previousOwners);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async feeToken(): Promise<string> {
    return this.native.methods.feeToken().call();
  }

  async feeTokenBalance(): Promise<string> {
    return this.native.methods.feeTokenBalance().call();
  }

  async paymentToken(): Promise<string> {
    return this.native.methods.paymentToken().call();
  }

  async paymentTokenBalance(): Promise<string> {
    return this.native.methods.paymentTokenBalance().call();
  }

  async computeOrderAddress(
    salt: string | number[],
    id: number | string | BN,
    shipper: string,
    carrier: string,
    fee_: [number | string | BN]
  ): Promise<string> {
    return this.native.methods
      .computeOrderAddress(salt, id, shipper, carrier, fee_)
      .call();
  }

  async fee(): Promise<[string]> {
    return this.native.methods.fee().call();
  }

  async locked(order: string): Promise<boolean> {
    return this.native.methods.locked(order).call();
  }

  async shipperDistribution(order: string): Promise<[string]> {
    return this.native.methods.shipperDistribution(order).call();
  }

  async createOrder(
    salt: string | number[],
    id: number | string | BN,
    shipper: string,
    carrier: string,
    fee_: [number | string | BN]
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.createOrder(
      salt,
      id,
      shipper,
      carrier,
      fee_
    );
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async lock(order: string): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.lock(order);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async unlock(
    order: string,
    penalty: [number | string | BN],
    salt: string | number[],
    id: number | string | BN,
    shipper: string,
    carrier: string,
    fee_: [number | string | BN]
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.unlock(
      order,
      penalty,
      salt,
      id,
      shipper,
      carrier,
      fee_
    );
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async updateFee(
    fee_: [number | string | BN]
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.updateFee(fee_);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async withdrawFeeTokenFees(
    to: string,
    amount: number | string | BN
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.withdrawFeeTokenFees(to, amount);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }

  async withdrawPaymentTokenFees(
    to: string,
    amount: number | string | BN
  ): Promise<PromiEvent<TransactionReceipt>> {
    const method = this.native.methods.withdrawPaymentTokenFees(to, amount);
    return method.send({
      gas: await this.estimateGas(method),
      from: this.getSenderOrFail()
    });
  }
}
