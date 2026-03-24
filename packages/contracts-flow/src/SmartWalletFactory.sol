// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SmartWallet} from "./SmartWallet.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

interface IComplianceBridge {
    function registerCompanyOnZama(address proxyAccount, address masterEOA, bytes calldata _options) external payable;
}

/**
 * @title Smart Wallet Factory
 * @author stoneybro
 * @notice Factory for deploying ERC-1167 minimal proxy clones of Smart Wallet.
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract SmartWalletFactory {
    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the ERC-1167 implementation used as implementation for new accounts.
    address public immutable IMPLEMENTATION;

    /// @notice Address of the LayerZero ComplianceBridge for auto-registration
    address public complianceBridge;

    /// @notice Mapping from user EOA to deployed SmartAccount clone.
    mapping(address user => address clone) public userClones;

    /// @notice Amount sent to proxies on deployment for testing
    uint256 public constant TEST_AMOUNT = 100 ether;
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @param account The address of the created account.
     * @param owner The initial owner of the account.
     * @notice Emitted when a new account is created.
     */
    event AccountCreated(address indexed account, address indexed owner);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Thrown when trying to construct with an implementation that is not deployed.
     */
    error SmartWalletFactory__ImplementationUndeployed();

    /**
     * @notice Thrown when trying to send test amount to new account fails.
     */
    error SmartWalletFactory__DripFailed();

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Factory constructor used to initialize the implementation address to use for future
     *   SmartWallet deployments.
     *
     * @param _implementation The address of the SmartWallet implementation which new accounts will proxy to.
     */
    constructor(address _implementation, address _complianceBridge) {
        if (_implementation.code.length == 0) {
            revert SmartWalletFactory__ImplementationUndeployed();
        }
        IMPLEMENTATION = _implementation;
        complianceBridge = _complianceBridge;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys and initializes a deterministic SmartWallet for a specific owner, or returns
     *         the existing account if already deployed.
     *
     * @dev Deployed as an ERC-1167 minimal proxy whose implementation is `this.implementation`.
     *      Uses `owner` to generate a unique salt, ensuring one wallet per address.
     *      This function is compatible with ERC-4337 initCode deployment.
     *
     * @param owner The address that will own the smart account.
     *
     * @return account The address of the ERC-1167 proxy created for `owner`, or the existing
     *                 account address if already deployed.
     */
    function createSmartAccount(address owner) public payable returns (address account) {
        bytes32 salt = _getSalt(owner);
        address predictedAddress = Clones.predictDeterministicAddress(IMPLEMENTATION, salt, address(this));

        // Return existing account if already deployed
        if (predictedAddress.code.length != 0) {
            return predictedAddress;
        }
        // Send test amount to the new account
        uint256 dripAmount = address(this).balance >= TEST_AMOUNT ? TEST_AMOUNT : 0;

        // Deploy new account
        account = Clones.cloneDeterministic(IMPLEMENTATION, salt, dripAmount);

        // Initialize with specified owner
        SmartWallet(payable(account)).initialize(owner);

        // Record mapping and emit after successful initialize
        userClones[owner] = account;

        // Auto-Register the company on Zama Sepolia if bridge exists and msg.value is passed
        if (complianceBridge != address(0) && msg.value > 0) {
            IComplianceBridge(complianceBridge).registerCompanyOnZama{value: msg.value}(account, owner, "");
        }

        emit AccountCreated(account, owner);
    }

    /**
     * @notice Returns the deterministic address of the account that would be created for a given owner.
     *
     * @param owner The address of the owner for which to predict the account address.
     *
     * @return The predicted account deployment address.
     */
    function getPredictedAddress(address owner) external view returns (address) {
        bytes32 salt = _getSalt(owner);
        return Clones.predictDeterministicAddress(IMPLEMENTATION, salt, address(this));
    }

    /**
     * @notice Returns the deployed account for a given owner or zero if none.
     *
     * @param user The address of the owner for which to retrieve the account.
     *
     * @return The deployed account address.
     */
    function getUserClone(address user) external view returns (address) {
        return userClones[user];
    }

    /**
     * @notice Returns the create2 salt for `Clones.predictDeterministicAddress`.
     *
     * @param owner The address of the owner.
     *
     * @return The computed salt.
     */
    function _getSalt(address owner) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner));
    }

    receive() external payable {}
}
