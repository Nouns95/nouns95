import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NOUNS_CONTRACTS } from '../../domain/constants/contracts';

// Contract address for the Nouns DAO Governor contract
const NOUNS_DAO_CONTRACT = NOUNS_CONTRACTS.GOVERNOR.address;

// ABI for the proposeBySigs function
const PROPOSE_BY_SIGS_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "sig", type: "bytes" },
          { internalType: "address", name: "signer", type: "address" },
          { internalType: "uint256", name: "expirationTimestamp", type: "uint256" }
        ],
        internalType: "struct NounsDAOTypes.ProposerSignature[]",
        name: "proposerSignatures",
        type: "tuple[]"
      },
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" }
    ],
    name: "proposeBySigs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "sig", type: "bytes" },
          { internalType: "address", name: "signer", type: "address" },
          { internalType: "uint256", name: "expirationTimestamp", type: "uint256" }
        ],
        internalType: "struct NounsDAOTypes.ProposerSignature[]",
        name: "proposerSignatures",
        type: "tuple[]"
      },
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint32", name: "clientId", type: "uint32" }
    ],
    name: "proposeBySigs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

const CLIENT_ID = 11; // Our client ID for Nouns95

interface ProposerSignature {
  sig: string;
  signer: string;
  expirationTimestamp: number;
}

interface PromoteCandidateParams {
  proposerSignatures: ProposerSignature[];
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  description: string;
}

interface PromoteState {
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  transactionHash?: string;
  proposalId?: number;
}

export function usePromoteCandidate() {
  const { address, isConnected } = useAccount();
  const [promoteState, setPromoteState] = useState<PromoteState>({
    isSuccess: false,
    isError: false,
    error: null,
  });

  const { 
    writeContract, 
    data: transactionHash,
    error: writeError,
    isPending: isWritePending 
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const promoteCandidate = async (params: PromoteCandidateParams) => {
    if (!isConnected || !address) {
      setPromoteState({
        isSuccess: false,
        isError: true,
        error: new Error('Please connect your wallet first'),
      });
      return;
    }

    try {
      // Reset previous states
      setPromoteState({
        isSuccess: false,
        isError: false,
        error: null,
      });

      // Promote candidate with parameters

      // Prepare the proposer signatures array
      const proposerSignatures = params.proposerSignatures.map(sig => ({
        sig: sig.sig as `0x${string}`,
        signer: sig.signer as `0x${string}`,
        expirationTimestamp: BigInt(sig.expirationTimestamp),
      }));

      // Prepare proposal data
      const targets = params.targets.map(t => t as `0x${string}`);
      const values = params.values.map(v => BigInt(v || '0'));
      const signatures = params.signatures;
      const calldatas = params.calldatas.map(c => {
        if (!c || c === '') return '0x' as `0x${string}`;
        return (c.startsWith('0x') ? c : `0x${c}`) as `0x${string}`;
      });

      // Call the contract with client ID
      writeContract({
        address: NOUNS_DAO_CONTRACT as `0x${string}`,
        abi: PROPOSE_BY_SIGS_ABI,
        functionName: 'proposeBySigs',
        args: [
          proposerSignatures,
          targets,
          values,
          signatures,
          calldatas,
          params.description,
          CLIENT_ID,
        ],
      });

    } catch (error) {
      // Error promoting candidate
      setPromoteState({
        isSuccess: false,
        isError: true,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      });
    }
  };

  // Update state based on transaction status
  useEffect(() => {
    if (isConfirmed && receipt) {
      // Extract proposal ID from the transaction receipt logs
      // The ProposalCreated event should contain the proposal ID
      let proposalId: number | undefined;
      
      // Look for ProposalCreated or ProposalCreatedWithRequirements event
      if (receipt.logs) {
        for (const log of receipt.logs) {
          // The first topic after the event signature should be the proposal ID
          if (log.topics && log.topics.length > 1) {
            try {
              proposalId = parseInt(log.topics[1] || '0x0', 16);
              break;
            } catch {
              // Continue looking
            }
          }
        }
      }

      setPromoteState({
        isSuccess: true,
        isError: false,
        error: null,
        transactionHash: transactionHash,
        proposalId,
      });
    } else if (writeError) {
      setPromoteState({
        isSuccess: false,
        isError: true,
        error: writeError,
      });
    }
  }, [isConfirmed, writeError, transactionHash, receipt]);

  return {
    promoteCandidate,
    isLoading: isWritePending || isConfirming,
    isSuccess: promoteState.isSuccess,
    isError: promoteState.isError,
    error: promoteState.error,
    transactionHash: promoteState.transactionHash,
    proposalId: promoteState.proposalId,
    isConnected,
    address,
  };
}
