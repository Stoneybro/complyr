export const ComplianceRegistryABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "MAX_ACTIVE_REVIEW_TESTS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_AUDITORS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_CATEGORY_ID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_JURISDICTION_ID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addAuditor",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "newAuditor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addAuditorWithAccess",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "newAuditor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "accessLevel",
        "type": "uint8",
        "internalType": "enum ComplianceRegistry.ReviewerAccess"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "authorizedCallers",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "companyAuditors",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "companyMasters",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "confidentialProtocolId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createCategoryExposureReviewTest",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "category",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "thresholdHandle",
        "type": "bytes32",
        "internalType": "externalEuint128"
      },
      {
        "name": "thresholdProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createJurisdictionExposureReviewTest",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "jurisdiction",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "thresholdHandle",
        "type": "bytes32",
        "internalType": "externalEuint128"
      },
      {
        "name": "thresholdProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createLargePaymentReviewTest",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "thresholdHandle",
        "type": "bytes32",
        "internalType": "externalEuint128"
      },
      {
        "name": "thresholdProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createRecipientExposureReviewTest",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "thresholdHandle",
        "type": "bytes32",
        "internalType": "externalEuint128"
      },
      {
        "name": "thresholdProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deactivateReviewTest",
    "inputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAuditorReviewTestIds",
    "inputs": [
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAuditors",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedAmount",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipientIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "euint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedCategory",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipientIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "euint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedCategoryTotal",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "category",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedGlobalTotal",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedJurisdiction",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipientIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "euint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedJurisdictionTotal",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "jurisdiction",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEncryptedRecipientTotal",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecord",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "txHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "recipients",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amountHandles",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "categoryHandles",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "jurisdictionHandles",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "referenceIds",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecordCount",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecordMetadata",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "txHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "recipients",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "referenceIds",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReviewResult",
    "inputs": [
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recordId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "resultHandle",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReviewResultCount",
    "inputs": [
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReviewTest",
    "inputs": [
      {
        "name": "testId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "testType",
        "type": "uint8",
        "internalType": "enum ComplianceRegistry.ReviewTestType"
      },
      {
        "name": "recipientScope",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "numericScope",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "thresholdHandle",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "createdAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAuditorActive",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextReviewTestId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "recordTransaction",
    "inputs": [
      {
        "name": "txHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "recipients",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amountHandles",
        "type": "bytes32[]",
        "internalType": "externalEuint128[]"
      },
      {
        "name": "amountProofs",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "categoryHandles",
        "type": "bytes32[]",
        "internalType": "externalEuint8[]"
      },
      {
        "name": "categoryProofs",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "jurisdictionHandles",
        "type": "bytes32[]",
        "internalType": "externalEuint8[]"
      },
      {
        "name": "jurisdictionProofs",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "referenceIds",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerAccount",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "masterEOA",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeAuditor",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "reviewerAccess",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "reviewer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "accessLevel",
        "type": "uint8",
        "internalType": "enum ComplianceRegistry.ReviewerAccess"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setAuthorizedCaller",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "authorized",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFactory",
    "inputs": [
      {
        "name": "_factory",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalGlobalRecords",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateAuditorAccess",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "accessLevel",
        "type": "uint8",
        "internalType": "enum ComplianceRegistry.ReviewerAccess"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AccountRegistered",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "masterEOA",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuditorAccessUpdated",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accessLevel",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ComplianceRegistry.ReviewerAccess"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuditorAdded",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuditorRemoved",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuthorizedCallerSet",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "authorized",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RecordAppended",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "txHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReviewResultRecorded",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "testId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "recordId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReviewTestCreated",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "testId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "testType",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ComplianceRegistry.ReviewTestType"
      },
      {
        "name": "recipientScope",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "numericScope",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReviewTestDeactivated",
    "inputs": [
      {
        "name": "proxyAccount",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "testId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__AlreadyRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__ArrayLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__AuditorAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__InvalidAccessLevel",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__InvalidRecordIndex",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__InvalidScope",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__MaxAuditorsReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__MaxReviewTestsReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__MissingComplianceInfo",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__NotAuthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__NotRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__ReviewTestNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__ZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SenderNotAllowedToUseHandle",
    "inputs": [
      {
        "name": "handle",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZamaProtocolUnsupported",
    "inputs": []
  }
] as const;
