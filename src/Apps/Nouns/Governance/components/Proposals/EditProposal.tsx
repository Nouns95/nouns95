import React, { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { useQuery } from '@apollo/client';

import NounsProxyABI from '../../../domain/abis/NounsProxy';
import { NOUNS_CONTRACTS } from '../../../domain/constants/contracts';
import { SmartActionEditor } from './SmartActionEditor';
import { MarkdownEditor } from './MarkdownEditor';
import { PROPOSAL_DETAIL_QUERY } from '../../../domain/graphql/queries/governance';
import styles from './CreateProposal.module.css'; // Reuse CreateProposal styles

interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

interface EditProposalProps {
  proposalId: string;
  onBack: () => void;
}

type ProposalState = 'idle' | 'confirming' | 'pending' | 'success' | 'error';
type UpdateType = 'full' | 'description' | 'transactions';

export function EditProposal({ proposalId, onBack }: EditProposalProps) {
  const { address, isConnected } = useAccount();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [actions, setActions] = useState<ProposalAction[]>([{
    target: '',
    value: '0',
    signature: '',
    calldata: '0x'
  }]);
  
  const [updateType, setUpdateType] = useState<UpdateType>('full');
  const [proposalState, setProposalState] = useState<ProposalState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch proposal data
  const { data: proposalData, loading: proposalLoading, error: proposalError } = useQuery(
    PROPOSAL_DETAIL_QUERY,
    {
      variables: { proposalId },
      skip: !proposalId,
    }
  );

  const { writeContract, isPending, isSuccess, reset: resetProposalState } = useWriteContract();

  const isUpdating = proposalState === 'confirming' || proposalState === 'pending' || isPending;

  // Load proposal data when available
  useEffect(() => {
    if (proposalData?.proposal) {
      const proposal = proposalData.proposal;
      
      // Extract title from description (assuming format "# Title\n\nDescription")
      const descriptionLines = proposal.description.split('\n');
      const titleLine = descriptionLines.find((line: string) => line.startsWith('# '));
      const titleFromDescription = titleLine ? titleLine.replace('# ', '') : '';
      const descriptionWithoutTitle = proposal.description.replace(/^# .*\n\n/, '');
      
      setTitle(titleFromDescription || proposal.title);
      setDescription(descriptionWithoutTitle || proposal.description);
      
      // Load actions
      const loadedActions: ProposalAction[] = proposal.targets.map((target: string, index: number) => ({
        target,
        value: proposal.values[index] || '0',
        signature: proposal.signatures[index] || '',
        calldata: proposal.calldatas[index] || '0x'
      }));
      
      setActions(loadedActions.length > 0 ? loadedActions : [{
        target: '',
        value: '0',
        signature: '',
        calldata: '0x'
      }]);
    }
  }, [proposalData]);

  // Check if user can edit this proposal
  const canEdit = () => {
    if (!isConnected || !address || !proposalData?.proposal) return false;
    
    const proposal = proposalData.proposal;
    
    // Only proposer can edit
    if (proposal.proposer.id.toLowerCase() !== address.toLowerCase()) return false;
    
    // Can only edit during updatable period
    if (proposal.updatePeriodEndBlock) {
      // TODO: Check if current block is within update period
      // For now, assume it's always editable if updatePeriodEndBlock exists
      return true;
    }
    
    return false;
  };

  const addAction = () => {
    setActions([...actions, {
      target: '',
      value: '0',
      signature: '',
      calldata: '0x'
    }]);
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      const newActions = actions.filter((_, i) => i !== index);
      setActions(newActions);
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

  const validateForm = () => {
    if (!updateMessage.trim()) {
      setErrorMessage('Update message is required');
      return false;
    }

    if (updateType === 'full' || updateType === 'description') {
      if (!title.trim()) {
        setErrorMessage('Title is required');
        return false;
      }
      
      if (!description.trim()) {
        setErrorMessage('Description is required');
        return false;
      }
    }

    if (updateType === 'full' || updateType === 'transactions') {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        
        if (!action.target.trim()) {
          setErrorMessage(`Action ${i + 1}: Target address is required`);
          return false;
        }

        if (action.target.length !== 42 || !action.target.startsWith('0x')) {
          setErrorMessage(`Action ${i + 1}: Invalid target address format`);
          return false;
        }

        if (isNaN(Number(action.value))) {
          setErrorMessage(`Action ${i + 1}: Value must be a valid number`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!canEdit()) {
      setErrorMessage('You cannot edit this proposal');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setErrorMessage(null);
    resetProposalState?.();

    try {
      setProposalState('confirming');

      if (updateType === 'description') {
        // Update description only
        const fullDescription = `# ${title}\n\n${description}`;
        
        await writeContract({
          address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
          abi: NounsProxyABI,
          functionName: 'updateProposalDescription',
          args: [BigInt(proposalId), fullDescription, updateMessage],
        });
      } else if (updateType === 'transactions') {
        // Update transactions only
        const targets = actions.map(action => action.target as `0x${string}`);
        const values = actions.map(action => BigInt(action.value));
        const signatures = actions.map(action => action.signature);
        const calldatas = actions.map(action => action.calldata as `0x${string}`);
        
        await writeContract({
          address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
          abi: NounsProxyABI,
          functionName: 'updateProposalTransactions',
          args: [BigInt(proposalId), targets, values, signatures, calldatas, updateMessage],
        });
      } else {
        // Full update
        const targets = actions.map(action => action.target as `0x${string}`);
        const values = actions.map(action => BigInt(action.value));
        const signatures = actions.map(action => action.signature);
        const calldatas = actions.map(action => action.calldata as `0x${string}`);
        const fullDescription = `# ${title}\n\n${description}`;
        
        await writeContract({
          address: NOUNS_CONTRACTS.GOVERNOR.address as `0x${string}`,
          abi: NounsProxyABI,
          functionName: 'updateProposal',
          args: [BigInt(proposalId), targets, values, signatures, calldatas, fullDescription, updateMessage],
        });
      }
      
      setProposalState('pending');
    } catch (err: unknown) {
      console.error('Error updating proposal:', err);
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
        setErrorMessage('Failed to update proposal');
      }
    }
  };

  // Monitor transaction success
  useEffect(() => {
    if (isSuccess && proposalState === 'pending') {
      setProposalState('success');
    }
  }, [isSuccess, proposalState]);

  if (proposalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading proposal data...</div>
      </div>
    );
  }

  if (proposalError || !proposalData?.proposal) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load proposal data</div>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to Proposals
          </button>
        </div>
        <div className={styles.warning}>
          You can only edit your own proposals during the updatable period.
        </div>
      </div>
    );
  }

  if (proposalState === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to Proposals
          </button>
          <h2 className={styles.title}>Proposal Updated Successfully!</h2>
        </div>
        <div className={styles.successMessage}>
          <p>Your proposal has been updated successfully.</p>
          <button className={styles.button} onClick={onBack}>
            Return to Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Proposals
        </button>
        <h2 className={styles.title}>Edit Proposal #{proposalId}</h2>
      </div>

      {!isConnected && (
        <div className={styles.warning}>
          Please connect your wallet to edit proposals.
        </div>
      )}

      <div className={styles.form}>
        <div className={styles.section}>
          <label className={styles.label}>Update Type *</label>
          <select
            className={styles.select}
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value as UpdateType)}
            disabled={isUpdating}
          >
            <option value="full">Full Update (Description + Actions)</option>
            <option value="description">Description Only</option>
            <option value="transactions">Actions Only</option>
          </select>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Update Message *</label>
          <input
            type="text"
            className={styles.input}
            value={updateMessage}
            onChange={(e) => {
              setUpdateMessage(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Briefly explain what you're updating and why"
            disabled={isUpdating}
            maxLength={200}
          />
        </div>

        {(updateType === 'full' || updateType === 'description') && (
          <>
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
                disabled={isUpdating}
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
                disabled={isUpdating}
                rows={8}
              />
            </div>
          </>
        )}

        {(updateType === 'full' || updateType === 'transactions') && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.label}>Actions</label>
              <button
                type="button"
                className={styles.addButton}
                onClick={addAction}
                disabled={isUpdating}
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
                    disabled={isUpdating}
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
                  disabled={isUpdating}
                />
              </div>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className={styles.error}>
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={!isConnected || isUpdating}
          >
            {proposalState === 'confirming' ? 'Confirm in Wallet...' :
             proposalState === 'pending' ? 'Updating Proposal...' :
             'Update Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}