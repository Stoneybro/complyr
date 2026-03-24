// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingReceipt} from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import {OptionsBuilder} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceBridge
 * @author stoneybro
 * @notice OApp deployed on Flow EVM. Sends batch payment transaction details 
 *         cross-chain to the Sepolia Zama fhEVM for compliance tracking.
 */
contract ComplianceBridge is OApp {
    using OptionsBuilder for bytes;

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

    /// @notice The LayerZero Endpoint ID for the destination chain (Sepolia fhEVM)
    uint32 public targetEid;

    /// @notice Address of the IntentRegistry used to verify caller
    address public intentRegistry;

    /// @notice Event emitted when a cross-chain compliance payload is sent
    event CompliancePayloadSent(
        bytes32 indexed flowTxHash,
        address indexed proxyAccount,
        address[] recipients,
        uint256[] amounts
    );

    /// @notice Event emitted when a company registration is sent
    event RegistrationSent(address indexed proxyAccount, address indexed masterEOA);

    /// @notice Thrown when an unauthorized caller tries to send reports
    error ComplianceBridge__Unauthorized();

    /**
     * @param _endpoint The LayerZero Endpoint address on Flow EVM
     * @param _owner The delegate/owner of the OApp (can configure pathways)
     * @param _targetEid The exact Eid for Sepolia where Zama fhEVM is deployed
     */
    constructor(
        address _endpoint,
        address _owner,
        uint32 _targetEid,
        address _intentRegistry
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        targetEid = _targetEid;
        intentRegistry = _intentRegistry;
    }

    /**
     * @notice Sends a one-time registration mapping across the bridge.
     * @param proxyAccount The business' Smart Wallet Proxy deployed on Flow EVM.
     * @param masterEOA The personal wallet (MetaMask) that owns the proxy.
     * @param _options Optional gas execution settings on destination.
     */
    function registerCompanyOnZama(
        address proxyAccount,
        address masterEOA,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt) {
        bytes memory payload = abi.encode(MSG_REGISTER, proxyAccount, masterEOA);

        MessagingFee memory fee = MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 });

        receipt = _lzSend(
            targetEid,
            payload,
            _options,
            fee,
            payable(msg.sender)
        );

        emit RegistrationSent(proxyAccount, masterEOA);
    }

    /**
     * @notice Checks the required cross-chain gas fee to send the compliance report
     * @param report The ComplianceReport struct containing batch transfer details
     * @param _options Optional gas execution settings on destination
     * @return fee The calculated MessagingFee
     */
    function quoteComplianceCheck(
        ComplianceReport calldata report,
        bytes calldata _options
    ) external view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(MSG_REPORT, report);
        return _quote(targetEid, payload, _options, false);
    }

    /**
     * @notice Sends a cross-chain compliance report over LayerZero V2
     * @dev No longer requires auditor specification; natively mapped on Sepolia.
     * @param report The ComplianceReport struct containing batch transfer details
     * @param _options LayerZero _options field (execution gas required on Sepolia)
     */
    function sendComplianceReport(
        ComplianceReport calldata report,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt) {
        // Enforce access control if the registry is set
        if (intentRegistry != address(0) && msg.sender != intentRegistry && msg.sender != owner()) {
            revert ComplianceBridge__Unauthorized();
        }

        bytes memory payload = abi.encode(MSG_REPORT, report);

        // Pass the message value for LayerZero cross-chain fees
        MessagingFee memory fee = MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 });

        receipt = _lzSend(
            targetEid,
            payload,
            _options,
            fee,
            payable(msg.sender) // refund address for excess native token
        );

        emit CompliancePayloadSent(report.flowTxHash, report.proxyAccount, report.recipients, report.amounts);
    }

    /**
     * @notice Implement the abstract _lzReceive function. 
     * @dev As the bridge, we only send reports out; we don't expect responses back.
     */
    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata /*_message*/,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // Implementation left empty intentionally; Flow bridge doesn't accept incoming compliance updates.
    }
}
