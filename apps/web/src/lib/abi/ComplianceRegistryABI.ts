export const ComplianceRegistryABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
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
      },
      {
        "name": "encryptedKey",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auditorKeyGrants",
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
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "stateMutability": "view"
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
    "name": "getAuditorKeyGrant",
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
    "outputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
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
        "name": "encryptedPayload",
        "type": "bytes",
        "internalType": "bytes"
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
        "name": "encryptedPayload",
        "type": "bytes",
        "internalType": "bytes"
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
    "name": "AuditorKeyGranted",
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
    "type": "error",
    "name": "ComplianceRegistry__AlreadyRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__AuditorAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ComplianceRegistry__MaxAuditorsReached",
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
    "name": "ComplianceRegistry__ZeroAddress",
    "inputs": []
  }
] as const;