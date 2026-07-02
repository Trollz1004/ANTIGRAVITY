// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YNAIVesting
 * @notice Linear vesting with cliff for 51,000,000 Class A YNAI founder tokens.
 *
 *   Allocation:    51,000,000 YNAI  (CLASS_A_FOUNDER constant in YNAIToken)
 *   Cliff:         1 year  (365 days from startTime)
 *   Total duration: 4 years (1,460 days from startTime, linear after cliff)
 *   Beneficiary:   Joshua Coleman's wallet
 *                  TODO: replace address(0) with Joshua's wallet before deploy
 *   Revocable:     Yes — owner may revoke before fully vested.
 *                  On revoke: vested tokens → beneficiary | unvested → owner
 *
 *   Uses block.timestamp throughout. Not upgradeable (deployed once, fixed terms).
 *
 * @dev NOTE: OZ's VestingWalletCliff (v5) does not support revocability.
 *      This contract implements the same linear-after-cliff schedule with
 *      an explicit revoke() function owned by the deployer (Joshua).
 *      Imports only @openzeppelin/contracts (already installed).
 *
 *   Deploy order:
 *     1. Deploy YNAIToken (proxy)
 *     2. Deploy this contract
 *     3. Transfer 51,000,000 YNAI from deployer to this contract's address
 *     4. Call fund() to lock in the allocation
 */
contract YNAIVesting is Ownable {
    using SafeERC20 for IERC20;

    // ─── Immutables ──────────────────────────────────────────────────────────
    IERC20  public immutable token;
    address public immutable beneficiary;
    uint256 public immutable startTime;
    uint256 public immutable cliffDuration;  // seconds; default 365 days
    uint256 public immutable totalDuration;  // seconds; default 1460 days (4yr)

    // ─── State ───────────────────────────────────────────────────────────────
    uint256 public totalAllocation;  // set once on fund(); never mutated after
    uint256 public released;         // cumulative tokens released to beneficiary
    bool    public revoked;

    // ─── Events ──────────────────────────────────────────────────────────────
    event Funded(uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Revoked(uint256 tobeneficiary, uint256 toOwner);

    // ─── Custom errors ───────────────────────────────────────────────────────
    error AlreadyRevoked();
    error AlreadyFunded();
    error CliffNotReached();
    error NothingToRelease();
    error ZeroAddress();
    error ZeroBalance();
    error CliffExceedsDuration();

    /**
     * @param _token          Address of YNAIToken proxy
     * @param _beneficiary    Vesting recipient — Joshua's wallet
     *                        TODO: replace address(0) with Joshua's actual wallet before deploy
     * @param _startTime      Unix timestamp when vesting clock begins (pass block.timestamp at deploy)
     * @param _cliffDuration  Seconds until cliff (365 days = 31_536_000)
     * @param _totalDuration  Total vest seconds (1460 days = 126_144_000, i.e. 4 years)
     * @param _owner          Owner who can revoke — Joshua's wallet
     *                        TODO: replace address(0) with Joshua's actual wallet before deploy
     */
    constructor(
        address _token,
        address _beneficiary,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _totalDuration,
        address _owner
    ) Ownable(_owner) {
        if (_token       == address(0)) revert ZeroAddress();
        if (_beneficiary == address(0)) revert ZeroAddress();
        if (_cliffDuration > _totalDuration) revert CliffExceedsDuration();

        token         = IERC20(_token);
        beneficiary   = _beneficiary;
        startTime     = _startTime;
        cliffDuration = _cliffDuration;
        totalDuration = _totalDuration;
    }

    // ─── Fund ─────────────────────────────────────────────────────────────────
    /**
     * @notice Lock in the allocation. Transfer YNAI to this address first, then call fund().
     *         Can only be called once. The YNAI balance at call time becomes totalAllocation.
     */
    function fund() external onlyOwner {
        if (totalAllocation != 0) revert AlreadyFunded();
        uint256 balance = token.balanceOf(address(this));
        if (balance == 0) revert ZeroBalance();
        totalAllocation = balance;
        emit Funded(balance);
    }

    // ─── Release ──────────────────────────────────────────────────────────────
    /**
     * @notice Release all currently vested (but unreleased) tokens to beneficiary.
     *         Anyone may call; tokens always go to beneficiary address.
     *         Reverts before cliff, or if nothing is available to release.
     */
    function release() external {
        if (revoked)                                            revert AlreadyRevoked();
        if (block.timestamp < startTime + cliffDuration)       revert CliffNotReached();

        uint256 vested     = vestedAmount(block.timestamp);
        uint256 releasable = vested - released;
        if (releasable == 0) revert NothingToRelease();

        released += releasable;
        token.safeTransfer(beneficiary, releasable);
        emit Released(beneficiary, releasable);
    }

    // ─── Revoke ───────────────────────────────────────────────────────────────
    /**
     * @notice Owner (Joshua) revokes the vesting schedule.
     *         Any vested-but-unreleased tokens go to beneficiary immediately.
     *         All unvested tokens return to owner.
     *         Can only be called once; subsequent release() calls revert.
     */
    function revoke() external onlyOwner {
        if (revoked) revert AlreadyRevoked();
        revoked = true;

        uint256 vested         = vestedAmount(block.timestamp);
        uint256 tobeneficiary  = vested - released;
        uint256 toOwner        = totalAllocation - vested;

        released += tobeneficiary;

        if (tobeneficiary > 0) token.safeTransfer(beneficiary, tobeneficiary);
        if (toOwner       > 0) token.safeTransfer(owner(), toOwner);

        emit Revoked(tobeneficiary, toOwner);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /**
     * @notice Linear vesting schedule with cliff.
     *         Returns 0 before cliff. Returns totalAllocation after totalDuration.
     *         Between cliff and end: linear proportion of time elapsed.
     * @param timestamp  Unix timestamp to evaluate vested amount at
     */
    function vestedAmount(uint256 timestamp) public view returns (uint256) {
        if (totalAllocation == 0)                    return 0;
        if (timestamp < startTime + cliffDuration)   return 0;
        if (timestamp >= startTime + totalDuration)  return totalAllocation;
        // Linear interpolation from startTime (not from cliff) — matches OZ VestingWallet
        return (totalAllocation * (timestamp - startTime)) / totalDuration;
    }

    /**
     * @notice Tokens currently available to release (vested minus already released).
     *         Returns 0 if revoked or cliff not yet reached.
     */
    function releasable() external view returns (uint256) {
        if (revoked)                                         return 0;
        if (block.timestamp < startTime + cliffDuration)    return 0;
        uint256 vested = vestedAmount(block.timestamp);
        return vested > released ? vested - released : 0;
    }

    /**
     * @notice Unix timestamp when cliff unlocks.
     */
    function cliffTimestamp() external view returns (uint256) {
        return startTime + cliffDuration;
    }

    /**
     * @notice Unix timestamp when full allocation is vested.
     */
    function endTimestamp() external view returns (uint256) {
        return startTime + totalDuration;
    }
}
