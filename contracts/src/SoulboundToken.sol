// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundToken
 * @notice Base non-transferable governance token for ANTIGRAVITY platform DAOs.
 *         Earned by platform activity — never purchased, never traded.
 *         Each token carries weighted voting power by tier.
 *         Extended by YANAI, AISO, and RECYCLE — never used directly.
 */
abstract contract SoulboundToken is ERC721, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => uint256) public tokenWeight;
    mapping(address => uint256) public holderWeight;

    event TokenEarned(address indexed holder, uint256 tokenId, uint256 weight, string reason);

    error Soulbound();
    error ZeroAddress();

    constructor(string memory name, string memory symbol, address founder)
        ERC721(name, symbol)
        Ownable(founder)
    {}

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
