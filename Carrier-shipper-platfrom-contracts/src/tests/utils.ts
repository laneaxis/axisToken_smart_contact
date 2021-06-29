import BN from 'bn.js';
import { ONE_ATTO_MANTISSA } from "solowei";

export const BN_ONE_ATTO_MANTISSA = new BN(ONE_ATTO_MANTISSA);

let accounts: string[] = [];
export const setAccounts = (_accounts: string[]) => accounts = _accounts;
export const getAccounts = () => accounts;

export const randomAccount = () => `0x${
  Buffer.from(new Array(20).fill(0).map(() => Math.floor(Math.random() * 256))).toString("hex")
}`;

const MockedFeeToken = artifacts.require('MockedAXIS');
export const getFeeToken = () => {
  return MockedFeeToken.deployed().catch(() => MockedFeeToken.new());
}

const MockedPaymentToken = artifacts.require('SUSDC');
export const getPaymentToken = () => {
  return MockedPaymentToken.deployed().catch(() => MockedPaymentToken.new());
}

export function deepLowercaseEqual(a: string[], b: string[]): void {
  assert.deepStrictEqual(a.map((o) => o.toLowerCase()), b.map((o) => o.toLowerCase()));
}

export function lowercaseEqual<T extends { toString(): string } = string>(a: T, b: T): void {
  assert.strictEqual(a.toString().toLowerCase(), b.toString().toLowerCase());
}
