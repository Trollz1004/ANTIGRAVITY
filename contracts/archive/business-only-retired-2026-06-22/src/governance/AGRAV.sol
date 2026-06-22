// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SoulboundToken.sol";

/**
 * @title AGRAV — AiDoesItAll Governance Token ($AGRAV)
 * @notice Soulbound. Earned by: cross-platform infrastructure usage, API consumption,
 *         service integration milestones, uptime contributions.
 *         Voting on: infra priorities, API rate limits, cross-platform policy.
 *         Max supply: 2,500,000 per DAO tokenomics.
 *         Non-transferable. Earn-only.
 */
contract AGRAV is SoulboundToken {
    uint256 public constant DAO_SUPPLY = 2_500_000;

    uint256 public constant WEIGHT_API_USER          = 3;
    uint256 public constant WEIGHT_SERVICE_INTEGRATOR = 8;
    uint256 public constant WEIGHT_INFRA_CONTRIBUTOR  = 15;
    uint256 public constant WEIGHT_POWER_OPERATOR     = 25;

    constructor(address founder) SoulboundToken("AiDoesItAll Governance", "AGRAV", founder, DAO_SUPPLY) {}

    function mintApiUser(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_API_USER, "ApiUser");
    }

    function mintServiceIntegrator(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_SERVICE_INTEGRATOR, "ServiceIntegrator");
    }

    function mintInfraContributor(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_INFRA_CONTRIBUTOR, "InfraContributor");
    }

    function mintPowerOperator(address to) external onlyOwner {
        _mintEarned(to, WEIGHT_POWER_OPERATOR, "PowerOperator");
    }
}
