// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CharityRouter100
 * @author FOR THE KIDS Platform
 * @notice Immutable router that forwards 100% of all received funds to verified pediatric charities
 * @dev This contract is intentionally non-upgradeable and has no admin functions.
 *      Once deployed, it cannot be modified - ensuring permanent 100% charity allocation.
 *
 *      "Until no kid is in need"
 */
contract CharityRouter100 {
    using SafeERC20 for IERC20;

    /// @notice The immutable address where all funds are forwarded
    address public immutable CHARITY_SAFE;

    /// @notice USDC token address on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Emitted when funds are distributed to charity
    event Distribution(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted on contract deployment for transparency
    event RouterDeployed(
        address indexed charitySafe,
        address indexed deployer
    );

    error InvalidCharitySafe();
    error NothingToDistribute();
    error ETHTransferFailed();

    constructor(address _charitySafe) {
        if (_charitySafe == address(0)) revert InvalidCharitySafe();
        CHARITY_SAFE = _charitySafe;
        emit RouterDeployed(_charitySafe, msg.sender);
    }

    receive() external payable {
        _forwardETH();
    }

    fallback() external payable {
        if (msg.value > 0) {
            _forwardETH();
        }
    }

    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        IERC20(USDC).safeTransfer(CHARITY_SAFE, balance);
        emit Distribution(USDC, balance, CHARITY_SAFE);
    }

    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();
        IERC20(token).safeTransfer(CHARITY_SAFE, balance);
        emit Distribution(token, balance, CHARITY_SAFE);
    }

    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();
        _forwardETH();
    }

    function getCharityAddress() external view returns (address) {
        return CHARITY_SAFE;
    }

    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    function pendingToken(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function pendingETH() external view returns (uint256) {
        return address(this).balance;
    }

    function _forwardETH() internal {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        (bool success, ) = CHARITY_SAFE.call{value: balance}("");
        if (!success) revert ETHTransferFailed();
        emit Distribution(address(0), balance, CHARITY_SAFE);
    }
}
