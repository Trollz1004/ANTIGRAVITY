// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundToken
 * @notice Base non-transferable governance token for ANTIGRAVITY platform DAOs.
 *         Earned by platform activity — never purchased, never traded.
 *         Each token carries weighted voting power by tier.
 *         Extended by $LOVE, $UKID, $GREEN, and $AGRAV — never used directly.
 *         Max supply enforced per DAO (2,500,000 tokens).
 */
abstract contract SoulboundToken is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public immutable maxSupply;

    mapping(uint256 => uint256) public tokenWeight;
    mapping(address => uint256) public holderWeight;

    event TokenEarned(address indexed holder, uint256 tokenId, uint256 weight, string reason);

    error Soulbound();
    error ZeroAddress();
    error SupplyCapReached();

    constructor(string memory name, string memory symbol, address founder, uint256 _maxSupply)
        ERC721(name, symbol)
        Ownable(founder)
    {
        maxSupply = _maxSupply;
    }

    // Block all transfers — soulbound to the earning wallet forever
    function transferFrom(address, address, uint256) public pure override {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert Soulbound();
    }

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function _mintEarned(address to, uint256 weight, string memory reason) internal returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (_nextTokenId >= maxSupply) revert SupplyCapReached();
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        tokenWeight[tokenId] = weight;
        holderWeight[to] += weight;
        emit TokenEarned(to, tokenId, weight, reason);
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
