// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DatingRevenueRouter
 * @author FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 * @notice Revenue router for dating app with three-phase transition model
 * @dev UUPS Upgradeable contract with the following phases:
 *
 *      SURVIVAL MODE (Phase 1):
 *      - 100% to founder for platform sustainability
 *
 *      TRANSITION MODE (Phase 2):
 *      - Gradual shift toward charity allocation
 *      - Changes require 7-30 day timelock
 *      - Democratic governance via GOVERNOR_ROLE
 *
 *      PERMANENT MODE (Phase 3):
 *      - IRREVERSIBLE - cannot go back to earlier phases
 *      - Founder capped at maximum 10%
 *      - DAO and Charity receive the rest permanently
 *
 *      "Until no kid is in need"
 */
contract DatingRevenueRouter is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    using SafeERC20 for IERC20;

    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_TIMELOCK = 7 days;
    uint256 public constant MAX_TIMELOCK = 30 days;
    uint256 public constant MAX_FOUNDER_PERMANENT = 1000; // 10%
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    enum Phase { SURVIVAL, TRANSITION, PERMANENT }

    Phase public currentPhase;
    address public founderWallet;
    address public daoTreasury;
    address public charitySafe;
    uint256 public pctFounder;
    uint256 public pctDao;
    uint256 public pctCharity;

    uint256 public scheduledPctFounder;
    uint256 public scheduledPctDao;
    uint256 public scheduledPctCharity;
    uint256 public scheduledSplitTime;
    bool public splitScheduled;

    event Distribution(address indexed token, uint256 totalAmount, uint256 founderAmount, uint256 daoAmount, uint256 charityAmount);
    event SplitScheduled(uint256 pctFounder, uint256 pctDao, uint256 pctCharity, uint256 effectiveTime);
    event SplitApplied(uint256 pctFounder, uint256 pctDao, uint256 pctCharity);
    event PermanentActivated(uint256 founderCap, uint256 daoAllocation, uint256 charityAllocation);
    event PhaseChanged(Phase indexed oldPhase, Phase indexed newPhase);
    event WalletsUpdated(address indexed founder, address indexed dao, address indexed charity);
    event SplitCancelled();

    error InvalidAddress();
    error InvalidPercentages();
    error WrongPhase(Phase required, Phase current);
    error NoSplitScheduled();
    error SplitNotReady();
    error TimelockTooShort();
    error TimelockTooLong();
    error FounderCapExceeded();
    error AlreadyPermanent();
    error SplitAlreadyScheduled();
    error NothingToDistribute();
    error ETHTransferFailed();

    modifier onlyPhase(Phase required) {
        if (currentPhase != required) revert WrongPhase(required, currentPhase);
        _;
    }

    modifier notPermanent() {
        if (currentPhase == Phase.PERMANENT) revert AlreadyPermanent();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address _founderWallet,
        address _daoTreasury,
        address _charitySafe,
        address _admin,
        address _governor
    ) external initializer {
        if (_founderWallet == address(0)) revert InvalidAddress();
        if (_daoTreasury == address(0)) revert InvalidAddress();
        if (_charitySafe == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_governor == address(0)) revert InvalidAddress();

        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(GOVERNOR_ROLE, _governor);

        founderWallet = _founderWallet;
        daoTreasury = _daoTreasury;
        charitySafe = _charitySafe;

        currentPhase = Phase.SURVIVAL;
        pctFounder = 10000;
        pctDao = 0;
        pctCharity = 0;

        emit PhaseChanged(Phase.SURVIVAL, Phase.SURVIVAL);
        emit WalletsUpdated(_founderWallet, _daoTreasury, _charitySafe);
    }

    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        _distribute(USDC, balance);
    }

    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        _distribute(token, balance);
    }

    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();
        _distributeETH(balance);
    }

    receive() external payable {}
    fallback() external payable {}

    function enterTransitionPhase() external onlyRole(GOVERNOR_ROLE) onlyPhase(Phase.SURVIVAL) {
        Phase oldPhase = currentPhase;
        currentPhase = Phase.TRANSITION;
        emit PhaseChanged(oldPhase, Phase.TRANSITION);
    }

    function scheduleSplit(
        uint256 _pctFounder, uint256 _pctDao, uint256 _pctCharity, uint256 _timelock
    ) external onlyRole(GOVERNOR_ROLE) onlyPhase(Phase.TRANSITION) {
        if (splitScheduled) revert SplitAlreadyScheduled();
        if (_pctFounder + _pctDao + _pctCharity != BASIS_POINTS) revert InvalidPercentages();
        if (_timelock < MIN_TIMELOCK) revert TimelockTooShort();
        if (_timelock > MAX_TIMELOCK) revert TimelockTooLong();

        scheduledPctFounder = _pctFounder;
        scheduledPctDao = _pctDao;
        scheduledPctCharity = _pctCharity;
        scheduledSplitTime = block.timestamp + _timelock;
        splitScheduled = true;

        emit SplitScheduled(_pctFounder, _pctDao, _pctCharity, scheduledSplitTime);
    }

    function applySplit() external onlyPhase(Phase.TRANSITION) {
        if (!splitScheduled) revert NoSplitScheduled();
        if (block.timestamp < scheduledSplitTime) revert SplitNotReady();

        pctFounder = scheduledPctFounder;
        pctDao = scheduledPctDao;
        pctCharity = scheduledPctCharity;

        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit SplitApplied(pctFounder, pctDao, pctCharity);
    }

    function cancelScheduledSplit() external onlyPhase(Phase.TRANSITION) {
        if (!hasRole(GOVERNOR_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, GOVERNOR_ROLE);
        }
        if (!splitScheduled) revert NoSplitScheduled();

        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit SplitCancelled();
    }

    function activatePermanentSplit(
        uint256 _founderCap, uint256 _daoAllocation, uint256 _charityAllocation
    ) external onlyRole(DEFAULT_ADMIN_ROLE) notPermanent {
        if (_founderCap > MAX_FOUNDER_PERMANENT) revert FounderCapExceeded();
        if (_founderCap + _daoAllocation + _charityAllocation != BASIS_POINTS) revert InvalidPercentages();

        Phase oldPhase = currentPhase;
        currentPhase = Phase.PERMANENT;
        pctFounder = _founderCap;
        pctDao = _daoAllocation;
        pctCharity = _charityAllocation;

        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit PhaseChanged(oldPhase, Phase.PERMANENT);
        emit PermanentActivated(_founderCap, _daoAllocation, _charityAllocation);
    }

    function updateWallets(
        address _founderWallet, address _daoTreasury, address _charitySafe
    ) external onlyRole(DEFAULT_ADMIN_ROLE) notPermanent {
        if (_founderWallet == address(0)) revert InvalidAddress();
        if (_daoTreasury == address(0)) revert InvalidAddress();
        if (_charitySafe == address(0)) revert InvalidAddress();

        founderWallet = _founderWallet;
        daoTreasury = _daoTreasury;
        charitySafe = _charitySafe;

        emit WalletsUpdated(_founderWallet, _daoTreasury, _charitySafe);
    }

    function getCurrentSplit() external view returns (uint256 founder, uint256 dao, uint256 charity) {
        return (pctFounder, pctDao, pctCharity);
    }

    function getScheduledSplit() external view returns (
        uint256 founder, uint256 dao, uint256 charity, uint256 effectiveTime, bool isScheduled
    ) {
        return (scheduledPctFounder, scheduledPctDao, scheduledPctCharity, scheduledSplitTime, splitScheduled);
    }

    function pendingUSDC() external view returns (uint256) { return IERC20(USDC).balanceOf(address(this)); }
    function pendingETH() external view returns (uint256) { return address(this).balance; }

    function calculateDistribution(uint256 totalAmount) external view returns (uint256 founderAmt, uint256 daoAmt, uint256 charityAmt) {
        founderAmt = (totalAmount * pctFounder) / BASIS_POINTS;
        daoAmt = (totalAmount * pctDao) / BASIS_POINTS;
        charityAmt = totalAmount - founderAmt - daoAmt;
    }

    function _distribute(address token, uint256 totalAmount) internal {
        uint256 founderAmount = (totalAmount * pctFounder) / BASIS_POINTS;
        uint256 daoAmount = (totalAmount * pctDao) / BASIS_POINTS;
        uint256 charityAmount = totalAmount - founderAmount - daoAmount;

        if (founderAmount > 0) IERC20(token).safeTransfer(founderWallet, founderAmount);
        if (daoAmount > 0) IERC20(token).safeTransfer(daoTreasury, daoAmount);
        if (charityAmount > 0) IERC20(token).safeTransfer(charitySafe, charityAmount);

        emit Distribution(token, totalAmount, founderAmount, daoAmount, charityAmount);
    }

    function _distributeETH(uint256 totalAmount) internal {
        uint256 founderAmount = (totalAmount * pctFounder) / BASIS_POINTS;
        uint256 daoAmount = (totalAmount * pctDao) / BASIS_POINTS;
        uint256 charityAmount = totalAmount - founderAmount - daoAmount;

        if (founderAmount > 0) { (bool s, ) = founderWallet.call{value: founderAmount}(""); if (!s) revert ETHTransferFailed(); }
        if (daoAmount > 0) { (bool s, ) = daoTreasury.call{value: daoAmount}(""); if (!s) revert ETHTransferFailed(); }
        if (charityAmount > 0) { (bool s, ) = charitySafe.call{value: charityAmount}(""); if (!s) revert ETHTransferFailed(); }

        emit Distribution(address(0), totalAmount, founderAmount, daoAmount, charityAmount);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) notPermanent {}
}
