import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  paths: {
    sources: "./src",
    tests: "./test",
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.base.org",
        blockNumber: 19450000,
      },
    },
  },
  coverage: {
    solcoverjs: "./.solcover.js",
  },
};

export default config;