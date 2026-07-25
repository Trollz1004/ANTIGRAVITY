// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL DRAFT. The on-chain treasury pattern, the
 *   "DeadManSwitch + Gnosis Safe 3-of-5" framing, the "perpetual mission
 *   DAO" framing, and the "no 501(c)(3)" framing here are DEPRECATED.
 *
 *   Current doctrine: 1 LLC, 1 Square wallet, 10% per legally distinct
 *   revenue stream as the MAXIMUM ALLOWABLE CORPORATE 
 *   DEDUCTION. The corporate  deduction is claimed on the
 *   LLC's tax return, not routed through an on-chain multisig treasury.
 *
 *   See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy this file. The on-chain treasury model is not the
 *   current operating path.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title MissionTreasury (DEPRECATED)
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. The on-chain
 *         treasury + dead-man-switch + Gnosis Safe pattern is not the
 *         current operating doctrine. Do not deploy.
 *
 *         Receives 10% from each PlatformSplitter10 bucket.
 *         Holds funds until verified payout event.
 *         After founder death (confirmed by DeadManSwitch + Gnosis Safe 3-of-5),
 *         ownership transfers to mission governance — Founding Four + DAO token holders.
 *
 *         MISSION SCOPE (per founder directive §12.6, 2026-04-19):
 *         NOT limited to medical needs. Covers ALL child welfare categories:
 *         medical/health, hunger/food security, education/school supplies,
 *         children in war zones, foster care, housing/shelter, mental health,
 *         and any other unmet child need. If a kid needs it, it's in scope.
 *
 *         State A (alive):  Josh controls payouts
 *         State B (dead):   Gnosis Safe 3-of-5 controls payouts
 *
 *         No human board. No 501(c)(3). No for-profit. Perpetual mission DAO.
 *
 *         "Until no kid is in need" — Joshua Coleman
 */
contract MissionTreasury is Ownable {
    using SafeERC20 for IERC20;

    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    address public immutable deadManSwitch;
    address public immutable gnosisSafe; // Takes ownership on State B

    bool public stateBActive;

    // Per-bucket accounting
    mapping(string => uint256) public bucketReceived;
    mapping(string => uint256) public bucketpayout;

    // Approved payout targets (kids orgs, direct recipients)
    mapping(address => string) public approvedRecipients; // address → name
    mapping(address => bool) public isApproved;

    struct payout {
        address recipient;
        uint256 amount;
        string bucketId;
        string purpose;
        uint256 timestamp;
    }
    payout[] public payouts;

    event FundsReceived(address indexed from, uint256 amount, string bucketId);
    event payout(address indexed recipient, uint256 amount, string bucketId, string purpose);
    event RecipientApproved(address indexed recipient, string name);
    event RecipientRevoked(address indexed recipient);
    event StateBActivated(bytes32 certificateHash, uint256 timestamp);

    error OnlyDeadManSwitch();
    error AlreadyStateB();
    error NotApproved();
    error InsufficientFunds();
    error ZeroAddress();
    error ZeroAmount();

    modifier onlyDeadManSwitch() {
        if (msg.sender != deadManSwitch) revert OnlyDeadManSwitch();
        _;
    }

    constructor(address _deadManSwitch, address _gnosisSafe, address _founder)
        Ownable(_founder)
    {
        if (_deadManSwitch == address(0)) revert ZeroAddress();
        if (_gnosisSafe == address(0)) revert ZeroAddress();
        deadManSwitch = _deadManSwitch;
        gnosisSafe = _gnosisSafe;
    }

    // Accept USDC deposits from PlatformSplitter10 contracts
    // Call after transferring USDC to record which bucket it came from
    function recordDeposit(uint256 amount, string calldata bucketId) external {
        bucketReceived[bucketId] += amount;
        emit FundsReceived(msg.sender, amount, bucketId);
    }

    // payout to approved recipient (Josh in State A, Gnosis Safe in State B)
    function payout(
        address recipient,
        uint256 amount,
        string calldata bucketId,
        string calldata purpose
    ) external onlyOwner {
        if (!isApproved[recipient]) revert NotApproved();
        if (amount == 0) revert ZeroAmount();

        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (amount > balance) revert InsufficientFunds();

        IERC20(USDC).safeTransfer(recipient, amount);
        bucketpayout[bucketId] += amount;

        payouts.push(payout({
            recipient: recipient,
            amount: amount,
            bucketId: bucketId,
            purpose: purpose,
            timestamp: block.timestamp
        }));

        emit payout(recipient, amount, bucketId, purpose);
    }

    // Called by DeadManSwitch when Gnosis Safe 3-of-5 confirms founder death
    // Ownership transfers to Gnosis Safe — irreversible
    function activateStateB(bytes32 certificateHash) external onlyDeadManSwitch {
        if (stateBActive) revert AlreadyStateB();
        stateBActive = true;
        _transferOwnership(gnosisSafe);
        emit StateBActivated(certificateHash, block.timestamp);
    }

    function approveRecipient(address recipient, string calldata name) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        isApproved[recipient] = true;
        approvedRecipients[recipient] = name;
        emit RecipientApproved(recipient, name);
    }

    function revokeRecipient(address recipient) external onlyOwner {
        isApproved[recipient] = false;
        emit RecipientRevoked(recipient);
    }

    // Read-only stats
    function totalBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function payoutCount() external view returns (uint256) {
        return payouts.length;
    }

    function getpayout(uint256 index) external view returns (payout memory) {
        return payouts[index];
    }
}
