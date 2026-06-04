/**
 * DatingRevenueRouter — Test Suite
 *
 * =============================================================================
 * !! STALE DOCTRINE FLAG — READ BEFORE RUNNING !!
 * =============================================================================
 * This contract hardcodes PCT_CHARITY = 6000 (60%), PCT_DAO = 3000 (30%),
 * PCT_FOUNDER = 1000 (10%).  The contract header itself marks this as a
 * "historical draft artifact" that "does NOT represent current live LLC
 * operating doctrine."
 *
 * Per the current ANTIGRAVITY revenue doctrine (10%-per-bucket compounding,
 * waterfall-first), the correct live contract is PlatformSplitter10 (per-bucket
 * 10/90) or PlatformSplitter (10/27/63 DAO waterfall).  DatingRevenueRouter
 * MUST NOT be deployed for active revenue.
 *
 * These tests exist to:
 *   (a) Document what the stale contract actually does so Codex review can
 *       confirm it is NOT deployed to any live chain, and
 *   (b) Prevent any future engineer from assuming the contract is current and
 *       forwarding it to production without a canonical legal review sign-off.
 *
 * Tests are labeled [STALE-DOCTRINE] where they assert behavior that conflicts
 * with current operating doctrine.
 * =============================================================================
 *
 * Language: "contractual revenue disbursement" per FL §496.405 — no
 * solicitation/donation/tax-deductible language anywhere in this file.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { DatingRevenueRouter, MockERC20 } from "../typechain-types";

describe("DatingRevenueRouter [STALE-DOCTRINE — DO NOT DEPLOY]", function () {
  let router: DatingRevenueRouter;
  let mockToken: MockERC20;
  let deployer: SignerWithAddress;
  let charitySafe: SignerWithAddress;
  let daoTreasury: SignerWithAddress;
  let founderWallet: SignerWithAddress;
  let user: SignerWithAddress;

  // Hard-coded stale constants — documented here so reviewers see the mismatch immediately
  const STALE_PCT_CHARITY  = 6000n; // 60% — DEAD DOCTRINE
  const STALE_PCT_DAO      = 3000n; // 30% — DEAD DOCTRINE
  const STALE_PCT_FOUNDER  = 1000n; // 10% — DEAD DOCTRINE
  const BASIS_POINTS       = 10000n;

  beforeEach(async function () {
    [deployer, charitySafe, daoTreasury, founderWallet, user] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = (await MockERC20Factory.deploy("MockUSDC", "mUSDC", 6)) as MockERC20;

    const RouterFactory = await ethers.getContractFactory("DatingRevenueRouter");
    router = (await RouterFactory.deploy(
      charitySafe.address,
      daoTreasury.address,
      founderWallet.address
    )) as DatingRevenueRouter;
  });

  // ---------------------------------------------------------------------------
  // META: Stale doctrine detection — these tests fail if the contract is updated
  // to current doctrine, which is the signal that tests need to be rewritten
  // ---------------------------------------------------------------------------

  describe("Stale-doctrine detection (contract constants audit)", function () {
    it("[STALE-DOCTRINE] PCT_CHARITY == 6000 bp (60%) — conflicts with current 10%-per-bucket doctrine", async function () {
      const pctCharity = await router.PCT_CHARITY();
      expect(pctCharity).to.equal(6000n,
        "STALE DOCTRINE CONFIRMED: contract still encodes 60% to charity. " +
        "Current doctrine requires 10%-per-bucket compounding. " +
        "This contract must NOT be deployed for active revenue."
      );
    });

    it("[STALE-DOCTRINE] PCT_DAO == 3000 bp (30%) — conflicts with current 27% tax-first waterfall", async function () {
      const pctDao = await router.PCT_DAO();
      expect(pctDao).to.equal(3000n,
        "STALE DOCTRINE CONFIRMED: contract still encodes 30% to DAO treasury. " +
        "Current doctrine routes 27% to tax wallet first, then 63% to ops."
      );
    });

    it("[STALE-DOCTRINE] PCT_FOUNDER == 1000 bp (10%) — founder-first is dead (founder goes last in current waterfall)", async function () {
      const pctFounder = await router.PCT_FOUNDER();
      expect(pctFounder).to.equal(1000n,
        "STALE DOCTRINE CONFIRMED: 10% founder slice is a named constant. " +
        "Current waterfall: founder receives only whatever remains after all other buckets. " +
        "A named founder constant violates the 'founder is last' rule."
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  describe("Constructor", function () {
    it("reverts if charitySafe is zero address", async function () {
      const RouterFactory = await ethers.getContractFactory("DatingRevenueRouter");
      await expect(
        RouterFactory.deploy(ethers.ZeroAddress, daoTreasury.address, founderWallet.address)
      ).to.be.revertedWithCustomError(router, "InvalidAddress");
    });

    it("reverts if daoTreasury is zero address", async function () {
      const RouterFactory = await ethers.getContractFactory("DatingRevenueRouter");
      await expect(
        RouterFactory.deploy(charitySafe.address, ethers.ZeroAddress, founderWallet.address)
      ).to.be.revertedWithCustomError(router, "InvalidAddress");
    });

    it("reverts if founderWallet is zero address", async function () {
      const RouterFactory = await ethers.getContractFactory("DatingRevenueRouter");
      await expect(
        RouterFactory.deploy(charitySafe.address, daoTreasury.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(router, "InvalidAddress");
    });

    it("stores addresses immutably", async function () {
      expect(await router.charitySafe()).to.equal(charitySafe.address);
      expect(await router.daoTreasury()).to.equal(daoTreasury.address);
      expect(await router.founderWallet()).to.equal(founderWallet.address);
    });
  });

  // ---------------------------------------------------------------------------
  // ERC20 distribution — documenting what the stale contract does
  // ---------------------------------------------------------------------------

  describe("ERC20 distribution (stale 60/30/10 math — reference only)", function () {
    it("[STALE-DOCTRINE] distributes token per stale 60/30/10 split", async function () {
      const total = ethers.parseUnits("1000", 6);
      await mockToken.mint(await router.getAddress(), total);

      const beforeCharity = await mockToken.balanceOf(charitySafe.address);
      const beforeDao     = await mockToken.balanceOf(daoTreasury.address);
      const beforeFounder = await mockToken.balanceOf(founderWallet.address);

      await router.distributeToken(await mockToken.getAddress());

      const afterCharity = await mockToken.balanceOf(charitySafe.address);
      const afterDao     = await mockToken.balanceOf(daoTreasury.address);
      const afterFounder = await mockToken.balanceOf(founderWallet.address);

      const charityGot  = afterCharity - beforeCharity;
      const daoGot      = afterDao - beforeDao;
      const founderGot  = afterFounder - beforeFounder;

      // Stale math: founder = 10%, dao = 30%, charity = remainder
      const expFounder = (total * STALE_PCT_FOUNDER) / BASIS_POINTS;
      const expDao     = (total * STALE_PCT_DAO) / BASIS_POINTS;
      const expCharity = total - expFounder - expDao;

      expect(founderGot).to.equal(expFounder);
      expect(daoGot).to.equal(expDao);
      expect(charityGot).to.equal(expCharity);

      // Sanity: no wei lost
      expect(charityGot + daoGot + founderGot).to.equal(total);
    });

    it("reverts distributeToken when balance is zero", async function () {
      await expect(
        router.distributeToken(await mockToken.getAddress())
      ).to.be.revertedWithCustomError(router, "NothingToDistribute");
    });

    it("preserves wei-precision — 1 wei distributed with no loss", async function () {
      await mockToken.mint(await router.getAddress(), 1n);
      // 1 wei: founder = 0, dao = 0, charity = 1 (remainder wins)
      await router.distributeToken(await mockToken.getAddress());
      const charityBal = await mockToken.balanceOf(charitySafe.address);
      // All 1 wei must reach some recipient — none lost to rounding
      const daoBal     = await mockToken.balanceOf(daoTreasury.address);
      const founderBal = await mockToken.balanceOf(founderWallet.address);
      expect(charityBal + daoBal + founderBal).to.equal(1n);
    });
  });

  // ---------------------------------------------------------------------------
  // ETH distribution
  // ---------------------------------------------------------------------------

  describe("ETH distribution", function () {
    it("[STALE-DOCTRINE] distributes ETH per stale 60/30/10 split", async function () {
      const total = ethers.parseEther("3.0");
      await deployer.sendTransaction({ to: await router.getAddress(), value: total });

      const expFounder = (total * STALE_PCT_FOUNDER) / BASIS_POINTS;
      const expDao     = (total * STALE_PCT_DAO) / BASIS_POINTS;
      const expCharity = total - expFounder - expDao;

      const beforeCharity = await ethers.provider.getBalance(charitySafe.address);
      const beforeDao     = await ethers.provider.getBalance(daoTreasury.address);
      const beforeFounder = await ethers.provider.getBalance(founderWallet.address);

      await router.distributeETH();

      expect(await ethers.provider.getBalance(charitySafe.address) - beforeCharity).to.equal(expCharity);
      expect(await ethers.provider.getBalance(daoTreasury.address) - beforeDao).to.equal(expDao);
      expect(await ethers.provider.getBalance(founderWallet.address) - beforeFounder).to.equal(expFounder);
    });

    it("reverts distributeETH when balance is zero", async function () {
      await expect(router.distributeETH()).to.be.revertedWithCustomError(
        router,
        "NothingToDistribute"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // previewSplit helper
  // ---------------------------------------------------------------------------

  describe("previewSplit()", function () {
    it("returns values matching on-chain distribution for a round amount", async function () {
      const amount = ethers.parseUnits("100", 6);
      const [charityAmt, daoAmt, founderAmt] = await router.previewSplit(amount);

      expect(founderAmt).to.equal((amount * STALE_PCT_FOUNDER) / BASIS_POINTS);
      expect(daoAmt).to.equal((amount * STALE_PCT_DAO) / BASIS_POINTS);
      expect(charityAmt + daoAmt + founderAmt).to.equal(amount);
    });
  });
});
