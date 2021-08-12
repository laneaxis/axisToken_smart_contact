import config from "config";
import { inspect } from "util";
import { Network } from "@utils";

const MockedStakingToken = artifacts.require("MockedStakingToken");

export = async function (_deployer, _network: Network) {
  console.log(inspect(config, false, null, true));
  if ([Network.MAINNET].includes(_network)) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 3e3));
    return;
  }
  if (!config.STAKING.STAKING_TOKEN) await _deployer.deploy(MockedStakingToken);
} as Migration;
