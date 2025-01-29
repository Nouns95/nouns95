import { createConfig } from '@privy-io/wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { Transaction } from '../models/Transaction';
import { NFT } from '../models/NFT';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export class EthereumService {
  private static instance: EthereumService;

  private constructor() {}

  public static getInstance(): EthereumService {
    if (!EthereumService.instance) {
      EthereumService.instance = new EthereumService();
    }
    return EthereumService.instance;
  }

  public async getTransactions(address: string): Promise<Transaction[]> {
    // Will implement using Etherscan API or similar
    return [];
  }

  public async getNFTs(address: string): Promise<NFT[]> {
    // Will implement using Alchemy API or similar
    return [];
  }
}
