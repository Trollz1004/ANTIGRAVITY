// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title AISO — HISTORICAL ARTIFACT (superseded by UKID.sol)
 * @notice Replaced by governance/UKID.sol in the 4-DAO finalization (2026-04-26).
 *         Do NOT deploy. Kept for audit trail only.
 */
contract AISO is SoulboundToken {
    uint256 public constant WEIGHT_PRODUCT_PURCHASE  = 5;
    uint256 public constant WEIGHT_REFERRAL          = 3;
    uint256 public constant WEIGHT_USAGE_MILESTONE   = 8;
    uint256 public constant WEIGHT_POWER_USER        = 20;

    constructor(address founder) SoulboundToken("AI-Solutions Governance", "AISO", founder, 2_500_000) {}

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
