// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL DRAFT. The `10 / 27 / 63` triple split
 *   and the "30% tax on 90% operating share" framing are DEPRECATED.
 *
 *   Current doctrine: 1 LLC, 1 Square wallet, 10% per legally distinct
 *   revenue stream as the MAXIMUM ALLOWABLE CORPORATE 
 *   DEDUCTION. The triple-split was an early on-chain experiment and is
 *   not the current model. Tax handling is a separate problem, not
 *   bundled into a smart contract split.
 *
 *   See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy this file. Do NOT cite it as live doctrine.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title PlatformSplitter (DEPRECATED)
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. The 10/27/63
 *         triple split is not current doctrine. Do not deploy.
 *
 *         10% → MissionReserve  (contractual revenue payout — youth initiatives)
 *         27% → TaxWallet       (covers 30% tax on the 90% operating share)
 *         63% → DAOTreasury     (operations, sinking fund, then staking surplus)
 *
 *         Deployed once per DAO. No owner. No admin. No upgrades.
 *         The split ratios are in the bytecode — no human can change them.
 *
 *         "Until no kid is in need" — Joshua Coleman, Founder
 */
contract PlatformSplitter {
    using SafeERC20 for IERC20;

    // --- Immutable addresses (set at deploy, never change) ---
    address public immutable missionReserve;
    address public immutable taxWallet;
    address public immutable daoTreasury;

    // USDC on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // Split ratios in basis points — immutable in bytecode
    uint256 public constant MISSION_BPS  = 1000;  // 10%
    uint256 public constant TAX_BPS      = 2700;  // 27%
    uint256 public constant OPS_BPS      = 6300;  // 63%
    uint256 public constant TOTAL_BPS    = 10000;

    // --- Pull balances (packed into single slots where possible) ---
    uint128 public missionPending;
    uint128 public taxPending;
    uint128 public opsPending;
    uint128 private _padding; // storage packing alignment

    // --- Cumulative accounting ---
    uint256 public totalProcessed;

    // DAO identifier
    bytes32 public immutable daoId;

    // --- Events ---
    event Deposited(address indexed token, uint256 amount, bytes32 indexed daoId);
    event Withdrawn(address indexed recipient, address indexed token, uint256 amount);

    // --- Custom errors (cheaper than require strings) ---
    error ZeroAddress();
    error NothingToDeposit();
    error NothingToWithdraw();
    error Unauthorized();

    constructor(
        address _missionReserve,
        address _taxWallet,
        address _daoTreasury,
        bytes32 _daoId
    ) {
        if (_missionReserve == address(0)) revert ZeroAddress();
        if (_taxWallet == address(0)) revert ZeroAddress();
        if (_daoTreasury == address(0)) revert ZeroAddress();

        missionReserve = _missionReserve;
        taxWallet = _taxWallet;
        daoTreasury = _daoTreasury;
        daoId = _daoId;
    }

    /// @notice Deposit and split any USDC sitting in this contract.
    function deposit() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDeposit();
        _deposit(balance);
    }

    /// @notice Deposit and split a specific ERC20 token.
    function depositToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDeposit();
        _depositToken(token, balance);
    }

    /// @notice  withdraws its accumulated share.
    function withdrawMission() external {
        if (msg.sender != missionReserve) revert Unauthorized();
        uint128 amount = missionPending;
        if (amount == 0) revert NothingToWithdraw();
        missionPending = 0;
        IERC20(USDC).safeTransfer(missionReserve, amount);
        emit Withdrawn(missionReserve, USDC, amount);
    }

    /// @notice Tax wallet withdraws its accumulated share.
    function withdrawTax() external {
        if (msg.sender != taxWallet) revert Unauthorized();
        uint128 amount = taxPending;
        if (amount == 0) revert NothingToWithdraw();
        taxPending = 0;
        IERC20(USDC).safeTransfer(taxWallet, amount);
        emit Withdrawn(taxWallet, USDC, amount);
    }

    /// @notice DAO treasury withdraws its accumulated share.
    function withdrawOps() external {
        if (msg.sender != daoTreasury) revert Unauthorized();
        uint128 amount = opsPending;
        if (amount == 0) revert NothingToWithdraw();
        opsPending = 0;
        IERC20(USDC).safeTransfer(daoTreasury, amount);
        emit Withdrawn(daoTreasury, USDC, amount);
    }

    /// @notice Preview the three-way split for a given amount.
    function previewSplit(uint256 amount) external pure returns (
        uint256 mission,
        uint256 tax,
        uint256 ops
    ) {
        mission = (amount * MISSION_BPS) / TOTAL_BPS;
        tax = (amount * TAX_BPS) / TOTAL_BPS;
        ops = amount - mission - tax; // remainder avoids rounding loss
    }

    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    // --- Internal ---

    function _deposit(uint256 total) internal {
        uint128 missionAmt = uint128((total * MISSION_BPS) / TOTAL_BPS);
        uint128 taxAmt     = uint128((total * TAX_BPS) / TOTAL_BPS);
        uint128 opsAmt     = uint128(total - missionAmt - taxAmt);

        // Accumulate pull balances — single SSTORE per slot
        missionPending += missionAmt;
        taxPending     += taxAmt;
        opsPending     += opsAmt;

        totalProcessed += total;

        emit Deposited(USDC, total, daoId);
    }

    function _depositToken(address token, uint256 total) internal {
        uint256 missionAmt = (total * MISSION_BPS) / TOTAL_BPS;
        uint256 taxAmt     = (total * TAX_BPS) / TOTAL_BPS;
        uint256 opsAmt     = total - missionAmt - taxAmt;

        // For non-USDC tokens: push immediately (no pull accounting)
        IERC20(token).safeTransfer(missionReserve, missionAmt);
        IERC20(token).safeTransfer(taxWallet, taxAmt);
        IERC20(token).safeTransfer(daoTreasury, opsAmt);

        totalProcessed += total;

        emit Deposited(token, total, daoId);
    }
}
