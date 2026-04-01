/**
 * Deploy CharityRouter100 to Base Mainnet
 * HISTORICAL charity-side artifact only. Not current live LLC doctrine.
 *
 * Usage: DEPLOYER_PRIVATE_KEY=0x... ALLOW_HISTORICAL_CHARITY_DEPLOY=YES npx hardhat run scripts/deploy-charity.js --network base
 */

const { ethers } = require("hardhat");

if (process.env.ALLOW_HISTORICAL_CHARITY_DEPLOY !== "YES") {
  throw new Error(
    "Historical charity deploy blocked. Current LLC doctrine does not use a 100% charity-side deploy path. " +
    "Set ALLOW_HISTORICAL_CHARITY_DEPLOY=YES only if you are intentionally deploying a historical artifact."
  );
}

// Historical charity wallet reference from Transparency.tsx
const CHARITY_SAFE = "0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CharityRouter100 with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Router = await ethers.getContractFactory("CharityRouter100");
  const router = await Router.deploy(CHARITY_SAFE);
  await router.waitForDeployment();

  const addr = await router.getAddress();
  console.log("\n=== DEPLOYED ===");
  console.log("CharityRouter100:", addr);
  console.log("Chain: Base Mainnet (8453)");
  console.log("Split: 100% to charity (historical artifact)");
  console.log("Charity Safe:", CHARITY_SAFE);
  console.log("\nVerify: https://basescan.org/address/" + addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
