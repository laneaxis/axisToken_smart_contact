import CONFIG from "config";
import { migrationFactory } from "migrations/migration";
import { deploy } from "./deployer";

const MockedExecutor = artifacts.require("MockedExecutor");
const sUSDC = artifacts.require("SUSDC");
const MockedUSDC = artifacts.require("MockedUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

export = migrationFactory(async (deployer, _, accounts) => {
    const AXIS = CONFIG.CONTROLLER.AXIS_ADDRESS || MockedAXIS.address;
    const USDC = CONFIG.USDC_ADDRESS || MockedUSDC.address;
    const owners = CONFIG.CONTROLLER.OWNERS || [accounts[0]];
    await deploy(deployer, MockedExecutor,
        owners,
        AXIS,
        sUSDC.address,
        USDC,
    );
});
