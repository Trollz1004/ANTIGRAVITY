// .solcover.js — solidity-coverage configuration
//
// The 90% CI gate is scoped to the live 10% floor splitter contract that backs
// the current date-app / DAO-sale revenue flow. Deprecated, doctrine-retired,
// governance placeholder, and test-helper contracts stay compile-tested but are
// intentionally excluded from this active-splitter coverage gate.
module.exports = {
  skipFiles: [
    "CharityRouter100.sol",
    "DAOTreasury.sol",
    "DatingRevenueRouter.sol",
    "DeadManSwitch.sol",
    "GospelDonation.sol",
    "MissionTreasury.sol",
    "PlatformSplitter.sol",
    "SoulboundToken.sol",
    "governance/",
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