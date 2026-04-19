// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MissionTreasury
 * @notice Master treasury for kids support reserves across all platform DAOs.
 *
 *         Receives 10% from each PlatformSplitter10 bucket.
 *         Holds funds until verified disbursement event.
 *         After founder death (confirmed by DeadManSwitch + Gnosis Safe 3-of-5),
 *         ownership transfers to mission governance — Founding Four + DAO token holders.
 *
 *         MISSION SCOPE (per founder directive §12.6, 2026-04-19):
 *         NOT limited to medical needs. Covers ALL child welfare categories:
 *         medical/health, hunger/food security, education/school supplies,
 *         children in war zones, foster care, housing/shelter, mental health,
 *         and any other unmet child need. If a kid needs it, it's in scope.
 *
 *         State A (alive):  Josh controls disbursements
 *         State B (dead):   Gnosis Safe 3-of-5 controls disbursements
 *
 *         No human board. No 501(c)(3). No nonprofit. Perpetual mission DAO.
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
    mapping(string => uint256) public bucketDisbursed;

    // Approved disbursement targets (kids orgs, direct recipients)
    mapping(address => string) public approvedRecipients; // address → name
    mapping(address => bool) public isApproved;

    struct Disbursement {
        address recipient;
        uint256 amount;
        string bucketId;
        string purpose;
        uint256 timestamp;
    }
    Disbursement[] public disbursements;

    event FundsReceived(address indexed from, uint256 amount, string bucketId);
    event Disbursed(address indexed recipient, uint256 amount, string bucketId, string purpose);
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

    // Disburse to approved recipient (Josh in State A, Gnosis Safe in State B)
    function disburse(
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
        bucketDisbursed[bucketId] += amount;

        disbursements.push(Disbursement({
            recipient: recipient,
            amount: amount,
            bucketId: bucketId,
            purpose: purpose,
            timestamp: block.timestamp
        }));

        emit Disbursed(recipient, amount, bucketId, purpose);
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

    function disbursementCount() external view returns (uint256) {
        return disbursements.length;
    }

    function getDisbursement(uint256 index) external view returns (Disbursement memory) {
        return disbursements[index];
    }
}
