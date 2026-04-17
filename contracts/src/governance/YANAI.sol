// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title YANAI — YouAndINotAI Governance Token
 * @notice Soulbound. Earned by: Bot-Shield verification, membership tiers, super likes activity.
 *         Voting on: feature proposals, super likes pool allocation.
 *         No token sale. Earn-only. Non-transferable.
 *
 *         Voting weight tiers (from DAO-ARCHITECTURE-CANONICAL.md):
 *         Bot-Shield ($1)          →  1 weight — advisory only
 *         Founding Member ($14.99) → 10 weight — full governance
 *         3-Month Founder ($39.99) → 15 weight — priority queue
 *         12-Month Founder ($99.99)→ 20 weight — 2x feature votes
 *         Royalty Card ($2,500)    → 50 weight — disbursement review panel
 */
contract YANAI is SoulboundToken {
    uint256 public constant WEIGHT_BOT_SHIELD    = 1;
    uint256 public constant WEIGHT_FOUNDING      = 10;
    uint256 public constant WEIGHT_THREE_MONTH   = 15;
    uint256 public constant WEIGHT_TWELVE_MONTH  = 20;
    uint256 public constant WEIGHT_ROYALTY_CARD  = 50;

    constructor(address founder) SoulboundToken("YouAndINotAI Governance", "YANAI", founder) {}

    function mintBotShield(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_BOT_SHIELD, "BotShield_$1");
    }

    function mintFoundingMember(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_FOUNDING, "FoundingMember_$14.99");
    }

    function mintThreeMonth(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_THREE_MONTH, "ThreeMonthFounder_$39.99");
    }

    function mintTwelveMonth(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_TWELVE_MONTH, "TwelveMonthFounder_$99.99");
    }

    function mintRoyaltyCard(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_ROYALTY_CARD, "RoyaltyCard_$2500");
    }
}
