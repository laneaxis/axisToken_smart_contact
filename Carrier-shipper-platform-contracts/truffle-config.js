const HDWalletProvider = require("@truffle/hdwallet-provider");
const { PRIVATE_KEY, ETHERSCAN_KEY, BSCSCAN_KEY, MIGRATION_DIRECTORY, GAS_PRICE } = require("config");
const gprice = GAS_PRICE * 10 ** 9; // why?

module.exports = {
  migrations_directory: MIGRATION_DIRECTORY,
  contracts_directory: "./contracts",
  contracts_build_directory: "./output/artifacts",
  networks: {
    kovan: {
      provider: () => new HDWalletProvider(PRIVATE_KEY, 'https://kovan.optimism.io'),
      network_id: 69,
      chain_id: 69,
      confirmations: 0,
      gasPrice: 15000000,
    },
  },
  compilers: {
    solc: {
      version: "node_modules/@eth-optimism/solc",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        },
      }
    }
  },
  plugins: ["solidity-coverage", "truffle-plugin-verify", "truffle-contract-size"],
  api_keys: { etherscan: ETHERSCAN_KEY, bscscan: BSCSCAN_KEY },
  mocha: { reporter: 'eth-gas-reporter', reporterOptions: { currency: "USD" } },
};

