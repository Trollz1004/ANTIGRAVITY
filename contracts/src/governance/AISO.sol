// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title AISO — AI-Solutions Governance Token
 * @notice Soulbound. Earned by: product purchases, referrals, usage milestones.
 *         Voting on: product roadmap, tool prioritization, treasury allocation.
 *         OMEGA surface ONLY — never shares governance with YANAI or RECYCLE.
 *         Non-transferable. Earn-only.
 */
contract AISO is SoulboundToken {
    uint256 public constant WEIGHT_PRODUCT_PURCHASE  = 5;
    uint256 public constant WEIGHT_REFERRAL          = 3;
    uint256 public constant WEIGHT_USAGE_MILESTONE   = 8;
    uint256 public constant WEIGHT_POWER_USER        = 20;

    constructor(address founder) SoulboundToken("AI-Solutions Governance", "AISO", founder) {}

    function mintProductPurchase(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_PRODUCT_PURCHASE, "ProductPurchase");
    }

    function mintReferral(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_REFERRAL, "Referral");
    }

    function mintUsageMilestone(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_USAGE_MILESTONE, "UsageMilestone");
    }

    function mintPowerUser(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_POWER_USER, "PowerUser");
    }
}
