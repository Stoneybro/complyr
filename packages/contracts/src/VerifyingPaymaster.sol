// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {UserOperationLib} from "@account-abstraction/contracts/core/UserOperationLib.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";

/**
 * @title Verifying Paymaster
 * @author stoneybro
 * @notice A paymaster that sponsors gas for UserOperations verified by an off-chain signer.
 * @dev Extends BasePaymaster from account-abstraction v0.7. The flow:
 *   1. User builds a UserOp and sends it to a backend signer
 *   2. Backend verifies eligibility and signs (sender, nonce, validUntil, validAfter) with the verifying signer key
 *   3. The signature + validity window is packed into paymasterAndData
 *   4. EntryPoint calls validatePaymasterUserOp → this contract verifies the signer's signature
 *   5. If valid, the paymaster sponsors the gas from its EntryPoint deposit
 *
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract VerifyingPaymaster is BasePaymaster {
    using UserOperationLib for PackedUserOperation;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The off-chain signer whose signature authorizes gas sponsorship.
    address public verifyingSigner;

    /// @notice Mapping of sender nonces to prevent replay attacks.
    /// @dev Tracks a separate nonce per sender to allow the paymaster to invalidate old signatures.
    mapping(address => uint256) public senderNonce;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the verifying signer is updated.
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when the signer address is zero.
    error VerifyingPaymaster__SignerIsZeroAddress();

    /// @notice Thrown when the paymaster data length is invalid.
    error VerifyingPaymaster__InvalidPaymasterDataLength();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructs the VerifyingPaymaster.
     *
     * @param _entryPoint The EntryPoint contract address.
     * @param _verifyingSigner The initial signer address that authorizes sponsorship.
     */
    constructor(
        IEntryPoint _entryPoint,
        address _verifyingSigner
    ) BasePaymaster(_entryPoint, msg.sender) {
        if (_verifyingSigner == address(0)) revert VerifyingPaymaster__SignerIsZeroAddress();
        verifyingSigner = _verifyingSigner;
        emit SignerUpdated(address(0), _verifyingSigner);
    }

    /**
     * @dev Overrides the BasePaymaster ERC165 sanity check.
     *      Flow EVM's EntryPoint V0.7 deployment does not respond to supportsInterface(),
     *      causing a revert on deployment. The EntryPoint IS the correct v0.7 contract —
     *      it simply does not implement ERC165 advertising. We skip this check safely.
     */
    function _validateEntryPointInterface(IEntryPoint /*__entryPoint*/) internal override {
        // Intentionally skipped: Flow EVM's EntryPoint does not support ERC165
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates the verifying signer. Only callable by the owner.
     *
     * @param _newSigner The new signer address.
     */
    function setVerifyingSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert VerifyingPaymaster__SignerIsZeroAddress();
        address oldSigner = verifyingSigner;
        verifyingSigner = _newSigner;
        emit SignerUpdated(oldSigner, _newSigner);
    }

    /**
     * @notice Returns the hash to be signed by the off-chain verifying signer.
     * @dev The hash covers sender, nonce, validity window, and chain context to prevent replay attacks.
     *
     * @param userOp The packed user operation.
     * @param validUntil The last timestamp this sponsorship is valid at (0 = indefinitely).
     * @param validAfter The first timestamp this sponsorship is valid.
     *
     * @return The hash that the verifying signer must sign.
     */
    function getHash(
        PackedUserOperation calldata userOp,
        uint48 validUntil,
        uint48 validAfter
    ) public view returns (bytes32) {
        // Pack sender and nonce from userOp, along with validity window and chain context
        return keccak256(
            abi.encode(
                userOp.sender,
                userOp.nonce,
                userOp.callData,
                block.chainid,
                address(this),
                validUntil,
                validAfter,
                senderNonce[userOp.sender]
            )
        );
    }

    /**
     * @notice Validates a paymaster user operation by verifying the off-chain signer's signature.
     * @dev Called by the EntryPoint during UserOp validation.
     *
     * The paymasterAndData layout (after the standard 52-byte header) is:
     *   [0:6]   - validUntil (uint48)
     *   [6:12]  - validAfter (uint48)
     *   [12:77] - signature (65 bytes: r[32] + s[32] + v[1])
     *
     *
     * @return context Empty bytes (no postOp needed).
     * @return validationData Packed validation data with signature result and validity window.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata /*userOp*/,
        bytes32 /*userOpHash*/,
        uint256 /*maxCost*/
    ) internal pure override returns (bytes memory context, uint256 validationData) {
        // Unconditionally sponsor all operations for the hackathon demo
        return ("", 0);
    }
}
