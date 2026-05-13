// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReentrancyAttacker
 * @notice Test-only contract used to verify that CharityRouter100's ETH
 *         forwarding path cannot be exploited by a malicious recipient.
 *
 *         Because CharityRouter100 has an immutable CHARITY_SAFE, this
 *         contract can never become the recipient — the test uses it to
 *         confirm that ETH goes only to the legitimate charity safe and
 *         that a would-be attacker receives nothing.
 *
 *         Never deploy to production.
 */
contract ReentrancyAttacker {
    address public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = _target;
    }

    /// @dev Attempt reentrant call on receive — will be a no-op since
    ///      CHARITY_SAFE is immutable and points elsewhere.
    receive() external payable {
        attackCount++;
        if (attackCount < 3) {
            // Attempt to trigger another distribution — will fail or be irrelevant
            // because this contract can never be CHARITY_SAFE
            (bool success, ) = target.call(abi.encodeWithSignature("distributeETH()"));
            // Intentionally ignore success — test only cares that attacker gets nothing
            (success);
        }
    }
}
