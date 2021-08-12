declare module "config" {
  export interface Lockup {
    readonly OWNER: string | null,
    readonly TOKEN: string | null,
    readonly LOCKUP_DURATION: number,
    readonly UNLOCK_DURATION: number,
    readonly UNLOCK_INTERVALS_COUNT: number
  }

  export const INFURA_KEY: string;
  export const PRIVATE_KEY: string;
  export const ETHERSCAN_KEY: string;
  export const MIGRATION_DIRECTORY: string;
  export const GAS_PRICE: number | string;
  export const LOCKUP: Lockup;
}