/**
 * Deploy DatingRevenueRouter to Base Mainnet
 * HISTORICAL split-era artifact only. Not current live LLC doctrine.
 *
 * NOTE:
 * This is the intended-next historical router path in the repo.
 * As of 2026-03-08, the currently verified live Base split remains the legacy
 * GospelDonation contract at 0x9855B75061D4c841791382998f0CE8B2BCC965A4.
 *
 * Usage: DEPLOYER_PRIVATE_KEY=0x... ALLOW_HISTORICAL_SPLIT_DEPLOY=YES npx hardhat run scripts/deploy.js --network base
 */

const { ethers } = require('hardhat');

if (process.env.ALLOW_HISTORICAL_SPLIT_DEPLOY !== 'YES') {
  throw new Error(
    "Historical split deploy blocked. This repo's current LLC doctrine is the conservative 10% charitable cap. " +
      'Set ALLOW_HISTORICAL_SPLIT_DEPLOY=YES only if you are intentionally deploying a historical artifact.',
  );
}

// Historical wallets — live verified on Base Mainnet for the legacy split contract.
// DO NOT CHANGE without verifying the new addresses on-chain first.
const CHARITY_SAFE = '0x8d3dEADbE2b4B857A43331D459270B5eedC7084e'; // Historical charity wallet (60%)
const DAO_TREASURY = '0xe0a42f83900af719019eBeD3D9473BE8E8f2920b'; // Historical infrastructure wallet (30%)
const FOUNDER_WALLET = '0x7c3E283119718395Ef5EfBAC4F52738C2018daA7'; // Historical founder wallet (10%)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying DatingRevenueRouter with:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH');

  const Router = await ethers.getContractFactory('DatingRevenueRouter');
  const router = await Router.deploy(CHARITY_SAFE, DAO_TREASURY, FOUNDER_WALLET);
  await router.waitForDeployment();

  const addr = await router.getAddress();
  console.log('\n=== DEPLOYED ===');
  console.log('DatingRevenueRouter:', addr);
  console.log('Chain: Base Mainnet (8453)');
  console.log('Split: 60% charity / 30% mission infra + AI ops / 10% founder (historical artifact)');
  console.log('Charity:', CHARITY_SAFE);
  console.log('DAO:', DAO_TREASURY);
  console.log('Founder:', FOUNDER_WALLET);
  console.log('\nVerify: https://basescan.org/address/' + addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
