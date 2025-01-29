export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: 'ethereum' | 'solana';
  blockNumber?: number;
  gasUsed?: string;
  fee?: string;
}
