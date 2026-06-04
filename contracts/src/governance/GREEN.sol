// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title GREEN — OnlineRecycle Governance Token ($GREEN)
 * @notice Soulbound. Earned by: listing volume, referrals, completed sales, e-waste intake.
 *         Voting on: intake workflow, listing categories, fee structure.
 *         ENIGMA surface ONLY — never shares governance with $LOVE or $UKID.
 *         Max supply: 2,500,000 per DAO tokenomics.
 *         Non-transferable. Earn-only.
 */
contract GREEN is SoulboundToken {
    uint256 public constant DAO_SUPPLY = 2_500_000;

    uint256 public constant WEIGHT_FIRST_LISTING     = 2;
    uint256 public constant WEIGHT_COMPLETED_SALE    = 5;
    uint256 public constant WEIGHT_REFERRAL          = 3;
    uint256 public constant WEIGHT_VOLUME_MILESTONE  = 15;
    uint256 public constant WEIGHT_EWASTE_INTAKE     = 8;

    constructor(address founder) SoulboundToken("OnlineRecycle Governance", "GREEN", founder, DAO_SUPPLY) {}

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
