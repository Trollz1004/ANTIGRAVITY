// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// YNAIVesting — Class A Founder Vesting (51,000,000 YNAI)
// 1-year cliff / 4-year total linear vest | revocable by owner | block.timestamp
// Uses only @openzeppelin/contracts (already installed).
//
// NOTE (STAKING-DOCTRINE-YNAI-2026-08-11): cliff/duration decision is PENDING
// under the sell-aggressive pivot. Values are constructor args — no redeploy
// of this source needed to change them. Do not deploy until Joshua decides.
// ============================================================================

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title YNAIVesting
/// @notice Cliff + linear vesting with owner revocation. OZ VestingWalletCliff
///         does not support revoke(), hence this custom implementation.
/// @dev Flow: deploy → transfer YNAI here → owner calls fund() to lock the
///      allocation → beneficiary (anyone) calls release() over time.
///      revoke(): vested → beneficiary, unvested → owner.
contract YNAIVesting is Ownable {
    using SafeERC20 for IERC20;

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------
    error ZeroAddress();
    error ZeroBalance();
    error AlreadyFunded();
    error AlreadyRevoked();
    error CliffNotReached();
    error NothingToRelease();
    error CliffExceedsDuration();

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------
    event Funded(uint256 totalAllocation);
    event Released(uint256 amount);
    event Revoked(uint256 vestedPaidOut, uint256 unvestedReturned);

    // ------------------------------------------------------------------
    // Immutable schedule
    // ------------------------------------------------------------------
    IERC20 public immutable token;
    /// @notice Founder wallet. TODO: set to Joshua's wallet via deploy script
    ///         (FOUNDER_WALLET from .env — never hardcoded).
    address public immutable beneficiary;
    uint256 public immutable startTime;
    /// @notice e.g. 365 days = 31,536,000 s.
    uint256 public immutable cliffDuration;
    /// @notice e.g. 1460 days = 126,144,000 s (4 years total, incl. cliff).
    uint256 public immutable totalDuration;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    /// @notice Locked once by fund(); 0 until funded.
    uint256 public totalAllocation;
    uint256 public released;
    bool public revoked;

    constructor(
        address _token,
        address _beneficiary,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _totalDuration,
        address _owner
    ) Ownable(_owner) {
        if (_token == address(0) || _beneficiary == address(0)) revert ZeroAddress();
        if (_cliffDuration > _totalDuration) revert CliffExceedsDuration();
        token = IERC20(_token);
        beneficiary = _beneficiary;
        startTime = _startTime;
        cliffDuration = _cliffDuration;
        totalDuration = _totalDuration;
    }

    /// @notice Locks the current token balance as the vesting allocation.
    ///         Transfer YNAI to this contract first, then call fund().
    function fund() external onlyOwner {
        if (totalAllocation != 0) revert AlreadyFunded();
        uint256 bal = token.balanceOf(address(this));
        if (bal == 0) revert ZeroBalance();
        totalAllocation = bal;
        emit Funded(bal);
    }

    /// @notice Releases vested tokens to the beneficiary. Callable by anyone.
    function release() external {
        if (revoked) revert AlreadyRevoked();
        if (block.timestamp < cliffTimestamp()) revert CliffNotReached();
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        emit Released(amount);
        token.safeTransfer(beneficiary, amount);
    }

    /// @notice Revokes vesting: vested-but-unreleased goes to the beneficiary,
    ///         the unvested remainder returns to the owner.
    function revoke() external onlyOwner {
        if (revoked) revert AlreadyRevoked();
        revoked = true;
        uint256 vested = vestedAmount(block.timestamp);
        uint256 toBeneficiary = vested - released;
        uint256 toOwner = token.balanceOf(address(this)) - toBeneficiary;
        released = vested;
        emit Revoked(toBeneficiary, toOwner);
        if (toBeneficiary > 0) token.safeTransfer(beneficiary, toBeneficiary);
        if (toOwner > 0) token.safeTransfer(owner(), toOwner);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    /// @notice Linear vesting from startTime; 0 before the cliff.
    ///         Matches OZ VestingWallet interpolation math.
    function vestedAmount(uint256 timestamp) public view returns (uint256) {
        if (timestamp < cliffTimestamp()) return 0;
        if (timestamp >= startTime + totalDuration) return totalAllocation;
        return (totalAllocation * (timestamp - startTime)) / totalDuration;
    }

    function releasable() public view returns (uint256) {
        return vestedAmount(block.timestamp) - released;
    }

    function cliffTimestamp() public view returns (uint256) {
        return startTime + cliffDuration;
    }

    function endTimestamp() public view returns (uint256) {
        return startTime + totalDuration;
    }
}
