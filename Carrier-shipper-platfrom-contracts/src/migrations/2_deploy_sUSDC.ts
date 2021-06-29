import { migrationFactory } from "migrations/migration";

const SUSDC = artifacts.require("SUSDC");

export = migrationFactory(async (deployer) => {
    await deployer.deploy(SUSDC, { gas: 11000000, gasPrice: 0 });
});
