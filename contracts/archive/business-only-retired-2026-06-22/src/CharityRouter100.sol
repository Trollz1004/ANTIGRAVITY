// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL DRAFT ARTIFACT. It is not deployed to a live
 *   network and is preserved for chain-history / audit reference only.
 *
 *   "100% " framing and the named-beneficiary payment routing in
 *   this file are DEPRECATED. Current doctrine: 1 LLC, 1 Square wallet,
 *   10% per legally distinct revenue stream as the MAXIMUM ALLOWABLE
 *   CORPORATE  DEDUCTION.
 *
 *   See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and the canonical
 *   revenue model file:
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy this file. Do NOT cite it as live doctrine.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title Router100 (DEPRECATED)
 * @author  Platform — historical draft artifact
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. Not deployed.
 *         Do not deploy. Not current doctrine.
 *
 *      "Until no kid is in need"
 */
contract Router100 {
    using SafeERC20 for IERC20;

    /// @notice The immutable address where all funds are forwarded
    address public immutable _SAFE;

    /// @notice USDC token address on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Emitted when funds are distributed to 
    event Distribution(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted on contract deployment for transparency
    event RouterDeployed(
        address indexed Safe,
        address indexed deployer
    );

    error InvalidSafe();
    error NothingToDistribute();
    error ETHTransferFailed();

    constructor(address _Safe) {
        if (_Safe == address(0)) revert InvalidSafe();
        _SAFE = _Safe;
        emit RouterDeployed(_Safe, msg.sender);
    }

    receive() external payable {
        _forwardETH();
    }

    fallback() external payable {
        if (msg.value > 0) {
            _forwardETH();
        }
    }

    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        IERC20(USDC).safeTransfer(_SAFE, balance);
        emit Distribution(USDC, balance, _SAFE);
    }

    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        IERC20(token).safeTransfer(_SAFE, balance);
        emit Distribution(token, balance, _SAFE);
    }

    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();
        _forwardETH();
    }

    function getAddress() external view returns (address) {
        return _SAFE;
    }

    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function pendingToken(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function pendingETH() external view returns (uint256) {
        return address(this).balance;
    }

    function _forwardETH() internal {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        (bool success, ) = _SAFE.call{value: balance}("");
        if (!success) revert ETHTransferFailed();
        emit Distribution(address(0), balance, _SAFE);
    }
}
