/*
 * MantlePay Indexer - Event Handlers
 * Indexes wallet activity, payments, intents, and compliance data
 */
import {
  SmartWallet,
  SmartWalletFactory,
  IntentRegistry,
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

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// GLOBAL STORE for Batch Calls in the same block/tx
let batchCallsCache: Map<string, any[]> = new Map();

// GLOBAL STORE for Compliance data in the same tx
let complianceCache: Map<string, {
  entityIds: string[];
  jurisdiction: string;
  category: string;
  referenceId: string;
}> = new Map();

let currentWalletAction: {
  selector: string;
  actionType: string;
  txHash: string;
} | null = null;

// ============================================
// FACTORY EVENTS
// ============================================

SmartWalletFactory.AccountCreated.contractRegister(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();
  context.addSmartWallet(walletId);
});

SmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();

  // Create Wallet entity
  const wallet: Wallet = {
    id: walletId,
    owner: event.params.owner.toString(),
    deployedAt: BigInt(event.block.timestamp),
    deployedBlock: BigInt(event.block.number),
    deployedTx: event.transaction.hash,
    totalTransactionCount: 0,
  };
  context.Wallet.set(wallet);

  // Create WALLET_CREATED transaction
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
// SMART WALLET EVENTS
// ============================================

SmartWallet.WalletAction.handler(async ({ event }) => {
  currentWalletAction = {
    selector: event.params.selector,
    actionType: event.params.actionType,
    txHash: event.transaction.hash
  };

  // Aggregate for Batch Calls
  if (!batchCallsCache.has(event.transaction.hash)) {
    batchCallsCache.set(event.transaction.hash, []);
  }

  const actions = batchCallsCache.get(event.transaction.hash);
  if (actions) {
    actions.push({
      target: event.params.target.toString(),
      value: event.params.value.toString(),
      selector: event.params.selector,
      actionType: event.params.actionType
    });
  }
});

SmartWallet.Executed.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    // Ignore initialization transactions (0 value, empty data)
    if (
      event.params.value.toString() === "0" &&
      (event.params.data === "0x" || event.params.data === "")
    ) {
      return;
    }

    const txHash = event.transaction.hash;
    const selector = event.params.data.slice(0, 10);
    const logIndex = event.logIndex;
    const transactionId = `${txHash}-${logIndex}`;

    let title = "Single Payment";
    let detailsObj: any = {
      target: event.params.target.toString(),
      value: event.params.value.toString(),
      functionCall: SELECTORS[selector] || "native_transfer",
      selector: selector,
    };

    // For native FLOW transfers (no data or 0x)
    if (event.params.data === "0x" || event.params.data.length <= 10) {
      detailsObj.functionCall = "Native FLOW Transfer";
      detailsObj.amount = event.params.value.toString();
      detailsObj.recipient = event.params.target.toString();
    }

    const transaction: Transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "EXECUTE",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: logIndex,
      title: title,
      details: JSON.stringify(detailsObj)
    };

    context.Transaction.set(transaction);

    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });
  }
});

SmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    const txHash = event.transaction.hash;
    const logIndex = event.logIndex;
    const transactionId = `${txHash}-${logIndex}`;

    // Get wallet actions from cache
    const walletActions = batchCallsCache.get(txHash) || [];

    // Build calls array from wallet actions (native FLOW transfers)
    const calls = walletActions.map(action => ({
      target: action.target,
      value: action.value,
      recipient: action.target,
      functionCall: "Native FLOW Transfer",
    }));

    // Calculate total value
    const totalValue = walletActions.reduce((sum, a) => sum + BigInt(a.value), 0n);

    const detailsObj: any = {
      batchSize: Number(event.params.batchSize),
      totalValue: totalValue.toString(),
      calls: calls
    };

    const transaction: Transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "EXECUTE_BATCH",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: logIndex,
      title: "Batch Payment",
      details: JSON.stringify(detailsObj)
    };

    context.Transaction.set(transaction);

    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });

    // Clean up cache
    batchCallsCache.delete(txHash);
  }
});

SmartWallet.TransferFailed.handler(async ({ event, context }) => {
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: intent ? intent.name : "Unknown Schedule",
    executionNumber: Number(event.params.transactionCount),
    recipient: event.params.recipient.toString(),
    token: "FLOW",
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

// ============================================
// INTENT REGISTRY EVENTS
// ============================================

IntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();

  // Create Intent helper entity
  const intent: Intent = {
    id: intentId,
    wallet: walletId,
    token: "FLOW",
    name: event.params.name,
    totalTransactionCount: event.params.totalTransactionCount,
    recipients: event.params.recipients.map(r => r.toString().toLowerCase()),
    amounts: event.params.amounts,
    interval: event.params.interval,
    duration: event.params.duration
  };
  context.Intent.set(intent);

  // Build transaction details
  const details = JSON.stringify({
    scheduleName: event.params.name,
    intentId: intentId,
    token: "FLOW",
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

  const intent = await context.Intent.get(intentId);

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
    token: "FLOW",
    totalAmount: event.params.totalAmount.toString(),
    successfulTransfers: recipientsList.length,
    failedTransfers: 0,
    recipients: recipientsList
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_EXECUTION",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Scheduled Payment",
    details: details
  };
  context.Transaction.set(transaction);
});

IntentRegistry.IntentCancelled.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: event.params.name,
    token: "FLOW",
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
