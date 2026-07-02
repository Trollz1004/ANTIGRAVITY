// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title YNAITimelock
 * @notice Standard 24-hour timelock for YNAI governance proposals.
 *         All successful governor proposals must pass through this delay
 *         before execution, giving token holders time to respond to decisions.
 *
 *   Min delay (standard):  86,400 seconds  (24 hours)
 *   Min delay (treasury):  259,200 seconds (72 hours) — see YNAITreasuryTimelock TODO below
 *   Proposers:  [governor address]   — set in deploy script post-construction
 *   Cancellers: [governor address]   — set in deploy script post-construction
 *   Executors:  [address(0)]         — open execution; anyone may trigger after delay
 *   Admin:      deployer (Joshua)    — should renounce DEFAULT_ADMIN_ROLE after wiring
 *
 *   TREASURY PROPOSALS:
 *     Deploy a second instance of this contract with MIN_DELAY_TREASURY (72hr) for
 *     proposals that move significant assets. Configure YNAIGovernor to route
 *     treasury calls to that second timelock via GovernorTimelockAccess.
 *     TODO: deploy YNAITreasuryTimelock and wire routing in governor upgrade.
 *
 *   BOOTSTRAP SEQUENCE (deploy script):
 *     1. Deploy YNAITimelock([], [], DEPLOYER_WALLET)
 *     2. Deploy YNAIGovernor(token, timelock)
 *     3. timelock.grantRole(PROPOSER_ROLE, address(governor))
 *     4. timelock.grantRole(CANCELLER_ROLE, address(governor))
 *     5. timelock.renounceRole(DEFAULT_ADMIN_ROLE, DEPLOYER_WALLET)
 *
 *   Chain: Base L2 (Chain ID 8453)
 */
contract YNAITimelock is TimelockController {
    /// @notice Standard timelock delay: 24 hours
    uint256 public constant MIN_DELAY = 86_400;

    /// @notice Treasury timelock delay: 72 hours (for a second instance)
    uint256 public constant MIN_DELAY_TREASURY = 259_200;

    /**
     * @param proposers   Addresses that may schedule operations (pass [] at deploy;
     *                    grant PROPOSER_ROLE to governor in deploy script)
     * @param executors   Pass [address(0)] for open execution after delay
     * @param admin       Bootstrap admin — Joshua's wallet
     *                    TODO: replace address(0) with Joshua's wallet in deploy script.
     *                    After wiring, call renounceRole(DEFAULT_ADMIN_ROLE, admin).
     */
    constructor(
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(MIN_DELAY, proposers, executors, admin) {}
}
