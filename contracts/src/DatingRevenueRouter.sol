// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL DRAFT ROUTER. It is preserved for chain
 *   history / audit context only. The `60% / 30% / 10%` split in this
 *   file is DEPRECATED.
 *
 *   Current doctrine: 1 LLC, 1 Square wallet, 10% per legally distinct
 *   revenue stream as the MAXIMUM ALLOWABLE CORPORATE CHARITABLE
 *   DEDUCTION. The legacy "10% to founder / 30% to DAO / 60% to Shriners"
 *   triple is not the current operating model.
 *
 *   See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy this file. Do NOT cite it as live doctrine.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title DatingRevenueRouter (DEPRECATED)
 * @author FOR THE KIDS Platform — historical draft artifact
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. Not deployed.
 *         Do not deploy. Not current doctrine.
 *
 *      "Until no kid is in need"
 */
contract DatingRevenueRouter {
    using SafeERC20 for IERC20;

    /// @notice USDC on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Basis points (100% = 10000)
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Immutable split percentages (basis points)
    uint256 public constant PCT_CHARITY = 6000;  // 60% → Shriners Children's Hospitals
    uint256 public constant PCT_DAO     = 3000;  // 30% → Mission Infrastructure / AI Operations Treasury
    uint256 public constant PCT_FOUNDER = 1000;  // 10% → Founder Operations

    /// @notice Immutable wallet addresses
    address public immutable charitySafe;    // Shriners
    address public immutable daoTreasury;    // Mission infra + AI ops
    address public immutable founderWallet;  // Ops

    /// @notice Total distributed (for transparency)
    uint256 public totalDistributed;
    uint256 public totalDistributedETH;

    event Distribution(
        address indexed token,
        uint256 totalAmount,
        uint256 charityAmount,
        uint256 daoAmount,
        uint256 founderAmount
    );

    event RouterDeployed(
        address indexed charitySafe,
        address indexed daoTreasury,
        address indexed founderWallet,
        address deployer
    );

    error InvalidAddress();
    error NothingToDistribute();
    error ETHTransferFailed();

    constructor(
        address _charitySafe,
        address _daoTreasury,
        address _founderWallet
    ) {
        if (_charitySafe == address(0)) revert InvalidAddress();
        if (_daoTreasury == address(0)) revert InvalidAddress();
        if (_founderWallet == address(0)) revert InvalidAddress();

        charitySafe = _charitySafe;
        daoTreasury = _daoTreasury;
        founderWallet = _founderWallet;

        emit RouterDeployed(_charitySafe, _daoTreasury, _founderWallet, msg.sender);
    }

    /// @notice Accept ETH deposits
    receive() external payable {}
    fallback() external payable {}

    /// @notice Distribute all USDC held by this contract
    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        _distributeToken(USDC, balance);
    }

    /// @notice Distribute any ERC20 token held by this contract
    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        _distributeToken(token, balance);
    }

    /// @notice Distribute all ETH held by this contract
    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();
        _distributeETH(balance);
    }

    /// @notice Preview how an amount would be split
    function previewSplit(uint256 amount) external pure returns (
        uint256 charityAmt, uint256 daoAmt, uint256 founderAmt
    ) {
        founderAmt = (amount * PCT_FOUNDER) / BASIS_POINTS;
        daoAmt = (amount * PCT_DAO) / BASIS_POINTS;
        charityAmt = amount - founderAmt - daoAmt; // remainder to charity
    }

    /// @notice View pending balances
    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function pendingETH() external view returns (uint256) {
        return address(this).balance;
    }

    function pendingToken(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // --- Internal ---

    function _distributeToken(address token, uint256 total) internal {
        uint256 founderAmt = (total * PCT_FOUNDER) / BASIS_POINTS;
        uint256 daoAmt = (total * PCT_DAO) / BASIS_POINTS;
        uint256 charityAmt = total - founderAmt - daoAmt; // remainder to charity

        IERC20(token).safeTransfer(charitySafe, charityAmt);
        IERC20(token).safeTransfer(daoTreasury, daoAmt);
        IERC20(token).safeTransfer(founderWallet, founderAmt);

        totalDistributed += total;
        emit Distribution(token, total, charityAmt, daoAmt, founderAmt);
    }

    function _distributeETH(uint256 total) internal {
        uint256 founderAmt = (total * PCT_FOUNDER) / BASIS_POINTS;
        uint256 daoAmt = (total * PCT_DAO) / BASIS_POINTS;
        uint256 charityAmt = total - founderAmt - daoAmt;

        (bool s1, ) = charitySafe.call{value: charityAmt}("");
        if (!s1) revert ETHTransferFailed();

        (bool s2, ) = daoTreasury.call{value: daoAmt}("");
        if (!s2) revert ETHTransferFailed();

        (bool s3, ) = founderWallet.call{value: founderAmt}("");
        if (!s3) revert ETHTransferFailed();

        totalDistributedETH += total;
        emit Distribution(address(0), total, charityAmt, daoAmt, founderAmt);
    }
}
