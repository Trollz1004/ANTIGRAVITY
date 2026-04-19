// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DAOTreasury
 * @notice Receives the 63% operational share from PlatformSplitter and manages
 *         the Sinking Fund (monthly operating costs) before routing surplus to staking.
 *
 *         Priority waterfall (monthly):
 *           1. Founder survival:    $3,000 USDC
 *           2. AI API/tool cap:     $200 USDC
 *           3. Hardware reserve:    $500 USDC (server leasing / GPU upgrades)
 *           4. Power reserve:       $135 USDC (1500W * 24h * 30d @ $0.1235/kWh)
 *           5. Everything else  →   StakingVault
 *
 *         Gas optimized for Base L2: custom errors, storage packing, calldata params.
 *
 *         State A (alive):  Josh controls withdrawals and fund parameters
 *         State B (dead):   Gnosis Safe 3-of-5 takes ownership (via DeadManSwitch)
 */
contract DAOTreasury is Ownable {
    using SafeERC20 for IERC20;

    // --- Constants ---
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    uint256 private constant USDC_DECIMALS = 1e6;

    // --- Immutables ---
    address public immutable deadManSwitch;
    address public immutable gnosisSafe;

    // --- Sinking Fund targets (USDC, 6 decimals) — owner-adjustable ---
    // Packed into two storage slots
    uint64 public founderSurvival;   // default: 3_000 * 1e6
    uint64 public aiApiCap;          // default: 200 * 1e6
    uint64 public hardwareReserve;   // default: 500 * 1e6
    uint64 public powerReserve;      // default: 135 * 1e6

    // --- State ---
    address public stakingVault;     // receives surplus after sinking fund
    address public founderWallet;    // receives founder survival draws
    bool public stateBActive;

    // Tracks the current sinking fund epoch (monthly period)
    uint32 public currentEpoch;
    uint32 public epochStart;        // timestamp of current epoch start
    uint32 public epochDuration;     // seconds per epoch (default: 30 days)
    uint32 private _statePadding;

    // Per-epoch draws (reset each epoch)
    uint64 public epochFounderDrawn;
    uint64 public epochApiDrawn;
    uint64 public epochHardwareDrawn;
    uint64 public epochPowerDrawn;

    // Cumulative stats
    uint256 public totalReceived;
    uint256 public totalToStaking;
    uint256 public totalToFounder;

    // DAO identifier
    bytes32 public immutable daoId;

    // --- Events ---
    event Received(uint256 amount, bytes32 indexed daoId);
    event FounderDraw(uint256 amount, uint32 epoch);
    event ApiDraw(uint256 amount, uint32 epoch);
    event HardwareDraw(uint256 amount, uint32 epoch);
    event PowerDraw(uint256 amount, uint32 epoch);
    event SurplusToStaking(uint256 amount, uint32 epoch);
    event EpochAdvanced(uint32 newEpoch, uint256 timestamp);
    event SinkingFundUpdated(uint64 founder, uint64 api, uint64 hardware, uint64 power);
    event StakingVaultSet(address indexed vault);
    event StateBActivated(uint256 timestamp);

    // --- Custom errors ---
    error ZeroAddress();
    error OnlyDeadManSwitch();
    error AlreadyStateB();
    error NoStakingVault();
    error ExceedsEpochCap();
    error InsufficientBalance();
    error EpochNotExpired();

    modifier onlyDeadManSwitch() {
        if (msg.sender != deadManSwitch) revert OnlyDeadManSwitch();
        _;
    }

    constructor(
        address _founder,
        address _founderWallet,
        address _deadManSwitch,
        address _gnosisSafe,
        bytes32 _daoId
    ) Ownable(_founder) {
        if (_founderWallet == address(0)) revert ZeroAddress();
        if (_deadManSwitch == address(0)) revert ZeroAddress();
        if (_gnosisSafe == address(0)) revert ZeroAddress();

        founderWallet = _founderWallet;
        deadManSwitch = _deadManSwitch;
        gnosisSafe = _gnosisSafe;
        daoId = _daoId;

        // Default sinking fund targets (USDC 6 decimals)
        founderSurvival = 3_000 * uint64(USDC_DECIMALS);  // $3,000
        aiApiCap        = 200 * uint64(USDC_DECIMALS);     // $200
        hardwareReserve = 500 * uint64(USDC_DECIMALS);     // $500
        powerReserve    = 135 * uint64(USDC_DECIMALS);     // $135

        epochDuration = 30 days;
        epochStart = uint32(block.timestamp);
        currentEpoch = 1;
    }

    // --- Core operations ---

    /// @notice Record incoming USDC from PlatformSplitter (called after transfer).
    function recordDeposit(uint256 amount) external {
        totalReceived += amount;
        emit Received(amount, daoId);
    }

    /// @notice Founder draws survival payment for current epoch.
    function drawFounderSurvival(uint64 amount) external onlyOwner {
        _autoAdvanceEpoch();
        if (epochFounderDrawn + amount > founderSurvival) revert ExceedsEpochCap();
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        epochFounderDrawn += amount;
        totalToFounder += amount;
        IERC20(USDC).safeTransfer(founderWallet, amount);
        emit FounderDraw(amount, currentEpoch);
    }

    /// @notice Draw AI API/tool budget for current epoch.
    function drawApiCap(uint64 amount, address recipient) external onlyOwner {
        _autoAdvanceEpoch();
        if (epochApiDrawn + amount > aiApiCap) revert ExceedsEpochCap();
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        epochApiDrawn += amount;
        IERC20(USDC).safeTransfer(recipient, amount);
        emit ApiDraw(amount, currentEpoch);
    }

    /// @notice Draw hardware reserve for current epoch.
    function drawHardware(uint64 amount, address recipient) external onlyOwner {
        _autoAdvanceEpoch();
        if (epochHardwareDrawn + amount > hardwareReserve) revert ExceedsEpochCap();
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        epochHardwareDrawn += amount;
        IERC20(USDC).safeTransfer(recipient, amount);
        emit HardwareDraw(amount, currentEpoch);
    }

    /// @notice Draw power reserve for current epoch.
    function drawPower(uint64 amount, address recipient) external onlyOwner {
        _autoAdvanceEpoch();
        if (epochPowerDrawn + amount > powerReserve) revert ExceedsEpochCap();
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        epochPowerDrawn += amount;
        IERC20(USDC).safeTransfer(recipient, amount);
        emit PowerDraw(amount, currentEpoch);
    }

    /// @notice Route surplus (balance above sinking fund needs) to StakingVault.
    function routeSurplus() external onlyOwner {
        if (stakingVault == address(0)) revert NoStakingVault();
        _autoAdvanceEpoch();

        uint256 balance = IERC20(USDC).balanceOf(address(this));
        uint256 sinkingNeed = _remainingSinkingNeed();

        if (balance <= sinkingNeed) revert InsufficientBalance();

        uint256 surplus = balance - sinkingNeed;
        totalToStaking += surplus;
        IERC20(USDC).safeTransfer(stakingVault, surplus);
        emit SurplusToStaking(surplus, currentEpoch);
    }

    // --- Admin (owner-only) ---

    function setStakingVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        stakingVault = _vault;
        emit StakingVaultSet(_vault);
    }

    function setFounderWallet(address _wallet) external onlyOwner {
        if (_wallet == address(0)) revert ZeroAddress();
        founderWallet = _wallet;
    }

    function updateSinkingFund(
        uint64 _founder,
        uint64 _api,
        uint64 _hardware,
        uint64 _power
    ) external onlyOwner {
        founderSurvival = _founder;
        aiApiCap = _api;
        hardwareReserve = _hardware;
        powerReserve = _power;
        emit SinkingFundUpdated(_founder, _api, _hardware, _power);
    }

    /// @notice Manually advance to next epoch (auto-called by draws too).
    function advanceEpoch() external onlyOwner {
        if (block.timestamp < epochStart + epochDuration) revert EpochNotExpired();
        _advanceEpoch();
    }

    // --- Dead Man Switch ---

    function activateStateB() external onlyDeadManSwitch {
        if (stateBActive) revert AlreadyStateB();
        stateBActive = true;
        _transferOwnership(gnosisSafe);
        emit StateBActivated(block.timestamp);
    }

    // --- View functions ---

    function totalBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function monthlySinkingTotal() external view returns (uint256) {
        return uint256(founderSurvival) + uint256(aiApiCap)
             + uint256(hardwareReserve) + uint256(powerReserve);
    }

    function remainingSinkingNeed() external view returns (uint256) {
        return _remainingSinkingNeed();
    }

    function surplusAvailable() external view returns (uint256) {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        uint256 need = _remainingSinkingNeed();
        return balance > need ? balance - need : 0;
    }

    function epochInfo() external view returns (
        uint32 epoch,
        uint32 start,
        uint32 duration,
        uint256 founderRemaining,
        uint256 apiRemaining,
        uint256 hardwareRemaining,
        uint256 powerRemaining
    ) {
        epoch = currentEpoch;
        start = epochStart;
        duration = epochDuration;
        founderRemaining = founderSurvival > epochFounderDrawn
            ? founderSurvival - epochFounderDrawn : 0;
        apiRemaining = aiApiCap > epochApiDrawn
            ? aiApiCap - epochApiDrawn : 0;
        hardwareRemaining = hardwareReserve > epochHardwareDrawn
            ? hardwareReserve - epochHardwareDrawn : 0;
        powerRemaining = powerReserve > epochPowerDrawn
            ? powerReserve - epochPowerDrawn : 0;
    }

    // --- Internal ---

    function _remainingSinkingNeed() internal view returns (uint256) {
        uint256 founderLeft = founderSurvival > epochFounderDrawn
            ? founderSurvival - epochFounderDrawn : 0;
        uint256 apiLeft = aiApiCap > epochApiDrawn
            ? aiApiCap - epochApiDrawn : 0;
        uint256 hwLeft = hardwareReserve > epochHardwareDrawn
            ? hardwareReserve - epochHardwareDrawn : 0;
        uint256 pwrLeft = powerReserve > epochPowerDrawn
            ? powerReserve - epochPowerDrawn : 0;
        return founderLeft + apiLeft + hwLeft + pwrLeft;
    }

    function _autoAdvanceEpoch() internal {
        if (block.timestamp >= epochStart + epochDuration) {
            _advanceEpoch();
        }
    }

    function _advanceEpoch() internal {
        currentEpoch++;
        epochStart = uint32(block.timestamp);
        epochFounderDrawn = 0;
        epochApiDrawn = 0;
        epochHardwareDrawn = 0;
        epochPowerDrawn = 0;
        emit EpochAdvanced(currentEpoch, block.timestamp);
    }
}
