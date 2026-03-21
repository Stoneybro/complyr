// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {MpSmartWallet} from "./MpSmartWallet.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title Mp Smart Wallet Factory
 * @author stoneybro
 * @notice Factory for deploying ERC-1167 minimal proxy clones of Mp Smart Wallet.
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract MpSmartWalletFactory {
    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the ERC-1167 implementation used as implementation for new accounts.
    address public immutable implementation;

    /// @notice Mapping from user EOA to deployed SmartAccount clone.
    mapping(address user => address clone) public userClones;
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
    error MpSmartWalletFactory__ImplementationUndeployed();

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Factory constructor used to initialize the implementation address to use for future
     *   MpSmartWallet deployments.
     *
     * @param _implementation The address of the MpSmartWallet implementation which new accounts will proxy to.
     */
    constructor(address _implementation) {
        if (_implementation.code.length == 0) {
            revert MpSmartWalletFactory__ImplementationUndeployed();
        }
        implementation = _implementation;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys and initializes a deterministic MpSmartWallet for a specific owner, or returns
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
    function createSmartAccount(address owner) public returns (address account) {
        bytes32 salt = _getSalt(owner);
        address predictedAddress = Clones.predictDeterministicAddress(implementation, salt, address(this));

        // Return existing account if already deployed
        if (predictedAddress.code.length != 0) {
            return predictedAddress;
        }

        // Deploy new account
        account = Clones.cloneDeterministic(implementation, salt);

        // Initialize with specified owner
        MpSmartWallet(payable(account)).initialize(owner);

        // Record mapping and emit after successful initialize
        userClones[owner] = account;
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
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
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
}
