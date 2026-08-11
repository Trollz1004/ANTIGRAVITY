// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// YNAIToken — YouAndINot AI DAO Governance Token
// Base L2 (Chain ID: 8453) | ERC-20Votes + UUPS Upgradeable | OZ v5
// Entity: YouAndINot AI DAO LLC (Wyoming DAO LLC, in formation)
//
// REQUIRES: npm install @openzeppelin/contracts-upgradeable
//           (NOT currently in contracts/node_modules — install before compile)
// ============================================================================

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

/// @title YNAIToken
/// @notice Governance + utility token for YouAndINot AI DAO LLC.
///         100,000,000 fixed supply, 18 decimals, minted once to deployer at init.
///         Timestamp-based vote clock (Base L2 reliable).
/// @dev    UUPS upgradeable. After governance goes live, transfer ownership to
///         the YNAITimelock so upgrades require a governance vote.
contract YNAIToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @notice Total fixed supply: 100,000,000 YNAI.
    uint256 public constant TOTAL_SUPPLY = 100_000_000e18;
    /// @notice Class A founder allocation: 51,000,000 YNAI (51%) — vested.
    uint256 public constant CLASS_A_FOUNDER = 51_000_000e18;
    /// @notice Class B public allocation: 49,000,000 YNAI (49%) — treasury.
    uint256 public constant CLASS_B_PUBLIC = 49_000_000e18;
    /// @notice Implementation version.
    uint8 public constant VERSION = 1;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the token and mints the entire supply to the owner.
    /// @param initialOwner Deployer / founder wallet (from .env, never hardcoded).
    function initialize(address initialOwner) public initializer {
        __ERC20_init("YouAndINot AI", "YNAI");
        __ERC20Permit_init("YouAndINot AI");
        __ERC20Votes_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    // ------------------------------------------------------------------
    // Timestamp clock (Base L2) — governor reads these automatically
    // ------------------------------------------------------------------

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // ------------------------------------------------------------------
    // UUPS upgrade gate
    // ------------------------------------------------------------------

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ------------------------------------------------------------------
    // Required diamond-inheritance overrides (OZ v5)
    // ------------------------------------------------------------------

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
