import { applyDecimals } from "@utils";
import BN from "bn.js";

const MockedExecutor = artifacts.require("MockedExecutor");
const MockedUSDC = artifacts.require("MockedUSDC");
const MockedAXIS = artifacts.require("MockedAXIS");

async function main() {
  const USDC = await MockedUSDC.deployed();
  const AXIS = await MockedAXIS.deployed();
  const executor = await MockedExecutor.deployed();

  const amount = new BN(1e5);
  console.log('balance before', {
    AXIS: await AXIS.balanceOf(executor.address).then(v => v.toString()),
    USDC: await USDC.balanceOf(executor.address).then(v => v.toString()),
  });

  console.log('minting usdc...')
  await USDC.mint(executor.address, applyDecimals(amount, await USDC.decimals()), { gas: 8000000 });
  console.log('minting axis...')
  await AXIS.mint(executor.address, applyDecimals(amount, await AXIS.decimals()), { gas: 8000000 });

  console.log('balance after', {
    AXIS: await AXIS.balanceOf(executor.address).then(v => v.toString()),
    USDC: await USDC.balanceOf(executor.address).then(v => v.toString()),
  });
}

export = async () => {
  try {
    await main()
    process.exit(0);
  } catch (e) {
    console.error('FAILED');
    console.error(e)
    process.exit(1);
  }
};
