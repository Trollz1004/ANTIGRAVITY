// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// YNAITimelock — Governance execution delay for YouAndINot AI DAO LLC
// Base L2 (Chain ID: 8453) | OZ TimelockController | 24h minimum delay
// ============================================================================

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title YNAITimelock
/// @notice 24-hour minimum delay on all governance executions. The DAO
///         treasury (49M Class B YNAI) is held here after deployment.
/// @dev Deploy wiring (see scripts/deploy-ynai.js):
///      - proposers: [] at deploy → grant PROPOSER_ROLE + CANCELLER_ROLE to
///        YNAIGovernor after it exists.
///      - executors: [address(0)] → anyone may execute a queued, ready op.
///      - admin: deployer, ONLY for wiring → renounce DEFAULT_ADMIN_ROLE last.
///
///      Treasury-class proposals (72h) — per Operating Agreement §4.3 the
///      treasury lane uses a longer delay. Deploy a SECOND instance of this
///      contract with MIN_DELAY_TREASURY for that lane, or route category
///      delays via a future GovernorTimelockAccess upgrade. Reference only:
contract YNAITimelock is TimelockController {
    /// @notice 24 hours — minimum delay for routine governance execution.
    uint256 public constant MIN_DELAY = 86_400;
    /// @notice 72 hours — reference constant for the treasury timelock instance.
    uint256 public constant MIN_DELAY_TREASURY = 259_200;

    constructor(address[] memory proposers, address[] memory executors, address admin)
        TimelockController(MIN_DELAY, proposers, executors, admin)
    {}
}
