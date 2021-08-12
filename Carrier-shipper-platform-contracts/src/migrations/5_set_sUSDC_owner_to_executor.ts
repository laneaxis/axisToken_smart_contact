import { CONTROLLER } from "config";
import { migrationFactory } from "migrations/migration";

const MockedExecutor = artifacts.require("MockedExecutor");
const SUSDC = artifacts.require("SUSDC");

export = migrationFactory(async () => {
   const sUSDC = await SUSDC.deployed()
   const response = await sUSDC.transferOwnership(MockedExecutor.address, { gas: '11000000' });
   console.log(response);
});
