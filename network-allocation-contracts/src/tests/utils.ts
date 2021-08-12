import {
  LockupContract,
  LockupInstance,
  MockedTokenContract,
  MockedTokenInstance,
} from "@contracts";
import { LOCKUP } from "config";
import BN from "bn.js";

let accounts: string[] = [];

export const setAccounts = (_accounts: string[]) => (accounts = _accounts);
export const getAccounts = () => accounts;

type ConstructorParams = {
  owner_: string;
  token_: string;
  lockupDuration_: string;
  unlockDuration_: string;
  unlockIntervalsCount_: string;
};

export type DefaultParameters = Parameters<LockupContract["new"]>;
export async function getDefaultConstructorParams(
  MockedToken: MockedTokenContract,
  override?: Partial<ConstructorParams>
): Promise<DefaultParameters> {
  const token_ = LOCKUP.TOKEN
    ? LOCKUP.TOKEN
    : await MockedToken.deployed().then((res) => res.address);

  return Object.values({
    owner_: accounts[0],
    token_: token_,
    lockupDuration_: "100",
    unlockDuration_: "200",
    unlockIntervalsCount_: "4",
    ...override,
  }) as DefaultParameters;
}

export async function makeDeposit(
  amount: string | number | BN,
  account: string,
  token: MockedTokenInstance,
  contract: LockupInstance
) {
  await token.mint(account, amount);
  await token.approve(contract.address, amount, { from: account });
  const id = await contract.getDepositsCount();
  await contract.deposit(amount, { from: account });
  return id;
}

export const WEEK = new BN("604800");
