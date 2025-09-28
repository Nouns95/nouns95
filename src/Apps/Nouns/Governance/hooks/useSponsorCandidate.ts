import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { NOUNS_CONTRACTS } from '../../domain/constants/contracts';

// Contract address for the Nouns Proposal Candidates contract
const PROPOSAL_CANDIDATES_CONTRACT = NOUNS_CONTRACTS.CANDIDATES.address;

// ABI for the addSignature function
const ADD_SIGNATURE_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "sig", type: "bytes" },
      { internalType: "uint256", name: "expirationTimestamp", type: "uint256" },
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "string", name: "slug", type: "string" },
      { internalType: "uint256", name: "proposalIdToUpdate", type: "uint256" },
      { internalType: "bytes", name: "encodedProp", type: "bytes" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "addSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

interface SponsorCandidateParams {
  proposer: string;
  slug: string;
  proposalIdToUpdate?: number;
  targets?: string[];
  values?: string[];
  signatures?: string[];
  calldatas?: string[];
  description?: string;
  reason: string;
  expirationTimestamp?: number;
}

interface SponsorState {
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  transactionHash?: string;
}

export function useSponsorCandidate() {
  const { address, isConnected } = useAccount();
  const [sponsorState, setSponsorState] = useState<SponsorState>({
    isSuccess: false,
    isError: false,
    error: null,
  });
  const [isPending, setIsPending] = useState(false);

  const { 
    writeContract, 
    data: transactionHash,
    error: writeError,
    isPending: isWritePending
  } = useWriteContract();

  const {
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const { signTypedDataAsync } = useSignTypedData();

  const encodeProposalData = (params: SponsorCandidateParams): `0x${string}` => {
    // Encode the proposal data according to the contract's expected format
    const targets = params.targets || [];
    const values = params.values?.map(v => v === '' ? '0' : v).map(v => BigInt(v)) || [];
    const signatures = params.signatures || [];
    const calldatas = params.calldatas?.map(c => {
      // Ensure calldata has proper 0x prefix and format
      if (!c || c === '') return '0x' as `0x${string}`;
      return (c.startsWith('0x') ? c : `0x${c}`) as `0x${string}`;
    }) || [];
    const description = params.description || '';

    // Encode using ABI encoding for the proposal structure - this should match how createProposalCandidate encodes data
    return encodeAbiParameters(
      parseAbiParameters('address[], uint256[], string[], bytes[], string'),
      [targets as `0x${string}`[], values, signatures, calldatas, description]
    );
  };

  const generateSignature = async (params: SponsorCandidateParams): Promise<`0x${string}`> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // EIP-712 domain for Nouns DAO Candidates contract
      const domain = {
        name: 'NounsDAOProposalCandidates',
        version: '1',
        chainId: 1,
        verifyingContract: PROPOSAL_CANDIDATES_CONTRACT as `0x${string}`,
      } as const;

      // EIP-712 types structure - this should match what the contract expects
      const types = {
        Proposal: [
          { name: 'proposer', type: 'address' },
          { name: 'targets', type: 'address[]' },
          { name: 'values', type: 'uint256[]' },
          { name: 'signatures', type: 'string[]' },
          { name: 'calldatas', type: 'bytes[]' },
          { name: 'description', type: 'string' },
          { name: 'slug', type: 'string' },
          { name: 'proposalIdToUpdate', type: 'uint256' },
        ],
      } as const;

      // Prepare the message to sign based on the proposal structure
      const message = {
        proposer: params.proposer as `0x${string}`,
        targets: (params.targets || []) as `0x${string}`[],
        values: (params.values?.map(v => v === '' ? '0' : v).map(v => BigInt(v)) || []),
        signatures: params.signatures || [],
        calldatas: (params.calldatas?.map(c => {
          if (!c || c === '') return '0x' as `0x${string}`;
          return (c.startsWith('0x') ? c : `0x${c}`) as `0x${string}`;
        }) || []),
        description: params.description || '',
        slug: params.slug,
        proposalIdToUpdate: BigInt(params.proposalIdToUpdate || 0),
      } as const;

      // Sign EIP-712 message

      // Sign the typed data using EIP-712
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Proposal',
        message,
      });

      return signature;
    } catch {
      // Error signing typed data
      throw new Error('Failed to sign sponsorship data');
    }
  };

  const sponsorCandidate = async (params: SponsorCandidateParams) => {
    if (!isConnected || !address) {
      setSponsorState({
        isSuccess: false,
        isError: true,
        error: new Error('Please connect your wallet first'),
      });
      return;
    }

    // Prevent multiple simultaneous calls
    if (isPending || isWritePending) {
      // Transaction already in progress
      return;
    }

    try {
      // Set pending state immediately
      setIsPending(true);
      
      // Reset previous states
      setSponsorState({
        isSuccess: false,
        isError: false,
        error: null,
      });

      // Set expiration timestamp (24 hours from now by default)
      const expirationTimestamp = params.expirationTimestamp || Math.floor(Date.now() / 1000) + 86400;
      
      // Encode the proposal data
      const encodedProp = encodeProposalData(params);
      
      // Generate the EIP-712 signature
      const signature = await generateSignature(params);

      // Call the contract
      writeContract({
        address: PROPOSAL_CANDIDATES_CONTRACT as `0x${string}`,
        abi: ADD_SIGNATURE_ABI,
        functionName: 'addSignature',
        args: [
          signature,
          BigInt(expirationTimestamp),
          params.proposer as `0x${string}`,
          params.slug,
          BigInt(params.proposalIdToUpdate || 0),
          encodedProp,
          params.reason,
        ],
      });

    } catch (error) {
      // Error sponsoring candidate
      setIsPending(false); // Reset pending state on error
      setSponsorState({
        isSuccess: false,
        isError: true,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      });
    }
  };

  // Update state based on transaction status
  useEffect(() => {
    if (isConfirmed) {
      setIsPending(false); // Reset pending state on success
      setSponsorState({
        isSuccess: true,
        isError: false,
        error: null,
        transactionHash: transactionHash,
      });
    } else if (writeError) {
      setIsPending(false); // Reset pending state on error
      setSponsorState({
        isSuccess: false,
        isError: true,
        error: writeError,
      });
    }
  }, [isConfirmed, writeError, transactionHash]);

  return {
    sponsorCandidate,
    isSuccess: sponsorState.isSuccess,
    isError: sponsorState.isError,
    error: sponsorState.error,
    transactionHash: sponsorState.transactionHash,
    isConnected,
    address,
    isPending: isPending || isWritePending, // Expose combined pending state
  };
}
