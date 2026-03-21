export const MpIntentRegistryABI = [
  {
    "type": "function",
    "name": "MAX_DURATION",
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
    "name": "MAX_RECIPIENTS",
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
    "name": "MIN_INTERVAL",
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
    "name": "cancelIntent",
    "inputs": [
      {
        "name": "intentId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkUpkeep",
    "inputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "upkeepNeeded",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "performData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createIntent",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "recipients",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "duration",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "interval",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "transactionStartTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "revertOnFailure",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "complianceData",
        "type": "tuple",
        "internalType": "struct MpIntentRegistry.ComplianceMetadata",
        "components": [
          {
            "name": "entityIds",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "jurisdictions",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Jurisdiction[]"
          },
          {
            "name": "categories",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Category[]"
          },
          {
            "name": "referenceId",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getActiveIntents",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getIntent",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "intentId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct MpIntentRegistry.Intent",
        "components": [
          {
            "name": "id",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "recipients",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "amounts",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "transactionCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalTransactionCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "interval",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "transactionStartTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "transactionEndTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "latestTransactionTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "active",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "revertOnFailure",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "failedAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "compliance",
            "type": "tuple",
            "internalType": "struct MpIntentRegistry.ComplianceMetadata",
            "components": [
              {
                "name": "entityIds",
                "type": "string[]",
                "internalType": "string[]"
              },
              {
                "name": "jurisdictions",
                "type": "uint8[]",
                "internalType": "enum MpIntentRegistry.Jurisdiction[]"
              },
              {
                "name": "categories",
                "type": "uint8[]",
                "internalType": "enum MpIntentRegistry.Category[]"
              },
              {
                "name": "referenceId",
                "type": "string",
                "internalType": "string"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRegisteredWalletsCount",
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
    "name": "intentCounter",
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
    "name": "isWalletRegistered",
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
    "name": "performUpkeep",
    "inputs": [
      {
        "name": "performData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registeredWallets",
    "inputs": [
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
    "name": "walletActiveIntentIds",
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
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "walletCommittedFunds",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "walletIntents",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "transactionCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalTransactionCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "interval",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "transactionStartTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "transactionEndTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "latestTransactionTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "revertOnFailure",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "failedAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "compliance",
        "type": "tuple",
        "internalType": "struct MpIntentRegistry.ComplianceMetadata",
        "components": [
          {
            "name": "entityIds",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "jurisdictions",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Jurisdiction[]"
          },
          {
            "name": "categories",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Category[]"
          },
          {
            "name": "referenceId",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "IntentCancelled",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "intentId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "amountRefunded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "failedAmountRecovered",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IntentCreated",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "intentId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "totalCommitment",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalTransactionCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "interval",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "duration",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "transactionStartTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "transactionEndTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "recipients",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      },
      {
        "name": "amounts",
        "type": "uint256[]",
        "indexed": false,
        "internalType": "uint256[]"
      },
      {
        "name": "compliance",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct MpIntentRegistry.ComplianceMetadata",
        "components": [
          {
            "name": "entityIds",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "jurisdictions",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Jurisdiction[]"
          },
          {
            "name": "categories",
            "type": "uint8[]",
            "internalType": "enum MpIntentRegistry.Category[]"
          },
          {
            "name": "referenceId",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IntentExecuted",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "intentId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "transactionCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WalletRegistered",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__ArrayLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InsufficientFunds",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__IntentNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__IntentNotExecutable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__IntentNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidComplianceMetadata",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidInterval",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidRecipient",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__InvalidTotalTransactionCount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__NoRecipients",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__StartTimeInPast",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__TooManyRecipients",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MpIntentRegistry__Unauthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
] as const

