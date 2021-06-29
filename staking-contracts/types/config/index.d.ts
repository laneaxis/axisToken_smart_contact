declare module "config" {
  export interface Staking {
    readonly OWNER: string | null,
    readonly STAKING_TOKEN: string | null,
    readonly REVENUE: number,
    readonly INTERVALS_COUNT: number,
    readonly INTERVAL_DURATION: number
    readonly SIZE: number | string;
  }

  export const INFURA_KEY: string;
  export const PRIVATE_KEY: string;
  export const ETHERSCAN_KEY: string;
  export const MIGRATION_DIRECTORY: string;
  export const GAS_PRICE: number | string;
  export const STAKING: Staking;
}
