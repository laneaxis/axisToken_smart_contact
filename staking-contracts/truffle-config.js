const HDWalletProvider = require("@truffle/hdwallet-provider");
const { INFURA_KEY, PRIVATE_KEY, ETHERSCAN_KEY, MIGRATION_DIRECTORY, GAS_PRICE } = require("config");

const gasPrice = GAS_PRICE * 10 ** 9;

module.exports = {
  migrations_directory: MIGRATION_DIRECTORY,
  networks: {
    development: { host: "127.0.0.1", network_id: "*", port: 8545, confirmations: 0, skipDryRun: true, gasPrice },
    kovan: {
      provider: () => new HDWalletProvider(PRIVATE_KEY, `wss://kovan.infura.io/ws/v3/${INFURA_KEY}`),
      network_id: 42,
      confirmations: 1,
      skipDryRun: true,
      gasPrice,
    },
    mainnet: {
      provider: () => new HDWalletProvider(PRIVATE_KEY, `wss://mainnet.infura.io/ws/v3/${INFURA_KEY}`),
      network_id: 1,
      confirmations: 3,
      skipDryRun: true,
      gasPrice,
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      docker: false,
      settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "constantinople" },
    },
  },
  plugins: ["solidity-coverage", "truffle-plugin-verify"],
  api_keys: { etherscan: ETHERSCAN_KEY },
  mocha: { reporter: 'eth-gas-reporter', reporterOptions: { currency: "USD" } },
};
