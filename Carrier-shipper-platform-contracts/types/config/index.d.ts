declare module "config" {
  export const USDC_ADDRESS: string | null;
  export interface Controller {
    readonly AXIS_ADDRESS: string | null;
    readonly INITIAL_FEE: number | string;
    readonly OWNERS: string[] | null;
  }
  
  export const INFURA_KEY: string;
  export const PRIVATE_KEY: string;
  export const ETHERSCAN_KEY: string;
  export const BSCSCAN_KEY: string;
  export const MIGRATION_DIRECTORY: string;
  export const GAS_PRICE: number | string;
  export const CONTROLLER: Controller;
}
