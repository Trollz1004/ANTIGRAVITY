// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// YNAIGovernor — On-chain governance for YouAndINot AI DAO LLC
// Base L2 (Chain ID: 8453) | OZ Governor v5 | timestamp clock via token
// 1-day delay | 7-day period | 100K YNAI threshold | 4% quorum | timelocked
// ============================================================================

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/// @title YNAIGovernor
/// @notice Governance for YNAI token holders. Proposals execute through the
///         YNAITimelock (24h routine / 72h treasury instance).
/// @dev clock()/CLOCK_MODE() are NOT overridden here — GovernorVotes
///      auto-delegates the clock to the token (timestamp mode on Base L2).
contract YNAIGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /// @notice Delay between proposal creation and voting start (seconds).
    uint48 public constant VOTING_DELAY = 1 days; // 86,400 s
    /// @notice Voting window length (seconds).
    uint32 public constant VOTING_PERIOD = 7 days; // 604,800 s
    /// @notice Minimum YNAI to submit a proposal (0.1% of supply).
    uint256 public constant PROPOSAL_THRESHOLD = 100_000e18;
    /// @notice Quorum: 4% of total supply must participate.
    uint256 public constant QUORUM_NUMERATOR = 4;

    constructor(IVotes _token, TimelockController _timelock)
        Governor("YouAndINot AI Governor")
        GovernorSettings(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(QUORUM_NUMERATOR)
        GovernorTimelockControl(_timelock)
    {}

    // ------------------------------------------------------------------
    // Required overrides (diamond inheritance, OZ v5)
    // ------------------------------------------------------------------

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 timepoint)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(timepoint);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
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
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
