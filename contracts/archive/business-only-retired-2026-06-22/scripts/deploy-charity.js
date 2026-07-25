/**
 * Deploy Router100 to Base Mainnet
 * HISTORICAL -side artifact only. Not current live LLC doctrine.
 *
 * Usage: DEPLOYER_PRIVATE_KEY=0x... ALLOW_HISTORICAL__DEPLOY=YES npx hardhat run scripts/deploy-.js --network base
 */

const { ethers } = require('hardhat');

if (process.env.ALLOW_HISTORICAL__DEPLOY !== 'YES') {
  throw new Error(
    'Historical  deploy blocked. Current LLC doctrine does not use a 100% -side deploy path. ' +
      'Set ALLOW_HISTORICAL__DEPLOY=YES only if you are intentionally deploying a historical artifact.',
  );
}

// Historical  wallet reference from Transparency.tsx
const _SAFE = '0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying Router100 with:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH');

  const Router = await ethers.getContractFactory('Router100');
  const router = await Router.deploy(_SAFE);
  await router.waitForDeployment();

  const addr = await router.getAddress();
  console.log('\n=== DEPLOYED ===');
  console.log('Router100:', addr);
  console.log('Chain: Base Mainnet (8453)');
  console.log('Split: 100% to  (historical artifact)');
  console.log(' Safe:', _SAFE);
  console.log('\nVerify: https://basescan.org/address/' + addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
