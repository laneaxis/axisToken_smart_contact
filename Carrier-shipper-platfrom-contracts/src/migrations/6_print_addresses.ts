import CONFIG from "config";
import { migrationFactory } from "migrations/migration";

const Controller = artifacts.require("Controller");
const Executor = artifacts.require("MockedExecutor");
const sUSDC = artifacts.require("SUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");
const MockedUSDC = artifacts.require("MockedUSDC");


export = migrationFactory(() => {
    const result = {
        AXIS: CONFIG.CONTROLLER.AXIS_ADDRESS || MockedAXIS.address,
        USDC: CONFIG.USDC_ADDRESS || MockedUSDC.address,
        SUSDC: sUSDC.address,
        EXECUTOR: Executor.address,
        CONTROLLER: Controller.address,
    };
    console.log(result);
});
