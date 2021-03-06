/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import BN from "bn.js";
import { ContractOptions } from "web3-eth-contract";
import { EventLog } from "web3-core";
import { EventEmitter } from "events";
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract
} from "./types";

interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type FeeUpdated = ContractEventLog<{
  fee: [string];
  0: [string];
}>;
export type FeeWithdrawed = ContractEventLog<{
  token: string;
  owner: string;
  to: string;
  amount: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;
export type OrderCreated = ContractEventLog<{
  id: string;
  shipper: string;
  carrier: string;
  order: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;
export type OrderLocked = ContractEventLog<{
  order: string;
  0: string;
}>;
export type OrderUnlocked = ContractEventLog<{
  order: string;
  penalty: [string];
  0: string;
  1: [string];
}>;
export type OwnerAdded = ContractEventLog<{
  newOwner: string;
  0: string;
}>;
export type OwnerRemoved = ContractEventLog<{
  previousOwner: string;
  0: string;
}>;

export interface Controller extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): Controller;
  clone(): Controller;
  methods: {
    addOwners(newOwners: string[]): NonPayableTransactionObject<boolean>;

    owners(): NonPayableTransactionObject<string[]>;

    ownersCount(): NonPayableTransactionObject<string>;

    removeOwners(
      previousOwners: string[]
    ): NonPayableTransactionObject<boolean>;

    feeToken(): NonPayableTransactionObject<string>;

    feeTokenBalance(): NonPayableTransactionObject<string>;

    paymentToken(): NonPayableTransactionObject<string>;

    paymentTokenBalance(): NonPayableTransactionObject<string>;

    computeOrderAddress(
      salt: string | number[],
      id: number | string | BN,
      shipper: string,
      carrier: string,
      fee_: [number | string | BN]
    ): NonPayableTransactionObject<string>;

    fee(): NonPayableTransactionObject<[string]>;

    locked(order: string): NonPayableTransactionObject<boolean>;

    shipperDistribution(order: string): NonPayableTransactionObject<[string]>;

    createOrder(
      salt: string | number[],
      id: number | string | BN,
      shipper: string,
      carrier: string,
      fee_: [number | string | BN]
    ): NonPayableTransactionObject<string>;

    lock(order: string): NonPayableTransactionObject<boolean>;

    unlock(
      order: string,
      penalty: [number | string | BN],
      salt: string | number[],
      id: number | string | BN,
      shipper: string,
      carrier: string,
      fee_: [number | string | BN]
    ): NonPayableTransactionObject<string>;

    updateFee(
      fee_: [number | string | BN]
    ): NonPayableTransactionObject<boolean>;

    withdrawFeeTokenFees(
      to: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    withdrawPaymentTokenFees(
      to: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    FeeUpdated(cb?: Callback<FeeUpdated>): EventEmitter;
    FeeUpdated(options?: EventOptions, cb?: Callback<FeeUpdated>): EventEmitter;

    FeeWithdrawed(cb?: Callback<FeeWithdrawed>): EventEmitter;
    FeeWithdrawed(
      options?: EventOptions,
      cb?: Callback<FeeWithdrawed>
    ): EventEmitter;

    OrderCreated(cb?: Callback<OrderCreated>): EventEmitter;
    OrderCreated(
      options?: EventOptions,
      cb?: Callback<OrderCreated>
    ): EventEmitter;

    OrderLocked(cb?: Callback<OrderLocked>): EventEmitter;
    OrderLocked(
      options?: EventOptions,
      cb?: Callback<OrderLocked>
    ): EventEmitter;

    OrderUnlocked(cb?: Callback<OrderUnlocked>): EventEmitter;
    OrderUnlocked(
      options?: EventOptions,
      cb?: Callback<OrderUnlocked>
    ): EventEmitter;

    OwnerAdded(cb?: Callback<OwnerAdded>): EventEmitter;
    OwnerAdded(options?: EventOptions, cb?: Callback<OwnerAdded>): EventEmitter;

    OwnerRemoved(cb?: Callback<OwnerRemoved>): EventEmitter;
    OwnerRemoved(
      options?: EventOptions,
      cb?: Callback<OwnerRemoved>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "FeeUpdated", cb: Callback<FeeUpdated>): void;
  once(
    event: "FeeUpdated",
    options: EventOptions,
    cb: Callback<FeeUpdated>
  ): void;

  once(event: "FeeWithdrawed", cb: Callback<FeeWithdrawed>): void;
  once(
    event: "FeeWithdrawed",
    options: EventOptions,
    cb: Callback<FeeWithdrawed>
  ): void;

  once(event: "OrderCreated", cb: Callback<OrderCreated>): void;
  once(
    event: "OrderCreated",
    options: EventOptions,
    cb: Callback<OrderCreated>
  ): void;

  once(event: "OrderLocked", cb: Callback<OrderLocked>): void;
  once(
    event: "OrderLocked",
    options: EventOptions,
    cb: Callback<OrderLocked>
  ): void;

  once(event: "OrderUnlocked", cb: Callback<OrderUnlocked>): void;
  once(
    event: "OrderUnlocked",
    options: EventOptions,
    cb: Callback<OrderUnlocked>
  ): void;

  once(event: "OwnerAdded", cb: Callback<OwnerAdded>): void;
  once(
    event: "OwnerAdded",
    options: EventOptions,
    cb: Callback<OwnerAdded>
  ): void;

  once(event: "OwnerRemoved", cb: Callback<OwnerRemoved>): void;
  once(
    event: "OwnerRemoved",
    options: EventOptions,
    cb: Callback<OwnerRemoved>
  ): void;
}
