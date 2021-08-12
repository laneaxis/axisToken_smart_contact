import { migrationFactory } from "migrations/migration";
import { deploy } from './deployer';

const SUSDC = artifacts.require("SUSDC");

export = migrationFactory(async (deployer) => {
  await deploy(deployer, SUSDC);
});
