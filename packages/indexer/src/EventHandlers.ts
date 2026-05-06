/*
 * Complyr Indexer - Event Handlers
 * Indexes wallet activity, payments, intents, and audit data
 */
import {
  SmartWallet,
  SmartWalletFactory,
  IntentRegistry,
  MockUSDC,
  AuditRegistry,
  Transaction,
  TransactionType,
  Wallet,
  Intent,
} from "generated";

// Function selector mappings
const SELECTORS: Record<string, string> = {
  "0xa9059cbb": "transfer",
  "0x095ea7b3": "approve",
  "0x23b872dd": "transferFrom",
};

const PERFORM_UPKEEP_SELECTOR = "0x4585e33b";
const EXECUTE_BATCH_INTENT_SELECTOR = "0x4cc42f81";

function isAutomatedUpkeep(input: string): boolean {
  const selector = input.slice(0, 10).toLowerCase();
  return selector === PERFORM_UPKEEP_SELECTOR || selector === EXECUTE_BATCH_INTENT_SELECTOR;
}

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// ============================================
// FACTORY EVENTS
// ============================================

SmartWalletFactory.AccountCreated.contractRegister(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();
  context.addSmartWallet(walletId);
});

SmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();

  const wallet: Wallet = {
    id: walletId,
    owner: event.params.owner.toString(),
    deployedAt: BigInt(event.block.timestamp),
    deployedBlock: BigInt(event.block.number),
    deployedTx: event.transaction.hash,
    totalTransactionCount: 0,
  };
  context.Wallet.set(wallet);

  const details = JSON.stringify({
    walletAddress: walletId,
    owner: event.params.owner.toString(),
    deployedBy: "Factory"
  });

  const transaction: Transaction = {
    id: event.transaction.hash,
    wallet_id: walletId,
    transactionType: "WALLET_CREATED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Account Activated",
    details: details
  };
  context.Transaction.set(transaction);
});

// ============================================
// MOCK USDC EVENTS
// ============================================

MockUSDC.Transfer.handler(async ({ event, context }) => {
  const walletId = event.params.from.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);
  
  if (!wallet) return;

  // Skip if this transfer is part of an automated upkeep/intent execution
  // to avoid duplicate entries in the transaction history
  if (isAutomatedUpkeep(event.transaction.input)) return;

  const txHash = event.transaction.hash;
  const transactionId = `${txHash}`; // One transaction entity per EVM transaction

  let transaction = await context.Transaction.get(transactionId);
  
  if (!transaction) {
    transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "EXECUTE",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: event.logIndex,
      title: "Single Payment",
      details: JSON.stringify({
        calls: [],
        batchSize: 0,
        totalValue: "0"
      })
    };
  }

  const details = JSON.parse(transaction.details);
  
  details.calls.push({
    recipient: event.params.to.toString(),
    amount: event.params.value.toString(),
    token: "USDC",
    functionCall: "Token Transfer"
  });
  
  details.batchSize = details.calls.length;
  details.totalValue = (BigInt(details.totalValue || "0") + BigInt(event.params.value)).toString();

  let newTxType = transaction.transactionType;
  let newTitle = transaction.title;

  if (details.batchSize > 1) {
    newTxType = "EXECUTE_BATCH";
    newTitle = "Batch Payment";
    details.token = "USDC";
  } else {
    newTxType = "EXECUTE";
    newTitle = "Single Payment";
    // Surface the first call's data to the top level for single payments
    details.recipient = event.params.to.toString();
    details.amount = event.params.value.toString();
    details.functionCall = "Token Transfer";
    details.token = "USDC";
  }

  const updatedTransaction: Transaction = {
    ...transaction,
    transactionType: newTxType,
    title: newTitle,
    details: JSON.stringify(details)
  };
  
  context.Transaction.set(updatedTransaction);

  // Note: Only increment totalTransactionCount once per EVM tx to prevent double counting
  if (details.batchSize === 1) {
    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });
  }
});

// ============================================
// SMART WALLET EVENTS
// ============================================

SmartWallet.WalletAction.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);
  
  if (!wallet) return;

  // Skip if this transfer is part of an automated upkeep/intent execution
  // to avoid duplicate entries in the transaction history
  if (isAutomatedUpkeep(event.transaction.input)) return;

  // Only track native ETH transfers (value > 0 and no data sent to contract)
  if (event.params.value > 0n && event.params.selector === "0x00000000") {
    const txHash = event.transaction.hash;
    const transactionId = `${txHash}`;

    let transaction = await context.Transaction.get(transactionId);
    
    if (!transaction) {
      transaction = {
        id: transactionId,
        wallet_id: walletId,
        transactionType: "EXECUTE",
        timestamp: BigInt(event.block.timestamp),
        blockNumber: BigInt(event.block.number),
        txHash: txHash,
        logIndex: event.logIndex,
        title: "Single Payment",
        details: JSON.stringify({
          calls: [],
          batchSize: 0,
          totalValue: "0"
        })
      };
    }

    const details = JSON.parse(transaction.details);
    
    details.calls.push({
      recipient: event.params.target.toString(),
      amount: event.params.value.toString(),
      token: "ETH",
      functionCall: "Native ETH Transfer"
    });
    
    details.batchSize = details.calls.length;
    details.totalValue = (BigInt(details.totalValue || "0") + event.params.value).toString();

    let newTxType = transaction.transactionType;
    let newTitle = transaction.title;

    if (details.batchSize > 1) {
      newTxType = "EXECUTE_BATCH";
      newTitle = "Batch Payment";
      details.token = "ETH";
    } else {
      newTxType = "EXECUTE";
      newTitle = "Single Payment";
      details.recipient = event.params.target.toString();
      details.amount = event.params.value.toString();
      details.functionCall = "Native ETH Transfer";
      details.token = "ETH";
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      transactionType: newTxType,
      title: newTitle,
      details: JSON.stringify(details)
    };
    
    context.Transaction.set(updatedTransaction);

    if (details.batchSize === 1) {
      context.Wallet.set({
        ...wallet,
        totalTransactionCount: wallet.totalTransactionCount + 1
      });
    }
  }
});

SmartWallet.TransferFailed.handler(async ({ event, context }) => {
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: intent ? intent.name : "Unknown Schedule",
    executionNumber: Number(event.params.transactionCount),
    recipient: event.params.recipient.toString(),
    token: intent ? intent.token : "ETH",
    amount: event.params.amount.toString(),
    reason: "Transfer Failed"
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: event.srcAddress.toString().toLowerCase(),
    transactionType: "TRANSFER_FAILED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Payment Failed",
    details: details
  };

  context.Transaction.set(transaction);
});

SmartWallet.ERC20Transferred.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);
  if (!wallet) return;
  if (isAutomatedUpkeep(event.transaction.input)) return;

  const txHash = event.transaction.hash;
  const transactionId = `${txHash}`;

  let transaction = await context.Transaction.get(transactionId);
  if (!transaction) {
    transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "ERC20_TRANSFER",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: event.logIndex,
      title: "Token Transfer",
      details: JSON.stringify({
        recipient: event.params.to.toString(),
        amount: event.params.amount.toString(),
        token: "USDC",
        functionCall: "Token Transfer"
      })
    };
  }
  context.Transaction.set(transaction);
});

SmartWallet.AuditRecorded.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);
  if (!wallet) return;

  const txHash = event.transaction.hash;
  const transactionId = `${txHash}-audit`;

  const transaction: Transaction = {
    id: transactionId,
    wallet_id: walletId,
    transactionType: "AUDIT_RECORDED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: txHash,
    logIndex: event.logIndex,
    title: "Audit Anchored",
    details: JSON.stringify({
      recordId: event.params.txHash.toString(),
      status: "Verified"
    })
  };
  context.Transaction.set(transaction);
});

// ============================================
// AUDIT REGISTRY EVENTS
// ============================================

AuditRegistry.AccountRegistered.handler(async ({ event, context }) => {
  const walletId = event.params.proxyAccount.toString().toLowerCase();
  
  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "ACCOUNT_REGISTERED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Audit Registry Linked",
    details: JSON.stringify({
      masterEOA: event.params.masterEOA.toString()
    })
  };
  context.Transaction.set(transaction);
});

// ============================================
// INTENT REGISTRY EVENTS
// ============================================

IntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  
  const tokenSymbol = event.params.token.toString() === "0x0000000000000000000000000000000000000000" 
    ? "ETH" 
    : event.params.token.toString();

  const intent: Intent = {
    id: intentId,
    wallet: walletId,
    token: tokenSymbol,
    name: event.params.name,
    totalTransactionCount: event.params.totalTransactionCount,
    recipients: event.params.recipients.map(r => r.toString().toLowerCase()),
    amounts: event.params.amounts,
    interval: event.params.interval,
    duration: event.params.duration
  };
  context.Intent.set(intent);

  const details = JSON.stringify({
    scheduleName: event.params.name,
    intentId: intentId,
    token: tokenSymbol,
    totalCommitment: event.params.totalCommitment.toString(),
    recipientCount: event.params.recipients.length,
    recipients: event.params.recipients.map((r, i) => ({
      address: r.toString(),
      amount: event.params.amounts[i].toString()
    })),
    frequency: `Every ${event.params.interval} seconds`,
    duration: `${event.params.duration} seconds`,
    totalExecutions: Number(event.params.totalTransactionCount),
    startDate: formatTimestamp(Number(event.params.transactionStartTime)),
    endDate: formatTimestamp(Number(event.params.transactionEndTime))
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_CREATED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Payment Schedule Created",
    details: details
  };
  context.Transaction.set(transaction);
});

IntentRegistry.IntentExecuted.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  const txHash = event.transaction.hash;

  const intent = await context.Intent.get(intentId);
  const existingTxForHash = await context.Transaction.get(txHash);

  const recipientsList = intent ? intent.recipients.map((r, i) => ({
    address: r,
    amount: intent.amounts[i].toString(),
    status: "success"
  })) : [];

  const details = JSON.stringify({
    scheduleName: event.params.name,
    executionNumber: Number(event.params.transactionCount),
    totalExecutions: intent ? Number(intent.totalTransactionCount) : 0,
    recipientCount: intent ? intent.recipients.length : 0,
    token: intent ? intent.token : "ETH",
    totalAmount: event.params.totalAmount.toString(),
    successfulTransfers: recipientsList.length,
    failedTransfers: 0,
    recipients: recipientsList
  });

  const transaction: Transaction = {
    id: txHash,
    wallet_id: walletId,
    transactionType: "INTENT_EXECUTION",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: txHash,
    logIndex: event.logIndex,
    title: "Scheduled Payment",
    details: details
  };
  context.Transaction.set(transaction);

  // Update wallet totalTransactionCount
  const wallet = await context.Wallet.get(walletId);
  if (wallet && !existingTxForHash) {
    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });
  }
});

IntentRegistry.IntentCancelled.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: event.params.name,
    intentId: intentId,
    token: intent ? intent.token : "ETH",
    amountRefunded: event.params.amountRefunded.toString(),
    failedAmountRecovered: event.params.failedAmountRecovered.toString(),
    executionsCompleted: intent ? Math.floor(Number(intent.duration) / Number(intent.interval)) : 0,
    totalExecutions: intent ? Number(intent.totalTransactionCount) : 0
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_CANCELLED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Scheduled Payment Canceled",
    details: details
  };
  context.Transaction.set(transaction);
});
