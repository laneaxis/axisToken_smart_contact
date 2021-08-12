import { MockedStakingTokenContract } from "@contracts";
import { STAKING } from "config";

let accounts: string[] = [];

export const setAccounts = (_accounts: string[]) => (accounts = _accounts);
export const getAccounts = () => accounts;

export function toHex(buffer: Buffer) {
  return `0x${buffer.toString("hex")}`;
}

type ConstructorParams = {
  owner_: string;
  stakingToken_: string;
  revenue_: string;
  intervalsCount_: string;
  intervalDuration: string;
  size_: string;
};

export async function getDefaultConstructorParams(
  MockedStakingToken: MockedStakingTokenContract,
  monthly?: boolean,
  override?: Partial<ConstructorParams>
): Promise<string[]> {
  const stakingToken_ = STAKING.STAKING_TOKEN
    ? STAKING.STAKING_TOKEN
    : await MockedStakingToken.deployed().then((res) => res.address);

  let obj: Object;
  if (monthly) {
    obj = {
      owner_: accounts[0],
      stakingToken_: stakingToken_,
      revenue_: "15",
      intervalDuration: "100",
      ...override
    }
  } else {
    obj = {
      owner_: accounts[0],
      stakingToken_: stakingToken_,
      revenue_: "15",
      intervalsCount_: "5",
      intervalDuration: "100",
      size_: "1000000000000000000000000000",
      ...override,
    };
  }
  return Object.values(obj);
}
