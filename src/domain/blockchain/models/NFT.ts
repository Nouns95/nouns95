export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  network: 'ethereum' | 'solana';
  standard: 'ERC721' | 'ERC1155' | 'SPL';
}
