// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YNAIToken
 * @notice YouAndINot AI DAO LLC governance token — Base L2 (Chain ID 8453)
 *
 *   Total supply: 100,000,000 YNAI (18 decimals)
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ Class A — 51,000,000 YNAI (51%)  Founder / Joshua Coleman       │
 *   │   • 4-year linear vest, 1-year cliff                            │
 *   │   • Transfer to YNAIVesting immediately after initialize()       │
 *   │ Class B — 49,000,000 YNAI (49%)  Public / DAO treasury          │
 *   │   • Transfer to Governor Timelock / sale contract at deploy      │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 *   Standard: ERC-20Votes + ERC-20Permit + UUPS (OpenZeppelin v5.x)
 *   Entity:   YouAndINot AI DAO LLC (Wyoming DAO LLC, in formation)
 *
 * @dev REQUIRES before compile:
 *        npm install @openzeppelin/contracts-upgradeable
 *      Deploy via ERC1967Proxy pointing at this implementation.
 *      Do NOT call initialize() directly on the implementation — call it
 *      through the proxy. The constructor disables all initializers on the
 *      bare implementation to prevent misuse.
 */

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

contract YNAIToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ─── Supply constants ────────────────────────────────────────────────────
    // 100,000,000 total YNAI (18 decimals)
    uint256 public constant TOTAL_SUPPLY    = 100_000_000e18;
    // Class A: founder allocation — locked in YNAIVesting for 4yr/1yr cliff
    uint256 public constant CLASS_A_FOUNDER =  51_000_000e18;
    // Class B: public allocation — DAO treasury / sale
    uint256 public constant CLASS_B_PUBLIC  =  49_000_000e18;

    // ─── Implementation version ──────────────────────────────────────────────
    uint8 public constant VERSION = 1;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the token proxy. Called exactly once by the proxy on deploy.
     * @param initialOwner  Deployer wallet that receives the full minted supply.
     *                      TODO: replace with Joshua's actual wallet address in deploy script.
     *                      After initialize(), transfer CLASS_A_FOUNDER to YNAIVesting
     *                      and CLASS_B_PUBLIC to the YNAITimelock / treasury.
     */
    function initialize(address initialOwner) public initializer {
        __ERC20_init("YouAndINot AI", "YNAI");
        __ERC20Permit_init("YouAndINot AI");
        __ERC20Votes_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        // Mint entire supply to deployer; allocate via transfers in deploy script
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    // ─── Clock: timestamp mode (Base L2-native, more predictable than blocks) ─
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // ─── UUPS: only owner may authorize an upgrade ────────────────────────────
    // After full DAO formation, transfer ownership to YNAITimelock so upgrades
    // require a governance vote.
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // ─── Nonce disambiguation ─────────────────────────────────────────────────
    // ERC20PermitUpgradeable and ERC20VotesUpgradeable both inherit NoncesUpgradeable.
    // Solidity requires an explicit override to disambiguate the nonces() selector.
    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
