import {
  Erc20Contract,
  Erc20Instance,
  MockedStakingTokenContract,
} from "@contracts";
import { STAKING } from "config";

export async function getTokenStaking(
  ERC20: Erc20Contract,
  MockedStakingToken: MockedStakingTokenContract
): Promise<Erc20Instance> {
  if (STAKING.STAKING_TOKEN) return ERC20.at(STAKING.STAKING_TOKEN);
  return MockedStakingToken.deployed();
}

export enum Network {
  DEVELOPMENT = "development",
  KOVAN = "kovan",
  MAINNET = "mainnet",
}
