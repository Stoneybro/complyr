// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SmartWallet} from "./SmartWallet.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IComplianceRegistry} from "./IComplianceRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Smart Wallet Factory
 * @author zion livingstone
 * @notice Factory for deploying ERC-1167 minimal proxy clones of SmartWallet on Sepolia.
 *         Auto-registers each new wallet with the on-chain ComplianceRegistry.
 *         Drips a small amount of ETH and a configurable amount of stablecoin for onboarding.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
contract SmartWalletFactory is Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The SmartWallet implementation address cloned for each user.
    address public immutable IMPLEMENTATION;

    /// @notice The on-chain ComplianceRegistry on Sepolia.
    address public immutable COMPLIANCE_REGISTRY;

    /// @notice Mapping from user EOA to deployed SmartWallet clone.
    mapping(address user => address clone) public userClones;

    /// @notice Native ETH dripped to each new wallet (fallback for gas).
    uint256 public sNativeDripAmount = 0.01 ether;

    /// @notice The stablecoin to drip (USDC or USDT).
    address public sStablecoin;

    /// @notice The amount of stablecoin to drip.
    uint256 public sStablecoinDripAmount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event AccountCreated(address indexed account, address indexed owner);
    event StablecoinDripConfigured(address indexed token, uint256 amount);
    event NativeDripConfigured(uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error SmartWalletFactory__ImplementationUndeployed();
    error SmartWalletFactory__ComplianceRegistryUndeployed();
    error SmartWalletFactory__DripFailed();

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _implementation, address _complianceRegistry) Ownable(msg.sender) {
        if (_implementation.code.length == 0) revert SmartWalletFactory__ImplementationUndeployed();
        if (_complianceRegistry.code.length == 0) revert SmartWalletFactory__ComplianceRegistryUndeployed();
        IMPLEMENTATION = _implementation;
        COMPLIANCE_REGISTRY = _complianceRegistry;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the stablecoin drip configuration.
     * @param _token The stablecoin contract address.
     * @param _amount The amount to drip (in smallest units).
     */
    function setStablecoinDrip(address _token, uint256 _amount) external onlyOwner {
        sStablecoin = _token;
        sStablecoinDripAmount = _amount;
        emit StablecoinDripConfigured(_token, _amount);
    }

    /**
     * @notice Sets the native ETH drip configuration.
     * @param _amount The amount to drip in wei.
     */
    function setNativeDrip(uint256 _amount) external onlyOwner {
        sNativeDripAmount = _amount;
        emit NativeDripConfigured(_amount);
    }

    /**
     * @notice Deploys a deterministic SmartWallet for an owner, or returns it if already deployed.
     * @dev Compatible with ERC-4337 initCode deployment.
     *      Drips ETH and Stablecoin to new wallet if factory has enough balance.
     *      Auto-registers the wallet with the ComplianceRegistry on Sepolia.
     * @param owner The address that will own the smart account.
     * @return account The deployed (or existing) SmartWallet proxy address.
     */
    function createSmartAccount(address owner) public payable returns (address account) {
        bytes32 salt = _getSalt(owner);
        address predicted = Clones.predictDeterministicAddress(IMPLEMENTATION, salt, address(this));

        // Return existing account if already deployed
        if (predicted.code.length != 0) return predicted;

        // Calculate drips
        uint256 nativeDrip = address(this).balance >= sNativeDripAmount ? sNativeDripAmount : 0;

        // Deploy the proxy
        account = Clones.cloneDeterministic(IMPLEMENTATION, salt, nativeDrip);
        SmartWallet(payable(account)).initialize(owner);

        // Perform Stablecoin drip if configured and factory has balance
        if (sStablecoin != address(0) && sStablecoinDripAmount > 0) {
            uint256 factoryTokenBalance = IERC20(sStablecoin).balanceOf(address(this));
            if (factoryTokenBalance >= sStablecoinDripAmount) {
                IERC20(sStablecoin).safeTransfer(account, sStablecoinDripAmount);
            }
        }

        userClones[owner] = account;

        // Auto-register with on-chain ComplianceRegistry
        IComplianceRegistry(COMPLIANCE_REGISTRY).registerAccount(account, owner);

        emit AccountCreated(account, owner);
    }

    /// @notice Returns the counterfactual address for an owner's wallet before deployment.
    function getPredictedAddress(address owner) external view returns (address) {
        return Clones.predictDeterministicAddress(IMPLEMENTATION, _getSalt(owner), address(this));
    }

    /// @notice Returns the deployed clone address for a user, or zero if not deployed.
    function getUserClone(address user) external view returns (address) {
        return userClones[user];
    }

    function _getSalt(address owner) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner));
    }

    receive() external payable {}
}
