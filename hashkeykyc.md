url: https://docs.hashkeychain.net/docs/Build-on-HashKey-Chain/Tools/KYC


HashKey Chain KYC Integration
This guide provides detailed information about integrating with the HashKey Chain KYC (Know Your Customer) system. The KYC system is implemented as a Soul Bound Token (SBT) on the HashKey Chain, providing on-chain verification of user identity.

Overview
The HashKey Chain KYC system provides:

Multiple KYC verification levels
ENS name integration
On-chain verification status
Human verification checks
KYC Levels
The system supports five levels of KYC verification:

Level	Value	Description
NONE	0	No KYC verification
BASIC	1	Basic level verification
ADVANCED	2	Advanced level verification
PREMIUM	3	Premium level verification
ULTIMATE	4	Ultimate level verification
KYC Status
Each KYC verification has one of the following statuses:

Status	Value	Description
NONE	0	No status (default)
APPROVED	1	KYC verification approved
REVOKED	2	KYC verification revoked
Frontend Integration
Prerequisites
Node.js environment
viem library for Ethereum interactions
Access to HashKey Chain testnet
Installation

npm install viem
Basic Setup

import { createPublicClient, createWalletClient, http, type Address, type WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { hashkeyTestnet } from 'viem/chains'
import { KYC_SBT_ADDRESS } from '@/config/contracts'
import KycSBTAbi from '@/abis/KycSBT.json'
Initialize Clients

// Public client for read operations
const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http('https://hk-testnet.rpc.alt.technology')
})

// Wallet client for write operations
const walletClient = createWalletClient({
  account,
  chain: hashkeyTestnet,
  transport: http('https://hk-testnet.rpc.alt.technology')
})
Core Functions
Get Total Fee

async function getTotalFee() {
  const fee = await publicClient.readContract({
    address: KYC_SBT_ADDRESS,
    abi: KycSBTAbi,
    functionName: 'getTotalFee',
  })
  return fee as bigint
}
Get KYC Information

async function getKycInfo(address: Address) {
  const info = await publicClient.readContract({
    address: KYC_SBT_ADDRESS,
    abi: KycSBTAbi,
    functionName: 'getKycInfo',
    args: [address],
  }) as [string, number, number, bigint]

  return {
    ensName: info[0],
    level: info[1],
    status: info[2],
    createTime: info[3]
  }
}
Check Human Verification

async function isHuman(address: Address) {
  const [isValid, level] = await publicClient.readContract({
    address: KYC_SBT_ADDRESS,
    abi: KycSBTAbi,
    functionName: 'isHuman',
    args: [address],
  }) as [boolean, number]

  return {
    isValid,
    level
  }
}
Smart Contract Integration
Interface Definition

interface IKycSBT {
    enum KycLevel { NONE, BASIC, ADVANCED, PREMIUM, ULTIMATE }
    enum KycStatus { NONE, APPROVED, REVOKED }

    // Core functions
    function requestKyc(string calldata ensName) external payable;
    function revokeKyc(address user) external;
    function restoreKyc(address user) external;
    function isHuman(address account) external view returns (bool, uint8);
    function getKycInfo(address account) external view returns (
        string memory ensName,
        KycLevel level,
        KycStatus status,
        uint256 createTime
    );

    // ENS name functions
    function approveEnsName(address user, string calldata ensName) external;
    function isEnsNameApproved(address user, string calldata ensName) external view returns (bool);
}
Demo Contract Implementation

contract KycDemo {
    IKycSBT public kycSBT;
    
    constructor(address _kycSBT) {
        kycSBT = IKycSBT(_kycSBT);
    }
    
    function checkHuman(address account) external view returns (bool isHuman, uint8 level) {
        return kycSBT.isHuman(account);
    }
    
    function getUserKycInfo(address account) external view returns (
        string memory ensName,
        IKycSBT.KycLevel level,
        IKycSBT.KycStatus status,
        uint256 createTime
    ) {
        return kycSBT.getKycInfo(account);
    }

    function checkEnsNameApproval(address user, string calldata ensName) external view returns (bool) {
        return kycSBT.isEnsNameApproved(user, ensName);
    }
}
Events
The KYC system emits the following events:

KycRequested: When a user requests KYC verification
KycLevelUpdated: When a user's KYC level is updated
KycStatusUpdated: When a user's KYC status changes
KycRevoked: When a user's KYC is revoked
KycRestored: When a revoked KYC is restored
AddressApproved: When an address is approved for a specific KYC level
EnsNameApproved: When an ENS name is approved for a user
Best Practices
Error Handling

Always implement proper error handling for contract interactions
Check for transaction failures and network issues
Implement retry mechanisms for failed transactions
Security

Never expose private keys in frontend code
Use secure methods to store and manage user credentials
Implement proper access control for admin functions
User Experience

Provide clear feedback about KYC status
Implement loading states for blockchain operations
Handle network delays gracefully
Testing

Test all KYC levels and status combinations
Verify ENS name integration
Test error scenarios and edge cases