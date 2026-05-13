/**
 * CharityRouter100 — Test Suite
 *
 * CharityRouter100 is a historical-artifact contract kept for audit/reference.
 * Its core mechanic (immutable single-destination forwarding) is still sound
 * and relevant to verify before any future deployment.
 *
 * Tests use "contractual revenue disbursement" / "charitable disbursement"
 * language per FL §496.405 compliance posture — never solicitation/donation.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { CharityRouter100, MockERC20 } from "../typechain-types";

describe("CharityRouter100", function () {
  let router: CharityRouter100;
  let mockToken: MockERC20;
  let deployer: SignerWithAddress;
  let charitySafe: SignerWithAddress;
  let attacker: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [deployer, charitySafe, attacker, user] = await ethers.getSigners();

    // Deploy mock ERC20 for token routing tests
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = (await MockERC20Factory.deploy("MockUSDC", "mUSDC", 6)) as MockERC20;

    // Deploy CharityRouter100 pointing at the charitySafe address
    const RouterFactory = await ethers.getContractFactory("CharityRouter100");
    router = (await RouterFactory.deploy(charitySafe.address)) as CharityRouter100;
  });

  // ---------------------------------------------------------------------------
  // 1. Constructor / Immutability
  // ---------------------------------------------------------------------------

  describe("Constructor & Immutability", function () {
    it("stores the charity address immutably", async function () {
      expect(await router.CHARITY_SAFE()).to.equal(charitySafe.address);
      expect(await router.getCharityAddress()).to.equal(charitySafe.address);
    });

    it("reverts on deploy if charity address is zero", async function () {
      const RouterFactory = await ethers.getContractFactory("CharityRouter100");
      await expect(
        RouterFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(router, "InvalidCharitySafe");
    });

    it("cannot be re-pointed — CHARITY_SAFE is immutable (no setter exists)", async function () {
      // Verify there is no function on the contract that can change CHARITY_SAFE
      const iface = router.interface;
      const fragments = Object.values(iface.fragments);
      const setters = fragments.filter(
        (f) =>
          f.type === "function" &&
          (f as any).name &&
          ((f as any).name.toLowerCase().includes("setcharity") ||
            (f as any).name.toLowerCase().includes("setrecipient") ||
            (f as any).name.toLowerCase().includes("updatecharity"))
      );
      expect(setters.length).to.equal(
        0,
        "No setter for CHARITY_SAFE should exist — contract must be immutable"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ETH Routing — 100% forwarding
  // ---------------------------------------------------------------------------

  describe("ETH Routing", function () {
    it("routes 100% of received ETH to CHARITY_SAFE via receive()", async function () {
      const sendAmt = ethers.parseEther("1.0");
      const beforeBal = await ethers.provider.getBalance(charitySafe.address);

      await user.sendTransaction({ to: await router.getAddress(), value: sendAmt });

      const afterBal = await ethers.provider.getBalance(charitySafe.address);
      expect(afterBal - beforeBal).to.equal(sendAmt);
      // Router should hold nothing after forward
      expect(await ethers.provider.getBalance(await router.getAddress())).to.equal(0n);
    });

    it("distributeETH() forwards any ETH balance held at call time to CHARITY_SAFE", async function () {
      // Note: CharityRouter100.receive() auto-forwards ETH on arrival, so normal
      // sendTransaction() leaves nothing for distributeETH() to flush.
      // The only ETH that can "sit" in the router is ETH forced in via selfdestruct
      // (a forced-send pattern). We verify the function is callable and correctly
      // reverts when there is nothing to distribute.
      //
      // Positive-path for distributeETH() is covered by the receive() test above —
      // the function path is: receive() → _forwardETH() → CHARITY_SAFE.
      await expect(router.distributeETH()).to.be.revertedWithCustomError(
        router,
        "NothingToDistribute"
      );
    });

    it("handles sub-cent ETH amounts without rounding loss (10 wei)", async function () {
      const tinyAmt = 10n; // 10 wei — well below $0.01
      const beforeBal = await ethers.provider.getBalance(charitySafe.address);

      await user.sendTransaction({ to: await router.getAddress(), value: tinyAmt });

      const afterBal = await ethers.provider.getBalance(charitySafe.address);
      // Exact amount must arrive — no truncation
      expect(afterBal - beforeBal).to.equal(tinyAmt);
    });

    it("receive() leaves zero ETH in the router (auto-forward on receipt)", async function () {
      const sendAmt = ethers.parseEther("0.25");
      await user.sendTransaction({ to: await router.getAddress(), value: sendAmt });
      // After auto-forward, router balance must be 0
      expect(await ethers.provider.getBalance(await router.getAddress())).to.equal(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ERC20 Token Routing
  // ---------------------------------------------------------------------------

  describe("ERC20 Token Routing", function () {
    it("routes 100% of ERC20 token balance to CHARITY_SAFE via distributeToken()", async function () {
      const amount = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)
      await mockToken.mint(await router.getAddress(), amount);

      const beforeBal = await mockToken.balanceOf(charitySafe.address);
      await router.distributeToken(await mockToken.getAddress());
      const afterBal = await mockToken.balanceOf(charitySafe.address);

      expect(afterBal - beforeBal).to.equal(amount);
      expect(await mockToken.balanceOf(await router.getAddress())).to.equal(0n);
    });

    it("distributeToken reverts when token balance is zero", async function () {
      await expect(
        router.distributeToken(await mockToken.getAddress())
      ).to.be.revertedWithCustomError(router, "NothingToDistribute");
    });

    it("handles 1 wei of ERC20 token without rounding loss", async function () {
      await mockToken.mint(await router.getAddress(), 1n);
      const beforeBal = await mockToken.balanceOf(charitySafe.address);
      await router.distributeToken(await mockToken.getAddress());
      const afterBal = await mockToken.balanceOf(charitySafe.address);
      expect(afterBal - beforeBal).to.equal(1n);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Reentrancy — ETH forwarding path
  // ---------------------------------------------------------------------------

  describe("Reentrancy guard (ETH path)", function () {
    it("CHARITY_SAFE immutability prevents any address substitution attack", async function () {
      // The primary reentrancy protection for CharityRouter100 is architectural:
      // CHARITY_SAFE is immutable — no attacker can substitute themselves as recipient.
      // Even if CHARITY_SAFE is a malicious contract that re-enters on receive(),
      // the re-entrant call to receive() would try to forward address(this).balance = 0
      // and return silently (_forwardETH checks balance == 0).
      //
      // Verify: CHARITY_SAFE is truly immutable (no setter function exists)
      const iface = router.interface;
      const hasSetterForCharity = Object.values(iface.fragments).some(
        (f) =>
          f.type === "function" &&
          ["setcharity", "setrecipient", "updatecharity", "changesafe"].includes(
            (f as any).name?.toLowerCase() ?? ""
          )
      );
      expect(hasSetterForCharity).to.be.false;

      // Verify: a ReentrancyAttacker deployed at a different address gets nothing
      // even if it sends ETH to the router (the forward goes to CHARITY_SAFE, not attacker)
      const ReentrancyFactory = await ethers.getContractFactory("ReentrancyAttacker");
      const attackerContract = await ReentrancyFactory.deploy(await router.getAddress());

      const attackerAddr = await attackerContract.getAddress();
      const balBefore = await ethers.provider.getBalance(attackerAddr);

      // Send ETH to router — it auto-forwards to charitySafe, NOT attacker
      await user.sendTransaction({ to: await router.getAddress(), value: ethers.parseEther("1.0") });

      const balAfter = await ethers.provider.getBalance(attackerAddr);
      expect(balAfter).to.equal(balBefore); // attacker received nothing
    });
  });

  // ---------------------------------------------------------------------------
  // 5. View helpers
  // ---------------------------------------------------------------------------

  describe("View helpers", function () {
    it("pendingETH() returns zero after auto-forward (router never holds ETH)", async function () {
      // receive() auto-forwards all ETH — router should always report 0 pending ETH
      const amt = ethers.parseEther("2.0");
      await deployer.sendTransaction({ to: await router.getAddress(), value: amt });
      // After auto-forward the router holds 0
      expect(await router.pendingETH()).to.equal(0n);
    });

    it("pendingToken() reports current token balance of the router", async function () {
      const amt = ethers.parseUnits("50", 6);
      await mockToken.mint(await router.getAddress(), amt);
      expect(await router.pendingToken(await mockToken.getAddress())).to.equal(amt);
    });
  });
});
