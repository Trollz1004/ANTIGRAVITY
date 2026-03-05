/**
 * Deploy DatingRevenueRouter to Base Mainnet
 * Protocol Omega: 60% Shriners / 30% V8 Infra / 10% Founder — IMMUTABLE
 *
 * Usage: DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network base
 */

const { ethers } = require("hardhat");

// Canonical wallets from Transparency.tsx — DO NOT CHANGE
const CHARITY_SAFE   = "0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B"; // Shriners (60%)
const DAO_TREASURY   = "0xa87874d5320555c8639670645F1A2B4f82363a7c"; // V8 Infra (30%)
const FOUNDER_WALLET = "0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4"; // Ops (10%)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DatingRevenueRouter with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Router = await ethers.getContractFactory("DatingRevenueRouter");
  const router = await Router.deploy(CHARITY_SAFE, DAO_TREASURY, FOUNDER_WALLET);
  await router.waitForDeployment();

  const addr = await router.getAddress();
  console.log("\n=== DEPLOYED ===");
  console.log("DatingRevenueRouter:", addr);
  console.log("Chain: Base Mainnet (8453)");
  console.log("Split: 60% Shriners / 30% V8 / 10% Founder");
  console.log("Charity:", CHARITY_SAFE);
  console.log("DAO:", DAO_TREASURY);
  console.log("Founder:", FOUNDER_WALLET);
  console.log("\nVerify: https://basescan.org/address/" + addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
