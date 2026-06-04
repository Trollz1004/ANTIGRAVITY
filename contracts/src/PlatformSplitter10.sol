// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* ═══════════════════════════════════════════════════════════════════════════
 *   DEPRECATION NOTICE — 2026-06-01
 *   ──────────────────────────────────────────────────────────────────────
 *   This file is a HISTORICAL DRAFT. The "10% → MissionTreasury,
 *   90% → Josh's LLC taxable income" framing here is DEPRECATED.
 *
 *   The 10% is still the right number, but the correct framing is: the
 *   10% is the MAXIMUM ALLOWABLE CORPORATE CHARITABLE DEDUCTION per
 *   legally distinct revenue stream. It is NOT "Josh's LLC taxable
 *   income". All merchant receipts are LLC taxable income; the 10% is
 *   the deduction the LLC can claim against that income for the kids'
 *   mission. The remaining 90% is operating capital, not personal income.
 *
 *   See briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md and
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md
 *
 *   Do NOT deploy this file as-is. The split ratio may be right but the
 *   framing in the comment block is wrong. Any future deployment must
 *   update the contract to match the corrected doctrine.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @title PlatformSplitter10 (DEPRECATED — framing corrected 2026-06-01)
 * @notice HISTORICAL ARTIFACT — see deprecation notice above. The 10/90
 *         ratio remains conceptually correct, but the framing in the
 *         source is wrong. Do not deploy as-is. Do not cite as live
 *         doctrine.
 *
 *         Deployed once per revenue bucket. No owner. No admin. No upgrades.
 *         The 10% is in the bytecode — no human can change it after deployment.
 *
 *         "Until no kid is in need" — Joshua Coleman, Founder
 */
contract PlatformSplitter10 {
    using SafeERC20 for IERC20;

    address public immutable missionTreasury;
    address public immutable operatingWallet;

    // USDC on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // 10% mission, 90% operating — immutable in bytecode
    uint256 public constant MISSION_BPS = 1000;
    uint256 public constant BASIS_POINTS = 10000;

    // Identifies which revenue bucket this splitter serves
    string public bucketId;
    string public platformName;

    uint256 public totalProcessed;
    uint256 public totalToMission;

    event Split(
        address indexed token,
        uint256 totalAmount,
        uint256 missionAmount,
        uint256 operatingAmount,
        string bucketId
    );

    error ZeroAddress();
    error NothingToSplit();

    constructor(
        address _missionTreasury,
        address _operatingWallet,
        string memory _bucketId,
        string memory _platformName
    ) {
        if (_missionTreasury == address(0)) revert ZeroAddress();
        if (_operatingWallet == address(0)) revert ZeroAddress();

        missionTreasury = _missionTreasury;
        operatingWallet = _operatingWallet;
        bucketId = _bucketId;
        platformName = _platformName;
    }

    receive() external payable {}

    function splitUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToSplit();
        _split(USDC, balance);
    }

    function splitToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToSplit();
        _split(token, balance);
    }

    function previewSplit(uint256 amount) external pure returns (uint256 mission, uint256 operating) {
        mission = (amount * MISSION_BPS) / BASIS_POINTS;
        operating = amount - mission;
    }

    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function _split(address token, uint256 total) internal {
        uint256 missionAmt = (total * MISSION_BPS) / BASIS_POINTS;
        uint256 operatingAmt = total - missionAmt; // remainder — no rounding loss

        IERC20(token).safeTransfer(missionTreasury, missionAmt);
        IERC20(token).safeTransfer(operatingWallet, operatingAmt);

        totalProcessed += total;
        totalToMission += missionAmt;

        emit Split(token, total, missionAmt, operatingAmt, bucketId);
    }
}
