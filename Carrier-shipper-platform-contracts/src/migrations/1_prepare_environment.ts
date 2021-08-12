import CONFIG from "config";
import { NETWORK } from "@utils";
import { migrationFactory } from "./migration";
import { deploy } from './deployer';

const MockedUSDC = artifacts.require("MockedUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

export = migrationFactory(async (_deployer, _network) => {
  if (!CONFIG.USDC_ADDRESS) await deploy(_deployer, MockedUSDC);
  if (!CONFIG.CONTROLLER.AXIS_ADDRESS) await deploy(_deployer, MockedAXIS);
}, { not: NETWORK.MAINNET });
