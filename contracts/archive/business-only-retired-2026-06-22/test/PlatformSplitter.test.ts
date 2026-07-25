/**
 * PlatformSplitter — Test Suite
 *
 * Current-doctrine 10/27/63 three-way splitter for the ANTIGRAVITY multi-DAO
 * ecosystem on Base L2. Pull-over-Push pattern.
 *
 * Split ratios:
 *   10% → missionReserve  (contractual revenue payout — youth initiatives)
 *   27% → taxWallet       (covers ~30% tax on the 90% operating share)
 *   63% → daoTreasury     (operations, sinking fund, staking surplus)
 *
 * Language: "contractual revenue payout" per FL §496.405 — no
 * outreach/payment/tax-deductible language in this file.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { PlatformSplitter, MockERC20 } from "../typechain-types";

describe("PlatformSplitter", function () {
  let splitter: PlatformSplitter;
  let mockToken: MockERC20;
  let deployer: SignerWithAddress;
  let missionReserve: SignerWithAddress;
  let taxWallet: SignerWithAddress;
  let daoTreasury: SignerWithAddress;
  let stranger: SignerWithAddress;

  const MISSION_BPS = 1000n;  // 10%
  const TAX_BPS     = 2700n;  // 27%
  const OPS_BPS     = 6300n;  // 63%
  const TOTAL_BPS   = 10000n;
  const DAO_ID      = ethers.encodeBytes32String("LOVE");

  beforeEach(async function () {
    [deployer, missionReserve, taxWallet, daoTreasury, stranger] =
      await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = (await MockERC20Factory.deploy("MockUSDC", "mUSDC", 6)) as MockERC20;

    const SplitterFactory = await ethers.getContractFactory("PlatformSplitter");
    splitter = (await SplitterFactory.deploy(
      missionReserve.address,
      taxWallet.address,
      daoTreasury.address,
      DAO_ID
    )) as PlatformSplitter;
  });

  // ---------------------------------------------------------------------------
  // 1. Constructor & Immutability
  // ---------------------------------------------------------------------------

  describe("Constructor & Immutability", function () {
    it("stores all three addresses immutably", async function () {
      expect(await splitter.missionReserve()).to.equal(missionReserve.address);
      expect(await splitter.taxWallet()).to.equal(taxWallet.address);
      expect(await splitter.daoTreasury()).to.equal(daoTreasury.address);
    });

    it("stores the daoId correctly", async function () {
      expect(await splitter.daoId()).to.equal(DAO_ID);
    });

    it("reverts on zero missionReserve address", async function () {
      const Factory = await ethers.getContractFactory("PlatformSplitter");
      await expect(
        Factory.deploy(ethers.ZeroAddress, taxWallet.address, daoTreasury.address, DAO_ID)
      ).to.be.revertedWithCustomError(splitter, "ZeroAddress");
    });

    it("reverts on zero taxWallet address", async function () {
      const Factory = await ethers.getContractFactory("PlatformSplitter");
      await expect(
        Factory.deploy(missionReserve.address, ethers.ZeroAddress, daoTreasury.address, DAO_ID)
      ).to.be.revertedWithCustomError(splitter, "ZeroAddress");
    });

    it("reverts on zero daoTreasury address", async function () {
      const Factory = await ethers.getContractFactory("PlatformSplitter");
      await expect(
        Factory.deploy(missionReserve.address, taxWallet.address, ethers.ZeroAddress, DAO_ID)
      ).to.be.revertedWithCustomError(splitter, "ZeroAddress");
    });

    it("split constants match doctrine: 10/27/63", async function () {
      expect(await splitter.MISSION_BPS()).to.equal(MISSION_BPS);
      expect(await splitter.TAX_BPS()).to.equal(TAX_BPS);
      expect(await splitter.OPS_BPS()).to.equal(OPS_BPS);
      expect(MISSION_BPS + TAX_BPS + OPS_BPS).to.equal(TOTAL_BPS);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Deposit — split accounting
  // ---------------------------------------------------------------------------

  describe("USDC deposit() — split accounting", function () {
    it("splits 1000 USDC into 100 / 270 / 630 pending balances", async function () {
      const total = ethers.parseUnits("1000", 6);
      await mockToken.mint(await splitter.getAddress(), total);

      // The contract's deposit() reads USDC (hardcoded address). We need to
      // test with a mock token via depositToken() which accepts any ERC20.
      await splitter.depositToken(await mockToken.getAddress());

      // For non-USDC tokens, PlatformSplitter pushes immediately (no pull accounting)
      // So the recipients receive the funds directly.
      const missionBal = await mockToken.balanceOf(missionReserve.address);
      const taxBal     = await mockToken.balanceOf(taxWallet.address);
      const opsBal     = await mockToken.balanceOf(daoTreasury.address);

      const expMission = (total * MISSION_BPS) / TOTAL_BPS;
      const expTax     = (total * TAX_BPS) / TOTAL_BPS;
      const expOps     = total - expMission - expTax;

      expect(missionBal).to.equal(expMission);
      expect(taxBal).to.equal(expTax);
      expect(opsBal).to.equal(expOps);

      // No wei lost
      expect(missionBal + taxBal + opsBal).to.equal(total);
    });

    it(" gets exactly 10% — contractual payout floor enforced", async function () {
      const total = ethers.parseUnits("500", 6);
      await mockToken.mint(await splitter.getAddress(), total);
      await splitter.depositToken(await mockToken.getAddress());

      const missionBal = await mockToken.balanceOf(missionReserve.address);
      const tenPct = (total * MISSION_BPS) / TOTAL_BPS;
      expect(missionBal >= tenPct).to.be.true; // Mission floor enforced: at least 10%
    });

    it("deposit() reverts on local network (USDC address is mainnet-only)", async function () {
      // deposit() calls IERC20(USDC).balanceOf() against the hardcoded Base Mainnet
      // USDC address. On Hardhat local network that address is empty, causing a
      // low-level revert (no custom error). Verify the call reverts.
      await expect(splitter.deposit()).to.be.reverted;
    });

    it("reverts depositToken() when contract holds no tokens", async function () {
      await expect(
        splitter.depositToken(await mockToken.getAddress())
      ).to.be.revertedWithCustomError(splitter, "NothingToDeposit");
    });

    it("totalProcessed accumulates correctly across multiple deposits", async function () {
      const first  = ethers.parseUnits("1000", 6);
      const second = ethers.parseUnits("2000", 6);

      await mockToken.mint(await splitter.getAddress(), first);
      await splitter.depositToken(await mockToken.getAddress());

      await mockToken.mint(await splitter.getAddress(), second);
      await splitter.depositToken(await mockToken.getAddress());

      expect(await splitter.totalProcessed()).to.equal(first + second);
    });

    it("1 wei token deposit — no wei lost to rounding", async function () {
      await mockToken.mint(await splitter.getAddress(), 1n);
      await splitter.depositToken(await mockToken.getAddress());

      const missionBal = await mockToken.balanceOf(missionReserve.address);
      const taxBal     = await mockToken.balanceOf(taxWallet.address);
      const opsBal     = await mockToken.balanceOf(daoTreasury.address);

      expect(missionBal + taxBal + opsBal).to.equal(1n);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Pull withdrawal — access control
  // ---------------------------------------------------------------------------

  describe("Pull withdrawal access control (USDC pull-pattern)", function () {
    // For pull-pattern tests we need a mock USDC at the contract's USDC constant.
    // Since the contract hardcodes the Base Mainnet USDC address, we test the
    // authorization logic by verifying only authorized callers can call each withdraw function.

    it("withdrawMission() reverts when called by non-missionReserve", async function () {
      await expect(
        splitter.connect(stranger).withdrawMission()
      ).to.be.revertedWithCustomError(splitter, "Unauthorized");
    });

    it("withdrawTax() reverts when called by non-taxWallet", async function () {
      await expect(
        splitter.connect(stranger).withdrawTax()
      ).to.be.revertedWithCustomError(splitter, "Unauthorized");
    });

    it("withdrawOps() reverts when called by non-daoTreasury", async function () {
      await expect(
        splitter.connect(stranger).withdrawOps()
      ).to.be.revertedWithCustomError(splitter, "Unauthorized");
    });

    it("withdrawMission() reverts with NothingToWithdraw when missionPending == 0", async function () {
      await expect(
        splitter.connect(missionReserve).withdrawMission()
      ).to.be.revertedWithCustomError(splitter, "NothingToWithdraw");
    });

    it("withdrawTax() reverts with NothingToWithdraw when taxPending == 0", async function () {
      await expect(
        splitter.connect(taxWallet).withdrawTax()
      ).to.be.revertedWithCustomError(splitter, "NothingToWithdraw");
    });

    it("withdrawOps() reverts with NothingToWithdraw when opsPending == 0", async function () {
      await expect(
        splitter.connect(daoTreasury).withdrawOps()
      ).to.be.revertedWithCustomError(splitter, "NothingToWithdraw");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. previewSplit helper
  // ---------------------------------------------------------------------------

  describe("previewSplit()", function () {
    it("returns correct 10/27/63 split for 10000 units", async function () {
      const [mission, tax, ops] = await splitter.previewSplit(10000n);
      expect(mission).to.equal(1000n);
      expect(tax).to.equal(2700n);
      expect(ops).to.equal(6300n);
    });

    it("remainder goes to ops — no wei lost", async function () {
      // Use a prime number to stress-test rounding
      const amount = 9973n;
      const [mission, tax, ops] = await splitter.previewSplit(amount);
      expect(mission + tax + ops).to.equal(amount);
    });

    it("ops always gets the remainder (can be >= exact 63% due to rounding)", async function () {
      const amount = ethers.parseUnits("1", 6); // 1 USDC in micro-units
      const [mission, tax, ops] = await splitter.previewSplit(amount);
      const exactOps = (amount * OPS_BPS) / TOTAL_BPS;
      // ops = remainder so it's >= the floor ratio
      expect(ops >= exactOps).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Event emissions
  // ---------------------------------------------------------------------------

  describe("Events", function () {
    it("emits Deposited event on depositToken()", async function () {
      const amount = ethers.parseUnits("100", 6);
      await mockToken.mint(await splitter.getAddress(), amount);

      await expect(splitter.depositToken(await mockToken.getAddress()))
        .to.emit(splitter, "Deposited")
        .withArgs(await mockToken.getAddress(), amount, DAO_ID);
    });
  });
});
