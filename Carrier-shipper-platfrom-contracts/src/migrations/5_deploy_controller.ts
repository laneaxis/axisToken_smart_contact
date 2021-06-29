import { CONTROLLER } from "config";
import { ZERO_ADDRESS } from "solowei";
import { migrationFactory } from "migrations/migration";

const Controller = artifacts.require("Controller");
const sUSDC = artifacts.require("SUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

export = migrationFactory(async (deployer, _, accounts) => {
    const AXIS = CONTROLLER.AXIS_ADDRESS || MockedAXIS.address;
    const owners = CONTROLLER.OWNERS || [accounts[0]];
    await deployer.deploy(Controller,
        owners,
        AXIS,
        sUSDC.address,
        { mantissa: CONTROLLER.INITIAL_FEE },
        { gas: '11000000', gasPrice: 0 }
    );
});
