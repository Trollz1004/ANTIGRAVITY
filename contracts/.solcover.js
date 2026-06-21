// .solcover.js — solidity-coverage configuration
module.exports = {
  skipFiles: [
    "mocks/",
    "test/",
    "Script.sol",
    "Deploy.s.sol",
  ],
  providerOptions: {
    allowUnlimitedContractSize: true,
    gasLimit: 0xfffffffffff,
    blockGasLimit: 0xfffffffffff,
  },
  istanbulReporter: ["json-summary", "lcov", "text"],
  cleanupBeforeCoverage: true,
};