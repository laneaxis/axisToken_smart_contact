import { LOCKUP } from "config";
import { Network } from "@utils";
import { getToken } from "@utils";

const ERC20 = artifacts.require("ERC20");
const MockedToken = artifacts.require("MockedToken");
const Lockup = artifacts.require("Lockup");

export = async function (_deployer, _network: Network, [account]) {
  const token = await getToken(ERC20, MockedToken);
  const owner = LOCKUP.OWNER || account;

  await _deployer.deploy(
    Lockup,
    owner,
    token.address,
    LOCKUP.LOCKUP_DURATION,
    LOCKUP.UNLOCK_DURATION,
    LOCKUP.UNLOCK_INTERVALS_COUNT
  );
} as Migration;
