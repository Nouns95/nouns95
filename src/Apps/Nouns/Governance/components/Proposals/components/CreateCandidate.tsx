import React, { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import CandidatesProxyABI from '../../../../domain/abis/CandidatesProxy';
import { SmartActionEditor } from './SmartActionEditor';
import { MarkdownEditor } from './MarkdownEditor';
import styles from './CreateProposal.module.css'; // Reuse CreateProposal styles

interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

interface CreateCandidateProps {
  onBack: () => void;
}

type CandidateState = 'idle' | 'confirming' | 'pending' | 'error' | 'success';

const CANDIDATES_PROXY_ADDRESS = '0x513e9277192767eb4dc044a08da8228862828150';

export function CreateCandidate({ onBack }: CreateCandidateProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [actions, setActions] = useState<ProposalAction[]>([
    { target: '', value: '0', signature: '', calldata: '0x' }
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [candidateState, setCandidateState] = useState<CandidateState>('idle');

  // Auto-generate slug from title
  const generateSlugFromTitle = (titleText: string): string => {
    if (!titleText.trim()) return '';
    
    // Convert to lowercase and replace spaces/special chars with hyphens
    const baseSlug = titleText
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Add timestamp for uniqueness (YYYYMMDD-HHMM format)
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Combine and truncate if necessary (max 50 chars for slug)
    const fullSlug = `${baseSlug}-${timestamp}`;
    return fullSlug.length > 50 ? fullSlug.substring(0, 47) + '...' : fullSlug;
  };

  // Auto-update slug when title changes
  useEffect(() => {
    if (title) {
      const newSlug = generateSlugFromTitle(title);
      setSlug(newSlug);
    } else {
      setSlug('');
    }
  }, [title]);

  const { address: connectedAddress } = useAccount();

  // Fetch candidate creation cost
  const { data: createCost } = useReadContract({
    address: CANDIDATES_PROXY_ADDRESS,
    abi: CandidatesProxyABI,
    functionName: 'createCandidateCost',
  }) as { data: bigint | undefined };

  // Use Wagmi's useWriteContract hook for candidate creation
  const {
    writeContract,
    isPending: isWritePending,
    isSuccess: isCandidateSuccess,
    reset: resetCandidateState
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        // Candidate creation transaction successful
      },
      onError: (err: unknown) => {
        // Error in candidate creation transaction
        setCandidateState('error');
        
        if (err instanceof Error) {
          if (err.message.includes('user rejected transaction')) {
            setErrorMessage('Transaction was rejected');
          } else if (err.message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds for transaction');
          } else {
            setErrorMessage(err.message);
          }
          return;
        }

        // Handle other errors
        const errorMessage = (err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorMessage(errorMessage);
      }
    }
  });

  // Effect to handle success state
  useEffect(() => {
    if (isCandidateSuccess) {
      setErrorMessage(null);
      setCandidateState('success');
    }
  }, [isCandidateSuccess]);

  // Check if user can create candidates (similar logic to proposals)
  const canCreateCandidate = () => {
    // Basic validation - user must be connected
    return !!connectedAddress;
  };

  const handleActionUpdate = useCallback((index: number, field: string, value: string) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  }, []);

  const addAction = () => {
    if (actions.length >= 10) {
      setErrorMessage('Maximum 10 actions allowed');
      return;
    }
    setActions(prev => [...prev, { target: '', value: '0', signature: '', calldata: '0x' }]);
  };

  const removeAction = (index: number) => {
    if (actions.length === 1) {
      setErrorMessage('At least one action is required');
      return;
    }
    setActions(prev => prev.filter((_, i) => i !== index));
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
    // Slug validation removed - it's auto-generated
    if (!canCreateCandidate()) {
      setErrorMessage('You must connect your wallet to create a candidate');
      return false;
    }

    // Validate all actions have required fields
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (!action.target.trim()) {
        setErrorMessage(`Action ${i + 1}: Target address is required`);
        return false;
      }
      if (!action.signature.trim()) {
        setErrorMessage(`Action ${i + 1}: Function signature is required`);
        return false;
      }
    }

    return true;
  };

  const submitCandidate = async () => {
    if (!validateForm()) return;

    try {
      setErrorMessage(null);
      setCandidateState('confirming');

      // Prepare candidate data
      const targets = actions.map(action => action.target as `0x${string}`);
      const values = actions.map(action => BigInt(action.value));
      const signatures = actions.map(action => action.signature);
      const calldatas = actions.map(action => action.calldata as `0x${string}`);
      const fullDescription = `# ${title}\n\n${description}`;

      // Create candidate using Wagmi's writeContract
      await writeContract({
        address: CANDIDATES_PROXY_ADDRESS as `0x${string}`,
        abi: CandidatesProxyABI,
        functionName: 'createProposalCandidate',
        args: [targets, values, signatures, calldatas, fullDescription, slug, BigInt(0)],
        value: createCost ? BigInt(createCost.toString()) : undefined,
      });
      
      setCandidateState('pending');
    } catch (err: unknown) {
      // Error creating candidate
      setCandidateState('error');
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          setErrorMessage('Transaction was rejected');
        } else if (err.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for transaction');
        } else if (err.message.includes('SlugAlreadyUsed')) {
          setErrorMessage('This slug is already in use. Please choose a different one.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to create candidate. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setTitle(''); // This will auto-clear slug via useEffect
    setDescription('');
    setActions([{ target: '', value: '0', signature: '', calldata: '0x' }]);
    setErrorMessage(null);
    setCandidateState('idle');
    resetCandidateState();
  };

  const isSubmitting = candidateState === 'confirming' || candidateState === 'pending' || isWritePending;

  // Render success state
  if (candidateState === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Candidate Submitted Successfully! 🎉</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.successMessage}>
            <p>Your proposal candidate has been submitted to the candidates system.</p>
            <p><strong>Slug:</strong> {slug}</p>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.button}
              onClick={resetForm}
            >
              Create Another Candidate
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={onBack}
            >
              Back to Governance
            </button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Back
        </button>
        <h2>Create Proposal Candidate</h2>
      </div>

      <div className={styles.content}>
        <form onSubmit={(e) => { e.preventDefault(); submitCandidate(); }}>
          {/* Title */}
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
              placeholder="Enter candidate title..."
              disabled={isSubmitting}
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
              placeholder="Describe your proposal candidate in detail..."
              disabled={isSubmitting}
              rows={8}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Actions *</label>
            {actions.map((action, index) => (
              <div key={index} className={styles.actionContainer}>
                <div className={styles.actionHeader}>
                  <h4>Action {index + 1}</h4>
                  {actions.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeActionButton}
                      onClick={() => removeAction(index)}
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <SmartActionEditor
                  index={index}
                  target={action.target}
                  value={action.value}
                  signature={action.signature}
                  calldata={action.calldata}
                  onUpdate={(field, value) => handleActionUpdate(index, field, value)}
                  disabled={isSubmitting}
                />
              </div>
            ))}
            
            {actions.length < 10 && (
              <button
                type="button"
                className={styles.addActionButton}
                onClick={addAction}
                disabled={isSubmitting}
              >
                + Add Action
              </button>
            )}
          </div>

          {/* Cost Display */}
          {createCost && (
            <div className={styles.costDisplay}>
              <p><strong>Creation Cost:</strong> {(Number(createCost) / 1e18).toFixed(4)} ETH</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {candidateState === 'confirming' && 'Confirm in Wallet...'}
              {candidateState === 'pending' && 'Creating Candidate...'}
              {candidateState === 'idle' && 'Create Candidate'}
              {candidateState === 'error' && 'Try Again'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}