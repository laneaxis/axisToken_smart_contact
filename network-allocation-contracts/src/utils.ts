import {
  Erc20Contract,
  Erc20Instance,
  MockedTokenContract,
} from "@contracts";
import { LOCKUP } from "config";

export async function getToken(
  ERC20: Erc20Contract,
  MockedToken: MockedTokenContract
): Promise<Erc20Instance> {
  if (LOCKUP.TOKEN) return ERC20.at(LOCKUP.TOKEN);
  return MockedToken.deployed();
}

export enum Network {
  DEVELOPMENT = "development",
  KOVAN = "kovan",
  MAINNET = "mainnet",
}
