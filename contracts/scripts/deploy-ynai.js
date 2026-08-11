/**
 * deploy-ynai.js — YouAndINot AI DAO deployment (Base L2 / Base Sepolia)
 * ---------------------------------------------------------------------
 * Order: Token (UUPS proxy) → Timelock → Governor → Vesting → wire roles
 *        → transfer allocations → renounce admin.
 *
 * PREREQUISITES (not yet installed in contracts/):
 *   npm install @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades
 *   + add require("@openzeppelin/hardhat-upgrades") to hardhat.config.js
 *   + copy contracts/ynai/*.sol into contracts/src/ynai/ (hardhat sources = ./src)
 *
 * ENV (from Personal Vault .env — NEVER in this file, NEVER in git):
 *   DEPLOYER_PRIVATE_KEY — already wired in hardhat.config.js networks
 *   FOUNDER_WALLET       — Joshua's wallet; vesting beneficiary
 *
 * Run:  npx hardhat run scripts/deploy-ynai.js --network baseSepolia
 *       npx hardhat run scripts/deploy-ynai.js --network base
 *
 * POST-DEPLOY (manual, per DAO-FORMATION pkg):
 *   1. File WY SOS amendment with proxy address (30-day deadline from Articles).
 *   2. token.delegate(FOUNDER_WALLET) — activate founder voting power.
 *   3. Transfer token proxy ownership to Timelock (upgrades → governance vote).
 *   4. Deploy second YNAITimelock with 72h delay for treasury lane (optional).
 */
const { ethers, upgrades } = require("hardhat");

// Vesting schedule (see STAKING-DOCTRINE-YNAI-2026-08-11.md — cliff decision
// PENDING under sell-aggressive pivot; adjust here before mainnet deploy):
const CLIFF_SECONDS = 365 * 24 * 60 * 60; // 1 year
const TOTAL_SECONDS = 1460 * 24 * 60 * 60; // 4 years

async function main() {
  // ---- Hard gate: founder wallet must come from .env ----
  const FOUNDER_WALLET = process.env.FOUNDER_WALLET;
  if (!FOUNDER_WALLET || !ethers.isAddress(FOUNDER_WALLET)) {
    throw new Error(
      "FOUNDER_WALLET missing/invalid. Set it in .env (Personal Vault). Aborting."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Founder :", FOUNDER_WALLET);

  // ---- 1. YNAIToken (UUPS proxy) — mints 100M to deployer ----
  const Token = await ethers.getContractFactory("YNAIToken");
  const token = await upgrades.deployProxy(Token, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("YNAIToken proxy:", tokenAddr);

  // ---- 2. YNAITimelock — no proposers yet, open executors, deployer admin ----
  const Timelock = await ethers.getContractFactory("YNAITimelock");
  const timelock = await Timelock.deploy(
    [], // proposers — governor granted below
    [ethers.ZeroAddress], // executors — anyone may execute ready ops
    deployer.address // temp admin for wiring; renounced at the end
  );
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();
  console.log("YNAITimelock:", timelockAddr);

  // ---- 3. YNAIGovernor ----
  const Governor = await ethers.getContractFactory("YNAIGovernor");
  const governor = await Governor.deploy(tokenAddr, timelockAddr);
  await governor.waitForDeployment();
  const governorAddr = await governor.getAddress();
  console.log("YNAIGovernor:", governorAddr);

  // ---- 4. YNAIVesting — 51M Class A for founder ----
  const now = Math.floor(Date.now() / 1000);
  const Vesting = await ethers.getContractFactory("YNAIVesting");
  const vesting = await Vesting.deploy(
    tokenAddr,
    FOUNDER_WALLET, // beneficiary
    now, // startTime
    CLIFF_SECONDS,
    TOTAL_SECONDS,
    deployer.address // owner (revocation authority; move to timelock later)
  );
  await vesting.waitForDeployment();
  const vestingAddr = await vesting.getAddress();
  console.log("YNAIVesting:", vestingAddr);

  // ---- 5. Wire timelock roles to governor ----
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
  const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();
  await (await timelock.grantRole(PROPOSER_ROLE, governorAddr)).wait();
  await (await timelock.grantRole(CANCELLER_ROLE, governorAddr)).wait();
  console.log("Timelock roles granted to governor");

  // ---- 6. Allocations: 51M → vesting (then fund), 49M → timelock treasury ----
  const CLASS_A = ethers.parseEther("51000000");
  const CLASS_B = ethers.parseEther("49000000");
  await (await token.transfer(vestingAddr, CLASS_A)).wait();
  await (await vesting.fund()).wait();
  console.log("51M YNAI locked in vesting (funded)");
  await (await token.transfer(timelockAddr, CLASS_B)).wait();
  console.log("49M YNAI in timelock treasury");

  // ---- 7. Renounce timelock admin — governance is now in control ----
  await (await timelock.renounceRole(ADMIN_ROLE, deployer.address)).wait();
  console.log("Timelock admin renounced");

  console.log("\n=== DEPLOY COMPLETE ===");
  console.log(JSON.stringify({ tokenAddr, timelockAddr, governorAddr, vestingAddr }, null, 2));
  console.log("REMINDER: WY SOS amendment (30-day clock), delegate votes, move token ownership to timelock.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
