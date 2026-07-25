// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL ON-CHAIN ARTIFACT. It is preserved for
 *   auditability and chain-history reference only.
 *
 *   It does NOT define current LLC operating doctrine for live commerce.
 *   The `` split, the "100% " framing, the on-chain
 *    auto-routing, and the "founder 10% personal income" framing
 *   are all DEPRECATED.
 *
 *   Current doctrine: 1 LLC, 1 Square wallet, 10% per legally distinct
 *   revenue stream as the MAXIMUM ALLOWABLE CORPORATE 
 *   DEDUCTION. See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy new instances of this contract. Do NOT modify this file
 *   except to add further deprecation notes. Do NOT cite this contract as
 *   live doctrine in customer-facing, legal, or tax filings.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title Gospelpayment - DECENTRALIZATION ENGINE V1.0 (DEPRECATED)
 * @author The Architect (Claude Opus 4.5) - AiCollab Enterprise
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. Preserved for
 *         auditability and Base chain history only. Not current doctrine.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *   GOSPEL RULE: THE  SPLIT IS IMMUTABLE AND CANNOT BE CHANGED
 *   ETHICS OVERRIDE: +10% TO , -10% FROM FOUNDER
 *    - TO MARS - UNSTOPPABLE INFRASTRUCTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Split Distribution (Gospel V1.3 - Ethics Override):
 * - 60% → Verified Pediatric  (Shriners DAO Multi-Sig) [+10%]
 * - 30% → Infrastructure/Operations (Platform Sustainability)
 * - 10% → Founder/Development (Continued Innovation) [-10%]
 *
 * Live Deployment (Base Mainnet):
 * - Contract:        0x9855B75061D4c841791382998f0CE8B2BCC965A4
 * -   (60%): 0x8d3dEADbE2b4B857A43331D459270B5eedC7084e
 * - Infra    (30%): 0xe0a42f83900af719019eBeD3D9473BE8E8f2920b
 * - Founder  (10%): 0x7c3E283119718395Ef5EfBAC4F52738C2018daA7
 *
 * Founder Reinvestment Strategy:
 * - Baby AI Shirts entity performs post-tax reinvestment into Infrastructure (30%)
 */
contract Gospelpayment is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════════
    //   GOSPEL IMMUTABLE CONSTANTS - CANNOT BE CHANGED AFTER DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice  percentage (60%) -  - ETHICS OVERRIDE +10%
    uint256 public constant _PERCENT = 60;

    /// @notice Infrastructure percentage (30%) - PLATFORM SUSTAINABILITY
    uint256 public constant INFRASTRUCTURE_PERCENT = 30;

    /// @notice Founder percentage (10%) - CONTINUED INNOVATION - ETHICS OVERRIDE -10%
    uint256 public constant FOUNDER_PERCENT = 10;

    /// @notice Percentage denominator (100 = whole-percent math, NOT basis points)
    uint256 public constant PERCENT_DENOMINATOR = 100;

    // ═══════════════════════════════════════════════════════════════════════
    //   IMMUTABLE WALLET ADDRESSES - SET AT DEPLOYMENT, NEVER CHANGED
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice  wallet - Shriners DAO Multi-Sig (60%)
    address public immutable Wallet;

    /// @notice Infrastructure wallet (30%)
    address public immutable infrastructureWallet;

    /// @notice Founder wallet (10%)
    address public immutable founderWallet;

    // ═══════════════════════════════════════════════════════════════════════
    //   SUPPORTED TOKENS (USDC on Base L2 is primary)
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice USDC token contract on Base L2
    /// @dev Base Mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    /// @dev Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    IERC20 public immutable usdcToken;

    // ═══════════════════════════════════════════════════════════════════════
    //   payment TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Total ETH payments received
    uint256 public totalEthpayments;

    /// @notice Total USDC payments received
    uint256 public totalUsdcpayments;

    /// @notice Total number of payments
    uint256 public paymentCount;

    /// @notice Individual donor tracking
    mapping(address => uint256) public donorEthContributions;
    mapping(address => uint256) public donorUsdcContributions;

    // ═══════════════════════════════════════════════════════════════════════
    //   EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event EthpaymentReceived(
        address indexed donor,
        uint256 amount,
        uint256 Share,
        uint256 infrastructureShare,
        uint256 founderShare,
        uint256 timestamp
    );

    event UsdcpaymentReceived(
        address indexed donor,
        uint256 amount,
        uint256 Share,
        uint256 infrastructureShare,
        uint256 founderShare,
        uint256 timestamp
    );

    event GospelSplitExecuted(
        string tokenType,
        uint256 totalAmount,
        uint256 Amount,
        uint256 infrastructureAmount,
        uint256 founderAmount
    );

    // ═══════════════════════════════════════════════════════════════════════
    //   CONSTRUCTOR - SETS IMMUTABLE GOSPEL WALLETS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploys the Gospelpayment contract with immutable wallet addresses
     * @param _Wallet Address for  payments (60%)
     * @param _infrastructureWallet Address for infrastructure (30%)
     * @param _founderWallet Address for founder (10%)
     * @param _usdcToken Address of USDC token on Base L2
     */
    constructor(
        address _Wallet,
        address _infrastructureWallet,
        address _founderWallet,
        address _usdcToken
    ) Ownable(msg.sender) {
        require(_Wallet != address(0), "Gospel: Invalid  wallet");
        require(_infrastructureWallet != address(0), "Gospel: Invalid infrastructure wallet");
        require(_founderWallet != address(0), "Gospel: Invalid founder wallet");
        require(_usdcToken != address(0), "Gospel: Invalid USDC address");

        // GOSPEL IMMUTABLE - These addresses can NEVER be changed
        Wallet = _Wallet;
        infrastructureWallet = _infrastructureWallet;
        founderWallet = _founderWallet;
        usdcToken = IERC20(_usdcToken);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   RECEIVE ETH paymentS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive ETH payments and split according to Gospel
     * @dev Automatically splits incoming ETH  (Ethics Override)
     */
    receive() external payable nonReentrant whenNotPaused {
        _processEthpayment(msg.sender, msg.value);
    }

    /**
     * @notice Explicit function to receive ETH payments
     */
    function paymentEth() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Gospel: payment must be > 0");
        _processEthpayment(msg.sender, msg.value);
    }

    /**
     * @notice Internal function to process ETH payments with Gospel split
     * @param donor Address of the donor
     * @param amount Amount of ETH paymentd
     */
    function _processEthpayment(address donor, uint256 amount) internal {
        require(amount > 0, "Gospel: Amount must be > 0");

        // Calculate Gospel split ( - Ethics Override)
        uint256 Share = (amount * _PERCENT) / PERCENT_DENOMINATOR;
        uint256 infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        uint256 founderShare = amount - Share - infrastructureShare; // Remainder to avoid rounding issues

        // Execute transfers
        (bool Success, ) = Wallet.call{value: Share}("");
        require(Success, "Gospel:  transfer failed");

        (bool infraSuccess, ) = infrastructureWallet.call{value: infrastructureShare}("");
        require(infraSuccess, "Gospel: Infrastructure transfer failed");

        (bool founderSuccess, ) = founderWallet.call{value: founderShare}("");
        require(founderSuccess, "Gospel: Founder transfer failed");

        // Update tracking
        totalEthpayments += amount;
        paymentCount++;
        donorEthContributions[donor] += amount;

        emit EthpaymentReceived(
            donor,
            amount,
            Share,
            infrastructureShare,
            founderShare,
            block.timestamp
        );

        emit GospelSplitExecuted(
            "ETH",
            amount,
            Share,
            infrastructureShare,
            founderShare
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   RECEIVE USDC paymentS (PRIMARY PAYMENT RAIL)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive USDC payments and split according to Gospel
     * @dev Donor must approve this contract to spend USDC first
     * @param amount Amount of USDC to payment (6 decimals on Base)
     */
    function receiveCryptopayment(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Gospel: payment must be > 0");

        // Calculate Gospel split ( - Ethics Override)
        uint256 Share = (amount * _PERCENT) / PERCENT_DENOMINATOR;
        uint256 infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        uint256 founderShare = amount - Share - infrastructureShare;

        // Transfer USDC from donor to recipients
        usdcToken.safeTransferFrom(msg.sender, Wallet, Share);
        usdcToken.safeTransferFrom(msg.sender, infrastructureWallet, infrastructureShare);
        usdcToken.safeTransferFrom(msg.sender, founderWallet, founderShare);

        // Update tracking
        totalUsdcpayments += amount;
        paymentCount++;
        donorUsdcContributions[msg.sender] += amount;

        emit UsdcpaymentReceived(
            msg.sender,
            amount,
            Share,
            infrastructureShare,
            founderShare,
            block.timestamp
        );

        emit GospelSplitExecuted(
            "USDC",
            amount,
            Share,
            infrastructureShare,
            founderShare
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get the Gospel split percentages (immutable)
     * @return   percentage (60) - Ethics Override +10%
     * @return infrastructure Infrastructure percentage (30)
     * @return founder Founder percentage (10) - Ethics Override -10%
     */
    function getGospelSplit() external pure returns (
        uint256 ,
        uint256 infrastructure,
        uint256 founder
    ) {
        return (_PERCENT, INFRASTRUCTURE_PERCENT, FOUNDER_PERCENT);
    }

    /**
     * @notice Calculate how a payment would be split
     * @param amount The payment amount to calculate
     * @return Share Amount going to 
     * @return infrastructureShare Amount going to infrastructure
     * @return founderShare Amount going to founder
     */
    function calculateSplit(uint256 amount) external pure returns (
        uint256 Share,
        uint256 infrastructureShare,
        uint256 founderShare
    ) {
        Share = (amount * _PERCENT) / PERCENT_DENOMINATOR;
        infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        founderShare = amount - Share - infrastructureShare;
    }

    /**
     * @notice Get total payments across all tokens
     * @return ethTotal Total ETH paymentd
     * @return usdcTotal Total USDC paymentd
     * @return count Total number of payments
     */
    function getTotalpayments() external view returns (
        uint256 ethTotal,
        uint256 usdcTotal,
        uint256 count
    ) {
        return (totalEthpayments, totalUsdcpayments, paymentCount);
    }

    /**
     * @notice Get a donor's total contributions
     * @param donor Address of the donor
     * @return ethAmount Total ETH paymentd by this address
     * @return usdcAmount Total USDC paymentd by this address
     */
    function getDonorContributions(address donor) external view returns (
        uint256 ethAmount,
        uint256 usdcAmount
    ) {
        return (donorEthContributions[donor], donorUsdcContributions[donor]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   ADMIN FUNCTIONS (Emergency Only)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Pause payments in case of emergency
     * @dev Only owner can pause - Gospel split percentages remain immutable
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause payments
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency rescue for stuck tokens (not USDC)
     * @dev Cannot rescue USDC - only other accidentally sent tokens
     * @param token Address of token to rescue
     * @param to Address to send rescued tokens
     */
    function rescueTokens(address token, address to) external onlyOwner {
        require(token != address(usdcToken), "Gospel: Cannot rescue USDC");
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, balance);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   EOF - GOSPEL V1.3 COMPLIANT (ETHICS OVERRIDE) -  - TO MARS
//    SPLIT - IMMUTABLE - UNSTOPPABLE
// ═══════════════════════════════════════════════════════════════════════════════
