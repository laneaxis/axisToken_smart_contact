import BN from "bn.js";

export enum NETWORK {
  DEVELOPMENT = "development",
  MAINNET = "ethereum_mainnet",
  KOVAN = "ethereum_kovan",
}

export function applyDecimals(value: string | BN | number, decimals: string | BN | number) {
  return new BN(value).mul(new BN(10).pow(new BN(decimals))).toString();
}
