import { ethers } from 'ethers';

export const NOUNS_CONTRACTS = {
  TREASURY: {
    address: '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71',
    name: 'Treasury'
  },
  GOVERNOR: {
    address: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
    name: 'Governor'
  },
  TOKEN_BUYER: {
    address: '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5',
    name: 'Token Buyer'
  },
  USDC_PAYER: {
    address: '0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D',
    name: 'USDC Payer'
  },
  AUCTION_HOUSE: {
    address: '0x830BD73E4184ceF73443C15111a1DF14e495C706',
    name: 'Auction House'
  },
  TOKEN: {
    address: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
    name: 'Token'
  },
  DESCRIPTOR_V3: {
    address: '0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac',
    name: 'Descriptor V3'
  },
  CANDIDATES: {
    address: '0xf790A5f59678dd733fb3De93493A91f472ca1365',
    name: 'Candidates'
  },
  STREAM_FACTORY: {
    address: '0x0fd206FC7A7dBcD5661157eDCb1FFDD0D02A61ff',
    name: 'Stream Factory'
  },
  TREASURY_V1: {
    address: '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
    name: 'Treasury V1'
  },
  FORK_ESCROW: {
    address: '0x44d97D22B3d37d837cE4b22773aAd9d1566055D9',
    name: 'Fork Escrow'
  },
  FORK_DAO_DEPLOYER: {
    address: '0xcD65e61f70e0b1Aa433ca1d9A6FC2332e9e73cE3',
    name: 'Fork DAO Deployer'
  },
  CLIENT_REWARDS: {
    address: '0x883860178F95d0C82413eDc1D6De530cB4771d55',
    name: 'Client Rewards'
  }
} as const;

// Helper function to get contract name from address
export const getContractName = (address: string): string => {
  const contract = Object.values(NOUNS_CONTRACTS).find(
    c => c.address.toLowerCase() === address.toLowerCase()
  );
  return contract ? contract.name : address;
};

// Common function signatures and their parameter types
const FUNCTION_SIGNATURES: Record<string, { name: string, params: Array<{ name: string, type: string }> }> = {
  'setPendingAdmin(address)': {
    name: 'Set Pending Admin',
    params: [{ name: 'newAdmin', type: 'address' }]
  },
  'acceptAdmin()': {
    name: 'Accept Admin Role',
    params: []
  },
  'setContractImage(string)': {
    name: 'Set Contract Image',
    params: [{ name: 'newImage', type: 'string' }]
  },
  'setDescriptor(address)': {
    name: 'Set Descriptor',
    params: [{ name: 'descriptor', type: 'address' }]
  },
  'transferFrom(address,address,uint256)': {
    name: 'Transfer Token',
    params: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ]
  },
  'approve(address,uint256)': {
    name: 'Approve Token Transfer',
    params: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ]
  },
  'mint()': {
    name: 'Mint Token',
    params: []
  },
  'setBaseURI(string)': {
    name: 'Set Base URI',
    params: [{ name: 'baseURI', type: 'string' }]
  },
  'sendOrRegisterDebt(address,uint256)': {
    name: 'Send or Register Debt',
    params: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  'transfer(address,uint256)': {
    name: 'Transfer',
    params: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  'setImplementation(address)': {
    name: 'Set Implementation',
    params: [{ name: 'implementation', type: 'address' }]
  },
  'setProposalThreshold(uint256)': {
    name: 'Set Proposal Threshold',
    params: [{ name: 'newProposalThreshold', type: 'uint256' }]
  },
  'setQuorumVotesBPS(uint256)': {
    name: 'Set Quorum Votes BPS',
    params: [{ name: 'newQuorumVotesBPS', type: 'uint256' }]
  },
  'setVotingDelay(uint256)': {
    name: 'Set Voting Delay',
    params: [{ name: 'newVotingDelay', type: 'uint256' }]
  },
  'setVotingPeriod(uint256)': {
    name: 'Set Voting Period',
    params: [{ name: 'newVotingPeriod', type: 'uint256' }]
  },
  'setVetoer(address)': {
    name: 'Set Vetoer',
    params: [{ name: 'newVetoer', type: 'address' }]
  },
  'removeVetoer()': {
    name: 'Remove Vetoer',
    params: []
  },
  'setMaxQuorumVotesBPS(uint256)': {
    name: 'Set Max Quorum Votes BPS',
    params: [{ name: 'newMaxQuorumVotesBPS', type: 'uint256' }]
  },
  'setMinQuorumVotesBPS(uint256)': {
    name: 'Set Min Quorum Votes BPS',
    params: [{ name: 'newMinQuorumVotesBPS', type: 'uint256' }]
  },
  'updateQuorumCoefficient(uint32)': {
    name: 'Update Quorum Coefficient',
    params: [{ name: 'newQuorumCoefficient', type: 'uint32' }]
  }
};

// Helper function to format token amounts
export const formatTokenAmount = (amount: bigint, decimals: number = 18, symbol: string = 'ETH'): string => {
  try {
    const isUSDC = symbol === 'USDC';
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    
    // Format the fractional part to appropriate decimal places
    let fractionStr = fraction.toString().padStart(decimals, '0');
    // For USDC show 2 decimals, for ETH show 4 if non-zero
    const decimalPlaces = isUSDC ? 2 : 4;
    fractionStr = fractionStr.slice(0, decimalPlaces);
    
    // Remove trailing zeros
    fractionStr = fractionStr.replace(/0+$/, '');
    
    // Format the whole number with commas
    const wholeStr = whole.toLocaleString();
    
    // Combine whole and fraction
    let result = wholeStr;
    if (fractionStr.length > 0) {
      result += '.' + fractionStr;
    }
    
    return `${result} ${symbol}`;
  } catch {
    return amount.toString();
  }
};

// Helper function to decode parameters based on their types
const decodeParameter = async (
  type: string, 
  value: string, 
  functionName?: string, 
  targetContract?: string,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> => {
  try {
    switch (type) {
      case 'address': {
        // For addresses, try to get contract name first
        const contractName = getContractName(value);
        if (contractName !== value) {
          return contractName;
        }

        // If not a known contract, try to resolve ENS name
        if (provider) {
          try {
            const ensName = await provider.lookupAddress(value);
            if (ensName) {
              return ensName;
            }
          } catch (error) {
            console.warn('Error resolving ENS name:', error);
          }
        }

        // If no ENS name, return formatted address
        return `${value.slice(0, 6)}...${value.slice(-4)}`;
      }
      case 'uint256':
        // For numbers, check if they're token amounts based on the target contract and function name
        const num = BigInt(value);
        const isUSDC = targetContract?.includes('USDC') || 
                      functionName?.toLowerCase().includes('usdc') || 
                      functionName?.toLowerCase().includes('usd');
        
        if (isUSDC) {
          return formatTokenAmount(num, 6, 'USDC');
        } else if (functionName?.toLowerCase().includes('eth') ||
                   functionName?.toLowerCase().includes('transfer') ||
                   functionName?.toLowerCase().includes('debt')) {
          return formatTokenAmount(num, 18, 'ETH');
        }
        return num.toLocaleString();
      case 'string':
        // For strings, return as is but truncate if too long
        return value.length > 50 ? `${value.slice(0, 47)}...` : value;
      default:
        return value;
    }
  } catch {
    return value;
  }
};

// Function to decode calldata into human readable format
export const decodeCalldata = async (
  signature: string, 
  calldata: string, 
  targetContract?: string,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> => {
  try {
    const funcInfo = FUNCTION_SIGNATURES[signature];
    if (!funcInfo) {
      // If we don't recognize the signature, return it formatted
      return `${signature} with data: ${calldata.slice(0, 10)}...${calldata.slice(-8)}`;
    }

    if (funcInfo.params.length === 0) {
      return funcInfo.name;
    }

    // For known functions, decode each parameter
    const paramPromises = funcInfo.params.map(async (param, index) => {
      // This is a simplified version - in reality you'd need proper ABI decoding
      // For now, we'll just take 64 chars (32 bytes) per parameter from the calldata
      const startPos = 2 + (index * 64); // skip 0x and take 64 chars per param
      const value = '0x' + calldata.slice(startPos, startPos + 64).replace(/^0+/, '');
      const decodedValue = await decodeParameter(param.type, value, funcInfo.name, targetContract, provider);
      return `${param.name}: ${decodedValue}`;
    });

    const decodedParams = await Promise.all(paramPromises);
    return `${funcInfo.name} (${decodedParams.join(', ')})`;
  } catch {
    // If anything goes wrong, return the original data
    return `${signature} with data: ${calldata.slice(0, 10)}...${calldata.slice(-8)}`;
  }
}; 