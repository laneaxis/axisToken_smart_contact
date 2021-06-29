import CONFIG from "config";
import { NETWORK } from "@utils";
import { migrationFactory } from "./migration";

const MockedUSDC = artifacts.require("MockedUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

export = migrationFactory(async (_deployer, _network) => {
  if (!CONFIG.USDC_ADDRESS) await _deployer.deploy(MockedUSDC, { gas: 11000000, gasPrice: 0 });
  if (!CONFIG.CONTROLLER.AXIS_ADDRESS) await _deployer.deploy(MockedAXIS, { gas: 11000000, gasPrice: 0 });
}, { not: NETWORK.MAINNET });
