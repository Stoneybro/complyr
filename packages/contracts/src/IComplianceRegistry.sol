// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint8} from "@fhevm/solidity/lib/FHE.sol";

interface IComplianceRegistry {
    function registerAccount(address proxyAccount, address masterEOA) external;

    function recordTransaction(
        bytes32 txHash,
        address proxyAccount,
        address[] calldata recipients,
        uint256[] calldata amounts,
        euint8[] calldata categories,
        euint8[] calldata jurisdictions
    ) external;

    function companyMasters(address proxyAccount) external view returns (address);
}
