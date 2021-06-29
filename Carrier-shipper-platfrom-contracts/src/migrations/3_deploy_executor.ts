import BN from "bn.js";
import CONFIG from "config";
import { migrationFactory } from "migrations/migration";

const MockedExecutor = artifacts.require("MockedExecutor");
const sUSDC = artifacts.require("SUSDC");
const MockedUSDC = artifacts.require("MockedUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

export = migrationFactory(async (deployer, _, accounts) => {
    const AXIS = CONFIG.CONTROLLER.AXIS_ADDRESS || MockedAXIS.address;
    const USDC = CONFIG.USDC_ADDRESS || MockedUSDC.address;
    const owners = CONFIG.CONTROLLER.OWNERS || [accounts[0]];
    const sUSDCContract = await sUSDC.deployed();
    const LOAD_PRICE = new BN(10).pow(await sUSDCContract.decimals());
    await deployer.deploy(MockedExecutor,
        owners,
        AXIS,
        sUSDC.address,
        USDC,
        LOAD_PRICE,
        { gas: 11000000, gasPrice: 0 }
    );
});
