/**
 * Deploy DatingRevenueRouter to Base Mainnet
 * Protocol Omega: 60% charity / 30% mission infrastructure + AI ops / 10% founder — IMMUTABLE
 *
 * NOTE:
 * This is the intended-next router path in the repo.
 * As of 2026-03-08, the currently verified live Base split remains the legacy
 * GospelDonation contract at 0x9855B75061D4c841791382998f0CE8B2BCC965A4.
 *
 * Usage: DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network base
 */

const { ethers } = require("hardhat");

// Canonical wallets — live verified on Base Mainnet (GospelDonation.sol, 0x9855B75061D4c841791382998f0CE8B2BCC965A4)
// DO NOT CHANGE without verifying the new addresses on-chain first
const CHARITY_SAFE   = "0x8d3dEADbE2b4B857A43331D459270B5eedC7084e"; // Shriners (60%) — live verified
const DAO_TREASURY   = "0xe0a42f83900af719019eBeD3D9473BE8E8f2920b"; // Mission infra + AI ops (30%) — live verified
const FOUNDER_WALLET = "0x7c3E283119718395Ef5EfBAC4F52738C2018daA7"; // Ops (10%) — live verified

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
  console.log("Split: 60% charity / 30% mission infra + AI ops / 10% founder");
  console.log("Charity:", CHARITY_SAFE);
  console.log("DAO:", DAO_TREASURY);
  console.log("Founder:", FOUNDER_WALLET);
  console.log("\nVerify: https://basescan.org/address/" + addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
