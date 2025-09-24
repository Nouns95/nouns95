import React, { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { 
  BaseError, 
  ContractFunctionExecutionError,
  TransactionExecutionError,
  UserRejectedRequestError
} from 'viem';
import NounsProxyABI from '../../../../domain/abis/NounsProxy';
import CandidatesProxyABI from '../../../../domain/abis/CandidatesProxy';
import { NOUNS_CONTRACTS } from '../../../../domain/constants/contracts';
import { SmartActionEditor } from './SmartActionEditor';
import { MarkdownEditor } from './MarkdownEditor';
import styles from './CreateProposal.module.css';

interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

interface CreateProposalProps {
  onBack: () => void;
}

type ProposalState = 'idle' | 'confirming' | 'pending' | 'error' | 'success';
type CandidateState = 'idle' | 'confirming' | 'pending' | 'error' | 'success';
type TimelockV1State = 'idle' | 'confirming' | 'pending' | 'error' | 'success';

const CLIENT_ID = 11; // Our client ID

export function CreateProposal({ onBack }: CreateProposalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actions, setActions] = useState<ProposalAction[]>([
    { target: '', value: '0', signature: '', calldata: '0x' }
  ]);
  const [proposalState, setProposalState] = useState<ProposalState>('idle');
  const [candidateState, setCandidateState] = useState<CandidateState>('idle');
  const [timelockV1State, setTimelockV1State] = useState<TimelockV1State>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { address, isConnected } = useAccount();

  // Check if user has enough voting power to create a proposal
  const { data: proposalThreshold } = useReadContract({
    address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
    abi: NounsProxyABI,
    functionName: 'proposalThresholdBPS',
  });

  const { data: userVotes } = useReadContract({
    address: NOUNS_CONTRACTS.TOKEN.address as `0x${string}`,
    abi: [
      {
        name: 'getCurrentVotes',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint96' }]
      }
    ],
    functionName: 'getCurrentVotes',
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: NOUNS_CONTRACTS.TOKEN.address as `0x${string}`,
    abi: [
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'totalSupply',
  });

  // Get candidate creation costs
  const { data: createCandidateCost } = useReadContract({
    address: NOUNS_CONTRACTS.CANDIDATES.address as `0x${string}`,
    abi: CandidatesProxyABI,
    functionName: 'createCandidateCost',
  });

  // Use Wagmi's useWriteContract hook for proposal creation
  const {
    writeContract: writeProposal,
    isPending: isCreatingProposal,
    reset: resetProposalState,
    isSuccess: isProposalSuccess
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setProposalState('success');
        // Reset form
        setTitle('');
        setDescription('');
        setActions([{ target: '', value: '0', signature: '', calldata: '0x' }]);
      },
      onError: (error: Error | BaseError) => {
        console.error('Proposal creation error:', error);
        setProposalState('error');
        
        // Handle user rejection
        if (error instanceof UserRejectedRequestError) {
          setErrorMessage('Transaction was cancelled by user');
          return;
        }

        // Handle contract execution errors
        if (error instanceof ContractFunctionExecutionError) {
          const message = error.message;
          
          if (message.includes('insufficient votes')) {
            setErrorMessage('You do not have enough voting power to create a proposal');
          } else if (message.includes('pending proposal')) {
            setErrorMessage('You already have a pending or active proposal. Wait for it to be resolved before creating a new one.');
          } else if (message.includes('targets.length must be != 0')) {
            setErrorMessage('At least one action is required');
          } else if (message.includes('inconsistent parameters')) {
            setErrorMessage('Proposal parameters are inconsistent. Check that all actions have valid targets and parameters.');
          } else {
            const cleanMessage = message.split('Details:')[0]?.trim() || message;
            setErrorMessage('Failed to create proposal: ' + cleanMessage);
          }
          return;
        }

        // Handle transaction execution errors
        if (error instanceof TransactionExecutionError) {
          const message = error.message;
          if (message.includes('rejected') || message.includes('cancelled') || message.includes('denied')) {
            setErrorMessage('Transaction was cancelled');
          } else if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds to complete the transaction');
          } else {
            setErrorMessage('Transaction failed: ' + message);
          }
          return;
        }

        // Handle other errors
        const errorMessage = error?.message || 'An unknown error occurred';
        setErrorMessage(errorMessage);
      }
    }
  });

  // Use Wagmi's useWriteContract hook for candidate creation
  const {
    writeContract: writeCandidate,
    isPending: isCreatingCandidate,
    reset: resetCandidateState,
    isSuccess: isCandidateSuccess
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setCandidateState('success');
        // Reset form
        setTitle('');
        setDescription('');
        setActions([{ target: '', value: '0', signature: '', calldata: '0x' }]);
      },
      onError: (error: Error | BaseError) => {
        console.error('Candidate creation error:', error);
        setCandidateState('error');
        
        // Handle user rejection
        if (error instanceof UserRejectedRequestError) {
          setErrorMessage('Transaction was cancelled by user');
          return;
        }

        // Handle contract execution errors
        if (error instanceof ContractFunctionExecutionError) {
          const message = error.message;
          
          if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds to create candidate');
          } else if (message.includes('invalid slug')) {
            setErrorMessage('Invalid slug provided. Please use a unique identifier.');
          } else {
            const cleanMessage = message.split('Details:')[0]?.trim() || message;
            setErrorMessage('Failed to create candidate: ' + cleanMessage);
          }
          return;
        }

        // Handle transaction execution errors
        if (error instanceof TransactionExecutionError) {
          const message = error.message;
          if (message.includes('rejected') || message.includes('cancelled') || message.includes('denied')) {
            setErrorMessage('Transaction was cancelled');
          } else if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds to complete the transaction');
          } else {
            setErrorMessage('Transaction failed: ' + message);
          }
          return;
        }

        // Handle other errors
        const errorMessage = error?.message || 'An unknown error occurred';
        setErrorMessage(errorMessage);
      }
    }
  });

  // Use Wagmi's useWriteContract hook for timelock V1 proposal creation
  const {
    writeContract: writeTimelockV1Proposal,
    isPending: isCreatingTimelockV1,
    reset: resetTimelockV1State,
    isSuccess: isTimelockV1Success
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setTimelockV1State('success');
        // Reset form
        setTitle('');
        setDescription('');
        setActions([{ target: '', value: '0', signature: '', calldata: '0x' }]);
      },
      onError: (error: Error | BaseError) => {
        console.error('Timelock V1 proposal creation error:', error);
        setTimelockV1State('error');
        
        // Handle user rejection
        if (error instanceof UserRejectedRequestError) {
          setErrorMessage('Transaction was cancelled by user');
          return;
        }

        // Handle contract execution errors
        if (error instanceof ContractFunctionExecutionError) {
          const message = error.message;
          
          if (message.includes('insufficient votes')) {
            setErrorMessage('You do not have enough voting power to create a proposal');
          } else if (message.includes('pending proposal')) {
            setErrorMessage('You already have a pending or active proposal. Wait for it to be resolved before creating a new one.');
          } else if (message.includes('targets.length must be != 0')) {
            setErrorMessage('At least one action is required');
          } else if (message.includes('inconsistent parameters')) {
            setErrorMessage('Proposal parameters are inconsistent. Check that all actions have valid targets and parameters.');
          } else {
            const cleanMessage = message.split('Details:')[0]?.trim() || message;
            setErrorMessage('Failed to create timelock V1 proposal: ' + cleanMessage);
          }
          return;
        }

        // Handle transaction execution errors
        if (error instanceof TransactionExecutionError) {
          const message = error.message;
          if (message.includes('rejected') || message.includes('cancelled') || message.includes('denied')) {
            setErrorMessage('Transaction was cancelled');
          } else if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds to complete the transaction');
          } else {
            setErrorMessage('Transaction failed: ' + message);
          }
          return;
        }

        // Handle other errors
        const errorMessage = error?.message || 'An unknown error occurred';
        setErrorMessage(errorMessage);
      }
    }
  });

  // Effect to handle success states
  useEffect(() => {
    if (isProposalSuccess) {
      setErrorMessage(null);
      setProposalState('success');
    }
  }, [isProposalSuccess]);

  useEffect(() => {
    if (isCandidateSuccess) {
      setErrorMessage(null);
      setCandidateState('success');
    }
  }, [isCandidateSuccess]);

  useEffect(() => {
    if (isTimelockV1Success) {
      setErrorMessage(null);
      setTimelockV1State('success');
    }
  }, [isTimelockV1Success]);

  // Check if user can create proposals
  const canCreateProposal = () => {
    if (!isConnected || !userVotes || !proposalThreshold || !totalSupply) return false;
    
    // Ensure we have valid numeric values before converting to BigInt
    const thresholdValue = typeof proposalThreshold === 'number' ? proposalThreshold : 
                          typeof proposalThreshold === 'string' ? parseInt(proposalThreshold) : 0;
    const totalSupplyValue = typeof totalSupply === 'number' ? totalSupply :
                            typeof totalSupply === 'string' ? parseInt(totalSupply) : 0;
    const userVotesValue = typeof userVotes === 'number' ? userVotes :
                          typeof userVotes === 'string' ? parseInt(userVotes) : 0;
    
    const threshold = (BigInt(totalSupplyValue) * BigInt(thresholdValue)) / BigInt(10000);
    return BigInt(userVotesValue) >= threshold;
  };

  const addAction = () => {
    setActions([...actions, { target: '', value: '0', signature: '', calldata: '0x' }]);
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const updateAction = (index: number, field: keyof ProposalAction, value: string) => {
    const updatedActions = [...actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    setActions(updatedActions);
  };

  const handleActionUpdate = (index: number) => (field: string, value: string) => {
    updateAction(index, field as keyof ProposalAction, value);
  };

  // Generate a unique slug based on title and proposer address
  const generateSlug = (title: string, proposerAddress: string): string => {
    if (!title.trim() || !proposerAddress) return '';
    
    // Create a base slug from the title
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Add timestamp and short address for uniqueness
    const timestamp = Math.floor(Date.now() / 1000);
    const shortAddress = proposerAddress.slice(-6).toLowerCase();
    
    return `${baseSlug}-${shortAddress}-${timestamp}`;
  };

  const validateForm = () => {
    if (!title.trim()) {
      setErrorMessage('Title is required');
      return false;
    }
    
    if (!description.trim()) {
      setErrorMessage('Description is required');
      return false;
    }

    // Validate each action
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (!action.target.trim()) {
        setErrorMessage(`Action ${i + 1}: Target address is required`);
        return false;
      }
      
      // Basic address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(action.target)) {
        setErrorMessage(`Action ${i + 1}: Invalid target address format`);
        return false;
      }

      // Validate value is a number
      if (isNaN(Number(action.value))) {
        setErrorMessage(`Action ${i + 1}: Value must be a valid number`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!canCreateProposal()) {
      setErrorMessage('You do not have enough voting power to create proposals');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setErrorMessage(null);
    resetProposalState?.();

    try {
      setProposalState('confirming');

      // Prepare proposal data
      const targets = actions.map(action => action.target as `0x${string}`);
      const values = actions.map(action => BigInt(action.value));
      const signatures = actions.map(action => action.signature);
      const calldatas = actions.map(action => action.calldata as `0x${string}`);
      const fullDescription = `# ${title}\n\n${description}`;

      // Create proposal using Wagmi's writeContract with client ID for Nouns95
      await writeProposal({
        address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
        abi: NounsProxyABI,
        functionName: 'propose',
        args: [targets, values, signatures, calldatas, fullDescription, CLIENT_ID],
      });
      
      setProposalState('pending');
    } catch (err: unknown) {
      console.error('Error creating proposal:', err);
      setProposalState('error');
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          setErrorMessage('Transaction was rejected');
        } else if (err.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for transaction');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to create proposal. Please try again.');
      }
    }
  };

  const handleCandidateSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!address) {
      setErrorMessage('Wallet not connected');
      return;
    }

    setErrorMessage(null);
    resetCandidateState?.();

    try {
      setCandidateState('confirming');

      // Generate unique slug automatically
      const generatedSlug = generateSlug(title, address);
      
      if (!generatedSlug) {
        setErrorMessage('Unable to generate candidate slug');
        setCandidateState('error');
        return;
      }

      // Prepare candidate data
      const targets = actions.map(action => action.target as `0x${string}`);
      const values = actions.map(action => BigInt(action.value));
      const signatures = actions.map(action => action.signature);
      const calldatas = actions.map(action => {
        const data = action.calldata;
        // Ensure calldata has 0x prefix
        return (data.startsWith('0x') ? data : `0x${data}`) as `0x${string}`;
      });
      const fullDescription = `# ${title}\n\n${description}`;

      // Create candidate using Wagmi's writeContract
      const writeConfig: {
        address: `0x${string}`;
        abi: unknown[];
        functionName: string;
        args: unknown[];
        value?: bigint;
      } = {
        address: NOUNS_CONTRACTS.CANDIDATES.address as `0x${string}`,
        abi: CandidatesProxyABI,
        functionName: 'createProposalCandidate',
        args: [targets, values, signatures, calldatas, fullDescription, generatedSlug, 0], // proposalIdToUpdate = 0 for new candidates
      };
      
      if (createCandidateCost) {
        writeConfig.value = createCandidateCost as bigint;
      }
      
      await writeCandidate(writeConfig);
      
      setCandidateState('pending');
    } catch (err: unknown) {
      console.error('Error creating candidate:', err);
      setCandidateState('error');
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          setErrorMessage('Transaction was rejected');
        } else if (err.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for transaction');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to create candidate. Please try again.');
      }
    }
  };

  const handleTimelockV1Submit = async () => {
    if (!canCreateProposal()) {
      setErrorMessage('You do not have enough voting power to create proposals');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setErrorMessage(null);
    resetTimelockV1State?.();

    try {
      setTimelockV1State('confirming');

      // Prepare proposal data
      const targets = actions.map(action => action.target as `0x${string}`);
      const values = actions.map(action => BigInt(action.value));
      const signatures = actions.map(action => action.signature);
      const calldatas = actions.map(action => {
        const data = action.calldata;
        // Ensure calldata has 0x prefix
        return (data.startsWith('0x') ? data : `0x${data}`) as `0x${string}`;
      });
      const fullDescription = `# ${title}\n\n${description}`;

      // Create timelock V1 proposal using Wagmi's writeContract with client ID for Nouns95
      await writeTimelockV1Proposal({
        address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
        abi: NounsProxyABI,
        functionName: 'proposeOnTimelockV1',
        args: [targets, values, signatures, calldatas, fullDescription, CLIENT_ID],
      });
      
      setTimelockV1State('pending');
    } catch (err: unknown) {
      console.error('Error creating timelock V1 proposal:', err);
      setTimelockV1State('error');
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          setErrorMessage('Transaction was rejected');
        } else if (err.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for transaction');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to create timelock V1 proposal. Please try again.');
      }
    }
  };

  const isCreating = isCreatingProposal || isCreatingCandidate || isCreatingTimelockV1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Proposals
        </button>
        <h2 className={styles.title}>Create New Proposal</h2>
      </div>

      {!isConnected && (
        <div className={styles.warning}>
          Please connect your wallet to create a proposal.
        </div>
      )}

      {isConnected && !canCreateProposal() && (
        <div className={styles.warning}>
          You need at least {proposalThreshold ? Number(proposalThreshold) / 100 : 'N/A'}% of total voting power to create proposals.
          You currently have {userVotes ? userVotes.toString() : '0'} votes.
        </div>
      )}

      <div className={styles.form}>
        <div className={styles.section}>
          <label className={styles.label}>Proposal Title *</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter a clear, descriptive title for your proposal"
            disabled={isCreating}
            maxLength={100}
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Description *</label>
          <MarkdownEditor
            value={description}
            onChange={(value) => {
              setDescription(value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Provide a detailed description of your proposal, including rationale and expected outcomes. You can use **markdown** formatting for rich text."
            disabled={isCreating}
            rows={8}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>Actions</label>
            <button
              type="button"
              className={styles.addButton}
              onClick={addAction}
              disabled={isCreating}
            >
              Add Action
            </button>
          </div>
          
          {actions.map((action, index) => (
            <div key={index} className={styles.actionContainer}>
              {actions.length > 1 && (
                <button
                  type="button"
                  className={styles.removeActionButton}
                  onClick={() => removeAction(index)}
                  disabled={isCreating}
                  title="Remove this action"
                >
                  ×
                </button>
              )}
              <SmartActionEditor
                index={index}
                target={action.target}
                value={action.value}
                signature={action.signature}
                calldata={action.calldata}
                onUpdate={handleActionUpdate(index)}
                disabled={isCreating}
              />
            </div>
          ))}
        </div>

        <div className={styles.submitSection}>
          <button
            className={styles.submitButton}
            onClick={handleCandidateSubmit}
            disabled={isCreating || !isConnected}
          >
            {isCreatingCandidate ? 'Creating Candidate...' : `Create Candidate${createCandidateCost ? ` (${Number(createCandidateCost) / 1e18} ETH)` : ''}`}
          </button>
          <button
            className={styles.submitButton}
            onClick={handleTimelockV1Submit}
            disabled={isCreating || !canCreateProposal()}
          >
            {isCreatingTimelockV1 ? 'Creating Timelock V1...' : 'Propose on Timelock V1'}
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isCreating || !canCreateProposal()}
          >
            {isCreatingProposal ? 'Creating Proposal...' : 'Create Proposal'}
          </button>
        </div>

        {errorMessage && (
          <div className={styles.error}>{errorMessage}</div>
        )}
        
        {proposalState === 'success' && (
          <div className={styles.success}>
            Your proposal has been successfully created! It will appear in the proposals list once confirmed on-chain.
          </div>
        )}
        
        {candidateState === 'success' && (
          <div className={styles.success}>
            Your candidate has been successfully created! It will appear in the candidates list once confirmed on-chain.
          </div>
        )}
        
        {timelockV1State === 'success' && (
          <div className={styles.success}>
            Your timelock V1 proposal has been successfully created! It will appear in the proposals list once confirmed on-chain.
          </div>
        )}
      </div>
    </div>
  );
}