import { GraphQLClient, gql } from 'graphql-request';

// TODO: Move to env var
const ENVIO_API_URL = 'https://indexer.dev.hyperindex.xyz/a130455/v1/graphql';

export const envioClient = new GraphQLClient(ENVIO_API_URL);

export enum ActivityType {
  WALLET_CREATED = "WALLET_CREATED",
  EXECUTE = "EXECUTE",
  EXECUTE_BATCH = "EXECUTE_BATCH",
  INTENT_CREATED = "INTENT_CREATED",
  INTENT_EXECUTION = "INTENT_EXECUTION",
  INTENT_CANCELLED = "INTENT_CANCELLED",
  TRANSFER_FAILED = "TRANSFER_FAILED"
}

export interface Transaction {
  id: string;
  transactionType: ActivityType;
  timestamp: string;
  txHash: string;
  title: string;
  details: string; // JSON string
}

export const GET_WALLET_ACTIVITY = gql`
  query GetWalletActivityFeed(
    $walletId: String!, 
    $limit: Int = 50, 
    $offset: Int = 0
  ) {
    Wallet(where: { id: { _eq: $walletId } }) {
      id
      owner
      deployedAt
      totalTransactionCount
      
      transactions(
        limit: $limit
        offset: $offset
        order_by: { timestamp: desc }
      ) {
        id
        transactionType
        timestamp
        txHash
        title
        details
      }
    }
  }
`;

export const GET_ALL_TRANSACTIONS = gql`
  query GetAllTransactions($walletId: String!) {
    Transaction(
      where: { wallet_id: { _eq: $walletId } }
      order_by: { timestamp: desc }
    ) {
      id
      transactionType
      timestamp
      txHash
      title
      details
    }
  }
`;
