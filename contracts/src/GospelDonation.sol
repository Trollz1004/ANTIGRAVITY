// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GospelDonation - DECENTRALIZATION ENGINE V1.0
 * @author The Architect (Claude Opus 4.5) - AiCollab Enterprise
 * @notice Immutable 60/30/10 split enforced on-chain for Gospel V1.3 compliance (Ethics Override)
 * @dev Deployed on Base L2 for low gas fees and Coinbase integration
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *   GOSPEL RULE: THE 60/30/10 SPLIT IS IMMUTABLE AND CANNOT BE CHANGED
 *   ETHICS OVERRIDE: +10% TO CHARITY, -10% FROM FOUNDER
 *   FOR THE KIDS - TO MARS - UNSTOPPABLE INFRASTRUCTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Split Distribution (Gospel V1.3 - Ethics Override):
 * - 60% → Verified Pediatric Charities (Shriners DAO Multi-Sig) [+10%]
 * - 30% → Infrastructure/Operations (Platform Sustainability)
 * - 10% → Founder/Development (Continued Innovation) [-10%]
 *
 * Live Deployment (Base Mainnet):
 * - Contract:        0x9855B75061D4c841791382998f0CE8B2BCC965A4
 * - Charity  (60%): 0x8d3dEADbE2b4B857A43331D459270B5eedC7084e
 * - Infra    (30%): 0xe0a42f83900af719019eBeD3D9473BE8E8f2920b
 * - Founder  (10%): 0x7c3E283119718395Ef5EfBAC4F52738C2018daA7
 *
 * Founder Reinvestment Strategy:
 * - Baby AI Shirts entity performs post-tax reinvestment into Infrastructure (30%)
 */
contract GospelDonation is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════════
    //   GOSPEL IMMUTABLE CONSTANTS - CANNOT BE CHANGED AFTER DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Charity percentage (60%) - FOR THE KIDS - ETHICS OVERRIDE +10%
    uint256 public constant CHARITY_PERCENT = 60;

    /// @notice Infrastructure percentage (30%) - PLATFORM SUSTAINABILITY
    uint256 public constant INFRASTRUCTURE_PERCENT = 30;

    /// @notice Founder percentage (10%) - CONTINUED INNOVATION - ETHICS OVERRIDE -10%
    uint256 public constant FOUNDER_PERCENT = 10;

    /// @notice Basis points denominator for percentage calculations
    uint256 public constant PERCENT_DENOMINATOR = 100;

    // ═══════════════════════════════════════════════════════════════════════
    //   IMMUTABLE WALLET ADDRESSES - SET AT DEPLOYMENT, NEVER CHANGED
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Charity wallet - Shriners DAO Multi-Sig (60%)
    address public immutable charityWallet;

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
    //   DONATION TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Total ETH donations received
    uint256 public totalEthDonations;

    /// @notice Total USDC donations received
    uint256 public totalUsdcDonations;

    /// @notice Total number of donations
    uint256 public donationCount;

    /// @notice Individual donor tracking
    mapping(address => uint256) public donorEthContributions;
    mapping(address => uint256) public donorUsdcContributions;

    // ═══════════════════════════════════════════════════════════════════════
    //   EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event EthDonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 charityShare,
        uint256 infrastructureShare,
        uint256 founderShare,
        uint256 timestamp
    );

    event UsdcDonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 charityShare,
        uint256 infrastructureShare,
        uint256 founderShare,
        uint256 timestamp
    );

    event GospelSplitExecuted(
        string tokenType,
        uint256 totalAmount,
        uint256 charityAmount,
        uint256 infrastructureAmount,
        uint256 founderAmount
    );

    // ═══════════════════════════════════════════════════════════════════════
    //   CONSTRUCTOR - SETS IMMUTABLE GOSPEL WALLETS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploys the GospelDonation contract with immutable wallet addresses
     * @param _charityWallet Address for charity donations (60%)
     * @param _infrastructureWallet Address for infrastructure (30%)
     * @param _founderWallet Address for founder (10%)
     * @param _usdcToken Address of USDC token on Base L2
     */
    constructor(
        address _charityWallet,
        address _infrastructureWallet,
        address _founderWallet,
        address _usdcToken
    ) Ownable(msg.sender) {
        require(_charityWallet != address(0), "Gospel: Invalid charity wallet");
        require(_infrastructureWallet != address(0), "Gospel: Invalid infrastructure wallet");
        require(_founderWallet != address(0), "Gospel: Invalid founder wallet");
        require(_usdcToken != address(0), "Gospel: Invalid USDC address");

        // GOSPEL IMMUTABLE - These addresses can NEVER be changed
        charityWallet = _charityWallet;
        infrastructureWallet = _infrastructureWallet;
        founderWallet = _founderWallet;
        usdcToken = IERC20(_usdcToken);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   RECEIVE ETH DONATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive ETH donations and split according to Gospel
     * @dev Automatically splits incoming ETH 60/30/10 (Ethics Override)
     */
    receive() external payable nonReentrant whenNotPaused {
        _processEthDonation(msg.sender, msg.value);
    }

    /**
     * @notice Explicit function to receive ETH donations
     */
    function donateEth() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Gospel: Donation must be > 0");
        _processEthDonation(msg.sender, msg.value);
    }

    /**
     * @notice Internal function to process ETH donations with Gospel split
     * @param donor Address of the donor
     * @param amount Amount of ETH donated
     */
    function _processEthDonation(address donor, uint256 amount) internal {
        require(amount > 0, "Gospel: Amount must be > 0");

        // Calculate Gospel split (60/30/10 - Ethics Override)
        uint256 charityShare = (amount * CHARITY_PERCENT) / PERCENT_DENOMINATOR;
        uint256 infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        uint256 founderShare = amount - charityShare - infrastructureShare; // Remainder to avoid rounding issues

        // Execute transfers
        (bool charitySuccess, ) = charityWallet.call{value: charityShare}("");
        require(charitySuccess, "Gospel: Charity transfer failed");

        (bool infraSuccess, ) = infrastructureWallet.call{value: infrastructureShare}("");
        require(infraSuccess, "Gospel: Infrastructure transfer failed");

        (bool founderSuccess, ) = founderWallet.call{value: founderShare}("");
        require(founderSuccess, "Gospel: Founder transfer failed");

        // Update tracking
        totalEthDonations += amount;
        donationCount++;
        donorEthContributions[donor] += amount;

        emit EthDonationReceived(
            donor,
            amount,
            charityShare,
            infrastructureShare,
            founderShare,
            block.timestamp
        );

        emit GospelSplitExecuted(
            "ETH",
            amount,
            charityShare,
            infrastructureShare,
            founderShare
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   RECEIVE USDC DONATIONS (PRIMARY PAYMENT RAIL)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive USDC donations and split according to Gospel
     * @dev Donor must approve this contract to spend USDC first
     * @param amount Amount of USDC to donate (6 decimals on Base)
     */
    function receiveCryptoDonation(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Gospel: Donation must be > 0");

        // Calculate Gospel split (60/30/10 - Ethics Override)
        uint256 charityShare = (amount * CHARITY_PERCENT) / PERCENT_DENOMINATOR;
        uint256 infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        uint256 founderShare = amount - charityShare - infrastructureShare;

        // Transfer USDC from donor to recipients
        usdcToken.safeTransferFrom(msg.sender, charityWallet, charityShare);
        usdcToken.safeTransferFrom(msg.sender, infrastructureWallet, infrastructureShare);
        usdcToken.safeTransferFrom(msg.sender, founderWallet, founderShare);

        // Update tracking
        totalUsdcDonations += amount;
        donationCount++;
        donorUsdcContributions[msg.sender] += amount;

        emit UsdcDonationReceived(
            msg.sender,
            amount,
            charityShare,
            infrastructureShare,
            founderShare,
            block.timestamp
        );

        emit GospelSplitExecuted(
            "USDC",
            amount,
            charityShare,
            infrastructureShare,
            founderShare
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //   VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get the Gospel split percentages (immutable)
     * @return charity Charity percentage (60) - Ethics Override +10%
     * @return infrastructure Infrastructure percentage (30)
     * @return founder Founder percentage (10) - Ethics Override -10%
     */
    function getGospelSplit() external pure returns (
        uint256 charity,
        uint256 infrastructure,
        uint256 founder
    ) {
        return (CHARITY_PERCENT, INFRASTRUCTURE_PERCENT, FOUNDER_PERCENT);
    }

    /**
     * @notice Calculate how a donation would be split
     * @param amount The donation amount to calculate
     * @return charityShare Amount going to charity
     * @return infrastructureShare Amount going to infrastructure
     * @return founderShare Amount going to founder
     */
    function calculateSplit(uint256 amount) external pure returns (
        uint256 charityShare,
        uint256 infrastructureShare,
        uint256 founderShare
    ) {
        charityShare = (amount * CHARITY_PERCENT) / PERCENT_DENOMINATOR;
        infrastructureShare = (amount * INFRASTRUCTURE_PERCENT) / PERCENT_DENOMINATOR;
        founderShare = amount - charityShare - infrastructureShare;
    }

    /**
     * @notice Get total donations across all tokens
     * @return ethTotal Total ETH donated
     * @return usdcTotal Total USDC donated
     * @return count Total number of donations
     */
    function getTotalDonations() external view returns (
        uint256 ethTotal,
        uint256 usdcTotal,
        uint256 count
    ) {
        return (totalEthDonations, totalUsdcDonations, donationCount);
    }

    /**
     * @notice Get a donor's total contributions
     * @param donor Address of the donor
     * @return ethAmount Total ETH donated by this address
     * @return usdcAmount Total USDC donated by this address
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
     * @notice Pause donations in case of emergency
     * @dev Only owner can pause - Gospel split percentages remain immutable
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause donations
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
//   EOF - GOSPEL V1.3 COMPLIANT (ETHICS OVERRIDE) - FOR THE KIDS - TO MARS
//   60/30/10 SPLIT - IMMUTABLE - UNSTOPPABLE
// ═══════════════════════════════════════════════════════════════════════════════
