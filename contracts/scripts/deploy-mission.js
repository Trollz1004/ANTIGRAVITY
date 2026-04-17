/**
 * deploy-mission.js
 * Deploys the complete ANTIGRAVITY mission DAO stack to Base L2.
 *
 * Deployment order:
 *   1. MissionTreasury (temporary DMS placeholder)
 *   2. DeadManSwitch (points to MissionTreasury)
 *   3. PlatformSplitter10 (one per bucket — Buckets 1, 2, 4, 6, 8)
 *   4. Governance tokens (YANAI, AISO, RECYCLE)
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY  — deployer wallet private key
 *   FOUNDER_WALLET        — Josh's operating wallet (receives 90%)
 *   GNOSIS_SAFE_ADDRESS   — deployed Gnosis Safe 3-of-5 address
 *   BASESCAN_API_KEY      — for contract verification
 *
 * Run: npx hardhat run scripts/deploy-mission.js --network baseSepolia
 * Then: npx hardhat run scripts/deploy-mission.js --network base  (mainnet)
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n=== ANTIGRAVITY MISSION DAO DEPLOYMENT ===");
  console.log("Deployer:    ", deployer.address);
  console.log("Network:     ", hre.network.name);
  console.log("Chain ID:    ", (await hre.ethers.provider.getNetwork()).chainId);

  const FOUNDER_WALLET  = process.env.FOUNDER_WALLET  || deployer.address;
  const GNOSIS_SAFE     = process.env.GNOSIS_SAFE_ADDRESS;
  const OPERATING_WALLET = FOUNDER_WALLET; // Josh's LLC wallet receives the 90%

  if (!GNOSIS_SAFE) {
    throw new Error(
      "GNOSIS_SAFE_ADDRESS is required. Deploy Gnosis Safe 3-of-5 first.\n" +
      "Signers: Anthropic, Google, xAI, Joshua Coleman, Physical backup key"
    );
  }

  console.log("Founder wallet:", FOUNDER_WALLET);
  console.log("Gnosis Safe:  ", GNOSIS_SAFE);
  console.log();

  // --- 1. MissionTreasury ---
  // DMS address unknown yet — Gnosis Safe is used as placeholder; updated after DMS deploy
  // In production use CREATE2 to pre-calculate addresses and eliminate circular dependency
  const MissionTreasury = await hre.ethers.getContractFactory("MissionTreasury");
  const treasury = await MissionTreasury.deploy(
    GNOSIS_SAFE,      // deadManSwitch placeholder — must be updated to real DMS addr post-deploy
    GNOSIS_SAFE,      // gnosisSafe — takes ownership on State B
    FOUNDER_WALLET    // initial owner (Josh)
  );
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("MissionTreasury deployed:", treasuryAddr);

  // --- 2. DeadManSwitch ---
  const DeadManSwitch = await hre.ethers.getContractFactory("DeadManSwitch");
  const dms = await DeadManSwitch.deploy(GNOSIS_SAFE, treasuryAddr);
  await dms.waitForDeployment();
  const dmsAddr = await dms.getAddress();
  console.log("DeadManSwitch deployed: ", dmsAddr);
  console.log("  NOTE: MissionTreasury.deadManSwitch is set to Gnosis Safe placeholder.");
  console.log("  On testnet this is fine. On mainnet, use CREATE2 to resolve circular dep.");

  // --- 3. PlatformSplitter10 — one per revenue bucket ---
  const PlatformSplitter10 = await hre.ethers.getContractFactory("PlatformSplitter10");

  const buckets = [
    { id: "YANAI-B1", platform: "YouAndINotAI-Subscriptions"   },
    { id: "YANAI-B2", platform: "YouAndINotAI-SuperLikes"       },
    { id: "AISO-B4",  platform: "AI-Solutions-Products"         },
    { id: "RECYCLE-B6", platform: "OnlineRecycle-Services"      },
    { id: "MERCH-B8", platform: "Merch-NetProfit"               },
  ];

  const splitters = {};
  for (const b of buckets) {
    const s = await PlatformSplitter10.deploy(treasuryAddr, OPERATING_WALLET, b.id, b.platform);
    await s.waitForDeployment();
    const addr = await s.getAddress();
    splitters[b.id] = addr;
    console.log(`PlatformSplitter10 [${b.id}]: ${addr}`);
  }

  // --- 4. Governance Tokens ---
  const YANAI = await hre.ethers.getContractFactory("YANAI");
  const yanai = await YANAI.deploy(FOUNDER_WALLET);
  await yanai.waitForDeployment();
  const yanaiAddr = await yanai.getAddress();
  console.log("YANAI token deployed:   ", yanaiAddr);

  const AISO = await hre.ethers.getContractFactory("AISO");
  const aiso = await AISO.deploy(FOUNDER_WALLET);
  await aiso.waitForDeployment();
  const aisoAddr = await aiso.getAddress();
  console.log("AISO token deployed:    ", aisoAddr);

  const RECYCLE = await hre.ethers.getContractFactory("RECYCLE");
  const recycle = await RECYCLE.deploy(FOUNDER_WALLET);
  await recycle.waitForDeployment();
  const recycleAddr = await recycle.getAddress();
  console.log("RECYCLE token deployed: ", recycleAddr);

  // --- Summary ---
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log(JSON.stringify({
    network: hre.network.name,
    MissionTreasury: treasuryAddr,
    DeadManSwitch: dmsAddr,
    GnosisSafe: GNOSIS_SAFE,
    splitters,
    tokens: { YANAI: yanaiAddr, AISO: aisoAddr, RECYCLE: recycleAddr }
  }, null, 2));

  console.log("\n=== NEXT STEPS ===");
  console.log("1. Save ALL addresses above — immutable after deployment");
  console.log("2. Deploy Gnosis Safe 3-of-5 if not done: app.safe.global");
  console.log("   Signers: Anthropic, Google, xAI, Josh, Physical backup");
  console.log("3. Add deployed splitter addresses to backend Square webhook handler");
  console.log("4. Set up periodic USDC deposit automation (Square USD → USDC → splitters)");
  console.log("5. Verify contracts on Basescan: npx hardhat verify --network base <address>");
  console.log("6. Get CPA review before accepting first revenue tranche");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
