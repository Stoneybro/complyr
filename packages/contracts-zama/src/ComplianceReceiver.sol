// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingReceipt} from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";
import "encrypted-types/EncryptedTypes.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceReceiver
 * @author stoneybro
 * @notice OApp deployed on Sepolia fhEVM. Receives the cross-chain LayerZero
 *         message from Flow EVM and logs it in the encrypted ComplianceRegistry.
 */
contract ComplianceReceiver is OApp {
    
    /// @notice Address of the ComplianceRegistry to insert the encrypted profiles
    ComplianceRegistry public registry;

    /// @notice Emitted when a cross-chain payload is successfully decoded and recorded
    event ComplianceDecodedAndRecorded(bytes32 flowTxHash, address sender);

    /**
     * @param _endpoint The LayerZero Endpoint address on Sepolia
     * @param _owner The delegate/owner of the OApp
     * @param _registry The address of the deployed ComplianceRegistry contract
     */
    constructor(
        address _endpoint,
        address _owner,
        address _registry
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        registry = ComplianceRegistry(_registry);
    }

    /**
     * @notice Set or update the registry address
     */
    function setRegistry(address _registry) external onlyOwner {
        registry = ComplianceRegistry(_registry);
    }

    // Message type identifiers
    uint8 public constant MSG_REGISTER = 1;
    uint8 public constant MSG_REPORT = 2;

    struct ComplianceReport {
        bytes32 flowTxHash;
        address proxyAccount;
        address[] recipients;
        uint256[] amounts;
        bytes32 categoryHandle;
        bytes categoryProof;
        bytes32 jurisdictionHandle;
        bytes jurisdictionProof;
    }

    /**
     * @notice Implement the core LayerZero receive function.
     * @dev Called automatically by the LayerZero Executor when a message arrives from Flow.
     *      Decodes the payload and pushes it into the Zama fhEVM registry.
     * 
     * @param _origin Details about the sender (source eid, sender address)
     * @param _guid The unique message identifier
     * @param payload The encoded parameters sent from `ComplianceBridge.sol`
     * @param _executor The address of the LayerZero Executor
     * @param _extraData Arbitrary data passed by the relayer
     */
    function _lzReceive(
        Origin calldata _origin, // origin.sender = the ComplianceBridge.sol
        bytes32 _guid,
        bytes calldata payload,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // First 32 bytes are always the message type padded by abi.encode
        uint8 msgType = abi.decode(payload[:32], (uint8));

        if (msgType == MSG_REGISTER) {
            (
                , // msgType
                address proxyAccount,
                address masterEOA
            ) = abi.decode(payload, (uint8, address, address));

            registry.registerCompany(proxyAccount, masterEOA);
            emit ComplianceDecodedAndRecorded(bytes32(0), proxyAccount);

        } else if (msgType == MSG_REPORT) {
            (, ComplianceReport memory report) = abi.decode(payload, (uint8, ComplianceReport));

            // Let the Registry handle the Pre-Encrypted EIP-712 ciphertexts via external types
            registry.recordTransaction(
                report.flowTxHash,
                report.proxyAccount,
                report.recipients,
                report.amounts,
                externalEuint8.wrap(report.categoryHandle),
                report.categoryProof,
                externalEuint8.wrap(report.jurisdictionHandle),
                report.jurisdictionProof
            );

            emit ComplianceDecodedAndRecorded(report.flowTxHash, report.proxyAccount);
        }
    }
}
