// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title RECYCLE — HISTORICAL ARTIFACT (superseded by GREEN.sol)
 * @notice Replaced by governance/GREEN.sol in the 4-DAO finalization (2026-04-26).
 *         Do NOT deploy. Kept for audit trail only.
 */
contract RECYCLE is SoulboundToken {
    uint256 public constant WEIGHT_FIRST_LISTING     = 2;
    uint256 public constant WEIGHT_COMPLETED_SALE    = 5;
    uint256 public constant WEIGHT_REFERRAL          = 3;
    uint256 public constant WEIGHT_VOLUME_MILESTONE  = 15;
    uint256 public constant WEIGHT_EWASTE_INTAKE     = 8;

    constructor(address founder) SoulboundToken("OnlineRecycle Governance", "RECYCLE", founder, 2_500_000) {}

    function mintFirstListing(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_FIRST_LISTING, "FirstListing");
    }

    function mintCompletedSale(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_COMPLETED_SALE, "CompletedSale");
    }

    function mintReferral(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_REFERRAL, "Referral");
    }

    function mintVolumeMilestone(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_VOLUME_MILESTONE, "VolumeMilestone");
    }

    function mintEwasteIntake(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_EWASTE_INTAKE, "EwasteIntake");
    }
}
