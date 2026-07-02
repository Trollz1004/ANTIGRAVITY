/**
 * deploy-ynai.js — Hardhat deployment script for the YNAI token suite
 * ─────────────────────────────────────────────────────────────────────
 * Run:  npx hardhat run scripts/deploy-ynai.js --network base
 * Test: npx hardhat run scripts/deploy-ynai.js --network baseSepolia
 *
 * PREREQUISITES (run once):
 *   npm install @openzeppelin/contracts-upgradeable
 *   npm install @openzeppelin/hardhat-upgrades
 *
 * SOURCE PATH: contracts in contracts/ynai/ are not in the default hardhat
 * sources path (./src). Before compiling, either:
 *   (a) Copy contracts/ynai/*.sol into contracts/src/ynai/  (recommended), OR
 *   (b) Update hardhat.config.js: paths.sources = './ynai'
 * Then run: npx hardhat compile
 *
 * ENV (.env file — NEVER commit to git):
 *   DEPLOYER_PRIVATE_KEY  — Joshua's wallet private key
 *   FOUNDER_WALLET        — Joshua's public wallet address (receives token mint)
 *   BASESCAN_API_KEY      — for contract verification on basescan.org
 *
 * DEPLOY ORDER:
 *   1. YNAIToken (UUPS proxy via ERC1967Proxy)
 *   2. YNAITimelock (24hr standard delay)
 *   3. YNAIGovernor (Governor + Timelock wired)
 *   4. YNAIVesting (51M Class A cliff-vest for founder)
 *   5. Wire roles on Timelock
 *   6. Transfer allocations: 51M → Vesting, 49M → Timelock treasury
 *   7. Renounce Timelock admin role
 *
 * NO PRIVATE KEYS OR SECRETS IN THIS FILE — all via process.env
 */

require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

// ─── Configuration ────────────────────────────────────────────────────────────

// TODO: Set FOUNDER_WALLET in your .env — Joshua's public wallet address
const FOUNDER_WALLET = process.env.FOUNDER_WALLET;
if (!FOUNDER_WALLET) {
  throw new Error(
    "FOUNDER_WALLET not set. Add FOUNDER_WALLET=<address> to your .env file.\n" +
    "This should be Joshua's wallet address — the deployer and token beneficiary."
  );
}

// Vesting parameters (seconds)
const CLIFF_SECONDS    = 365  * 24 * 60 * 60;  // 1 year  = 31,536,000 s
const TOTAL_VEST_SECS  = 1460 * 24 * 60 * 60;  // 4 years = 126,144,000 s

// Allocations (18-decimal YNAI)
const CLASS_A = ethers.parseUnits("51000000", 18);  // 51M — Founder/Vesting
const CLASS_B = ethers.parseUnits("49000000", 18);  // 49M — DAO treasury

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:      ", deployer.address);
  console.log("Founder wallet:", FOUNDER_WALLET);
  console.log("Network:       ", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:      ", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("─".repeat(60));


  // ── Step 1: Deploy YNAIToken (UUPS proxy) ─────────────────────────────────
  console.log("\n[1/7] Deploying YNAIToken (UUPS proxy)...");
  const YNAIToken = await ethers.getContractFactory("YNAIToken");
  const token = await upgrades.deployProxy(YNAIToken, [FOUNDER_WALLET], {
    kind: "uups",
    initializer: "initialize",
  });
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("  YNAIToken proxy:  ", tokenAddress);

  // ── Step 2: Deploy YNAITimelock (24hr standard delay) ─────────────────────
  console.log("\n[2/7] Deploying YNAITimelock (24hr)...");
  const YNAITimelock = await ethers.getContractFactory("YNAITimelock");
  // Bootstrap: pass empty arrays — grant PROPOSER/CANCELLER to governor in step 5
  // Admin = deployer during bootstrap; renounced in step 7
  const timelock = await YNAITimelock.deploy(
    [],                 // proposers: none yet
    [ethers.ZeroAddress], // executors: address(0) = anyone may execute after delay
    deployer.address    // admin: deployer (Joshua), renounced after wiring
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("  YNAITimelock:     ", timelockAddress);

  // ── Step 3: Deploy YNAIGovernor ────────────────────────────────────────────
  console.log("\n[3/7] Deploying YNAIGovernor...");
  const YNAIGovernor = await ethers.getContractFactory("YNAIGovernor");
  const governor = await YNAIGovernor.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("  YNAIGovernor:     ", governorAddress);

  // ── Step 4: Deploy YNAIVesting (51M Class A founder tokens) ───────────────
  console.log("\n[4/7] Deploying YNAIVesting...");
  const deployTime = BigInt(Math.floor(Date.now() / 1000));
  const YNAIVesting = await ethers.getContractFactory("YNAIVesting");
  const vesting = await YNAIVesting.deploy(
    tokenAddress,
    FOUNDER_WALLET,   // beneficiary — TODO: confirm Joshua's wallet
    deployTime,       // startTime = now
    BigInt(CLIFF_SECONDS),
    BigInt(TOTAL_VEST_SECS),
    FOUNDER_WALLET    // owner (can revoke) — TODO: confirm Joshua's wallet
  );
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("  YNAIVesting:      ", vestingAddress);
  console.log("  Cliff unlocks:    ", new Date((Number(deployTime) + CLIFF_SECONDS) * 1000).toISOString());
  console.log("  Fully vested:     ", new Date((Number(deployTime) + TOTAL_VEST_SECS) * 1000).toISOString());


  // ── Step 5: Wire Timelock roles ────────────────────────────────────────────
  console.log("\n[5/7] Wiring Timelock roles...");
  const PROPOSER_ROLE  = await timelock.PROPOSER_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  let tx = await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await tx.wait();
  console.log("  PROPOSER_ROLE  → governor:", governorAddress);

  tx = await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  await tx.wait();
  console.log("  CANCELLER_ROLE → governor:", governorAddress);

  // ── Step 6: Transfer token allocations ────────────────────────────────────
  console.log("\n[6/7] Transferring token allocations from deployer...");
  // Deployer received 100M YNAI in initialize(); now split per doctrine

  // Class A: 51M → YNAIVesting
  tx = await token.connect(deployer).transfer(vestingAddress, CLASS_A);
  await tx.wait();
  console.log("  51,000,000 YNAI → YNAIVesting (Class A, founder)");

  // Call fund() on the vesting contract to lock in the allocation
  tx = await vesting.fund();
  await tx.wait();
  console.log("  YNAIVesting.fund() called — allocation locked");

  // Class B: 49M → YNAITimelock (DAO treasury will be the Timelock)
  tx = await token.connect(deployer).transfer(timelockAddress, CLASS_B);
  await tx.wait();
  console.log("  49,000,000 YNAI → YNAITimelock (Class B, DAO treasury)");

  // ── Step 7: Renounce Timelock admin role ──────────────────────────────────
  console.log("\n[7/7] Renouncing Timelock DEFAULT_ADMIN_ROLE...");
  const DEFAULT_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();
  tx = await timelock.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await tx.wait();
  console.log("  Admin role renounced — timelock is now fully decentralized");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("YNAI DEPLOYMENT COMPLETE — Base L2 (Chain ID 8453)");
  console.log("═".repeat(60));
  console.log("YNAIToken  (proxy):  ", tokenAddress);
  console.log("YNAITimelock:        ", timelockAddress);
  console.log("YNAIGovernor:        ", governorAddress);
  console.log("YNAIVesting:         ", vestingAddress);
  console.log("─".repeat(60));
  console.log("NEXT STEPS:");
  console.log("  1. Verify contracts on Basescan:");
  console.log("     npx hardhat verify --network base", tokenAddress);
  console.log("     npx hardhat verify --network base", timelockAddress);
  console.log("     npx hardhat verify --network base", governorAddress);
  console.log("     npx hardhat verify --network base", vestingAddress);
  console.log("  2. Transfer YNAIToken proxy ownership to YNAITimelock");
  console.log("     so future upgrades require a governance vote.");
  console.log("  3. Delegate founder votes: token.delegate(FOUNDER_WALLET)");
  console.log("  4. Deploy YNAITreasuryTimelock (72hr) for treasury proposals");
  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
