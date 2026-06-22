// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title YANAI — HISTORICAL ARTIFACT (superseded by LOVE.sol)
 * @notice Replaced by governance/LOVE.sol in the 4-DAO finalization (2026-04-26).
 *         Do NOT deploy. Kept for audit trail only.
 */
contract YANAI is SoulboundToken {
    uint256 public constant WEIGHT_BOT_SHIELD    = 1;
    uint256 public constant WEIGHT_FOUNDING      = 10;
    uint256 public constant WEIGHT_THREE_MONTH   = 15;
    uint256 public constant WEIGHT_TWELVE_MONTH  = 20;
    uint256 public constant WEIGHT_ROYALTY_CARD  = 50;

    constructor(address founder) SoulboundToken("YouAndINotAI Governance", "YANAI", founder, 2_500_000) {}

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
