import CONFIG from "config";
import { migrationFactory } from "migrations/migration";

const Controller = artifacts.require("Controller");
const Executor = artifacts.require("MockedExecutor");
const sUSDC = artifacts.require("SUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");
const MockedUSDC = artifacts.require("MockedUSDC");


export = migrationFactory(() => {
    const result = {
        L2AXIS: CONFIG.CONTROLLER.AXIS_ADDRESS || MockedAXIS.address,
        L2USDC: CONFIG.USDC_ADDRESS || MockedUSDC.address,
        L2SUSDC: sUSDC.address,
        L2EXECUTOR: Executor.address,
        L2CONTROLLER: Controller.address,
    };
    console.log(result)
    console.log(JSON.stringify(result));
});
