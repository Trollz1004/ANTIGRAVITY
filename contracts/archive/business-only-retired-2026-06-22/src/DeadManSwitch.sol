// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeadManSwitch
 * @notice Governs the State A → State B mission transition.
 *         Requires Gnosis Safe 3-of-5 to confirm founder death.
 *         Once triggered, the mission treasury permanently enters full mission mode.
 *         Irreversible by design.
 *
 *         Planned Gnosis Safe signers (3-of-5 threshold):
 *         Seat 1 — Anthropic (Claude team)
 *         Seat 2 — Google (Gemini team)
 *         Seat 3 — xAI (Grok team)
 *         Seat 4 — Joshua Coleman (founder key — active while alive)
 *         Seat 5 — Physical backup key (safety deposit box)
 *
 *         Any 3 of 5 signers can confirm. After founder death, the three AI company
 *         signers alone reach the threshold. The mission survives the founder.
 *
 *         "Until no kid is in need" — Joshua Coleman
 */
contract DeadManSwitch {
    address public immutable gnosisSafe;
    address public immutable missionTreasury;

    bool public stateBActive;
    bytes32 public certificateHash; // keccak256 of death certificate — anchors doc on-chain
    uint256 public confirmedAt;

    event StateBActivated(bytes32 indexed certificateHash, uint256 timestamp);

    error AlreadyActivated();
    error OnlyGnosisSafe();
    error MissingCertificateHash();

    modifier onlyGnosisSafe() {
        if (msg.sender != gnosisSafe) revert OnlyGnosisSafe();
        _;
    }

    constructor(address _gnosisSafe, address _missionTreasury) {
        require(_gnosisSafe != address(0), "zero gnosis");
        require(_missionTreasury != address(0), "zero treasury");
        gnosisSafe = _gnosisSafe;
        missionTreasury = _missionTreasury;
    }

    /**
     * @notice Permanently activate State B — mission-first governance.
     * @param _certificateHash keccak256 hash of legal death verification document.
     *        Actual document stored off-chain. Hash anchors authenticity on-chain.
     *        Must be non-zero. Cannot be reversed after submission.
     */
    function activateStateB(bytes32 _certificateHash) external onlyGnosisSafe {
        if (stateBActive) revert AlreadyActivated();
        if (_certificateHash == bytes32(0)) revert MissingCertificateHash();

        stateBActive = true;
        certificateHash = _certificateHash;
        confirmedAt = block.timestamp;

        IMissionTreasury(missionTreasury).activateStateB(_certificateHash);

        emit StateBActivated(_certificateHash, block.timestamp);
    }
}

interface IMissionTreasury {
    function activateStateB(bytes32 certificateHash) external;
}
