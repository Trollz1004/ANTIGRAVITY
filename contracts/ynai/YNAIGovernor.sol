// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title YNAIGovernor
 * @notice On-chain governance for YouAndINot AI DAO LLC — Base L2 (Chain ID 8453)
 *
 *   Token:               YNAIToken (ERC-20Votes, timestamp clock)
 *   Voting delay:        1 day  (86,400 seconds)   — time between proposal & vote start
 *   Voting period:       7 days (604,800 seconds)  — window for token holders to vote
 *   Proposal threshold:  100,000 YNAI (0.1% of total supply) to submit a proposal
 *   Quorum:              4% of circulating supply at the proposal snapshot
 *   Timelock:            YNAITimelock  (24-hour standard delay)
 *
 *   Clock mode: timestamp (inherited from YNAIToken via GovernorVotes — no override needed)
 *   GovernorVotes.clock() automatically delegates to token().clock().
 *
 *   TREASURY PROPOSALS (significant asset movements):
 *     Route to a second YNAITimelock deployed with MIN_DELAY = 259,200 (72 hours).
 *     This can be enforced in a future upgrade via GovernorTimelockAccess, which
 *     allows per-target timelock routing without a full governor replacement.
 *     TODO: deploy YNAITreasuryTimelock(72hr) and configure GovernorTimelockAccess.
 *
 *   Entity: YouAndINot AI DAO LLC (Wyoming DAO LLC, in formation)
 */
contract YNAIGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Timestamp-based delays (seconds). Base L2 has ~2s blocks; use seconds for precision.
    // Note: GovernorSettings stores votingDelay as uint48 and votingPeriod as uint32.
    uint48  public constant VOTING_DELAY        = 1 days;       // 86,400 s
    uint32  public constant VOTING_PERIOD       = 7 days;       // 604,800 s
    uint256 public constant PROPOSAL_THRESHOLD  = 100_000e18;   // 0.1% of 100M YNAI
    uint256 public constant QUORUM_NUMERATOR    = 4;            // 4% (denominator = 100)

    /**
     * @param _token     YNAIToken proxy address (IVotes)
     * @param _timelock  YNAITimelock address (24hr standard delay)
     */
    constructor(IVotes _token, TimelockController _timelock)
        Governor("YouAndINot AI Governor")
        GovernorSettings(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(QUORUM_NUMERATOR)
        GovernorTimelockControl(_timelock)
    {}

    // ─── Required overrides (resolve OZ diamond inheritance) ─────────────────
    // GovernorVotes already overrides clock() and CLOCK_MODE() to delegate to
    // the token — no additional override needed here.

    function votingDelay()
        public view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 timepoint)
        public view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(timepoint);
    }

    function state(uint256 proposalId)
        public view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
