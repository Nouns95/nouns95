import React from 'react';
import { useQuery } from '@apollo/client';
import styles from './CandidateDetails.module.css';
import { MarkdownReason } from '../../Proposals/components/MarkdownReason';
import { AddressAvatar } from '../../Common/AddressAvatar';
import { useSponsorCandidate } from '../../../hooks/useSponsorCandidate';
import { usePromoteCandidate } from '../../../hooks/usePromoteCandidate';
import { formatSignatureForContract, ValidSignature } from '../../../utils/candidateSignatures';
import { useAccount } from 'wagmi';
import { 
  PROPOSAL_CANDIDATE_QUERY, 
  CANDIDATE_FEEDBACK_QUERY,
  type ProposalCandidateQuery,
  type CandidateFeedbackQuery 
} from '@/src/Apps/Nouns/domain/graphql/queries/candidates';

interface CandidateDetailsProps {
  id: string;
  onBackToList: () => void;
}

// Content is now structured data from GraphQL, no need for parsing

export default function CandidateDetails({ id, onBackToList }: CandidateDetailsProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { address } = useAccount();
  
  const { 
    sponsorCandidate, 
    isSuccess: isSponsorSuccess, 
    isError: isSponsorError, 
    error: sponsorError,
    transactionHash,
    isConnected 
  } = useSponsorCandidate();

  const { 
    promoteCandidate,
    isLoading: isPromoting,
    isSuccess: isPromoteSuccess,
    isError: isPromoteError,
    error: promoteError,
    proposalId: createdProposalId
  } = usePromoteCandidate();

  const [showSponsorForm, setShowSponsorForm] = React.useState(false);
  const [sponsorReason, setSponsorReason] = React.useState('');
  const [isSponsoring, setIsSponsoring] = React.useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = React.useState(false);
  const [selectedSignatures, setSelectedSignatures] = React.useState<ValidSignature[]>([]);

  const { data: candidateData, error: candidateError } = useQuery<ProposalCandidateQuery['data']>(
    PROPOSAL_CANDIDATE_QUERY,
    {
      variables: { id },
      pollInterval: 30000,
      errorPolicy: 'all', // Show partial data even if there are errors
    }
  );

  const { data: feedbackData } = useQuery<CandidateFeedbackQuery['data']>(
    CANDIDATE_FEEDBACK_QUERY,
    {
      variables: { candidateId: id },
      pollInterval: 30000,
      errorPolicy: 'all',
    }
  );

  // Content is now directly available in the candidate query

  // Process the real signature data from GraphQL - must be called on every render
  const validSignatures: ValidSignature[] = React.useMemo(() => {
    if (!candidateData?.proposalCandidate?.latestVersion?.content?.contentSignatures) {
      return [];
    }

    return candidateData.proposalCandidate.latestVersion.content.contentSignatures
      .filter(sig => !sig.canceled) // Filter out canceled signatures
      .map(sig => {
        const expirationDate = new Date(parseInt(sig.expirationTimestamp) * 1000);
        const hasExpired = expirationDate <= new Date();
        const isProposer = sig.signer.id.toLowerCase() === candidateData.proposalCandidate.proposer?.toLowerCase();
        
        const status = 
          isProposer ? 'redundant' :
          hasExpired ? 'expired' :
          'valid';

        return {
          sig: sig.sig,
          signer: {
            id: sig.signer.id,
            nounsRepresented: sig.signer.nounsRepresented,
          },
          expirationTimestamp: expirationDate,
          status,
          nounsCount: sig.signer.nounsRepresented.length,
        } as ValidSignature;
      })
      .filter(sig => sig.status === 'valid'); // Only return valid signatures
  }, [candidateData?.proposalCandidate]);

  // Reset form when sponsorship is successful
  React.useEffect(() => {
    if (isSponsorSuccess) {
      setSponsorReason('');
      setShowSponsorForm(false);
      setIsSponsoring(false);
    }
  }, [isSponsorSuccess]);

  // Reset sponsoring state on error
  React.useEffect(() => {
    if (isSponsorError) {
      setIsSponsoring(false);
    }
  }, [isSponsorError]);

  // NOW WE CAN DO CONDITIONAL RENDERING
  // Show error state only if we have a critical error and no data
  if (candidateError && !candidateData?.proposalCandidate) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Candidate not found
        </div>
      </div>
    );
  }

  // Show placeholder if no data yet (brief moment)
  if (!candidateData?.proposalCandidate) {
    return (
      <div className={styles.container}>
        <div className={styles.candidateDetails}>
          <button className={styles.backButton} onClick={onBackToList}>
            ← Back to Candidates
          </button>
          <div className={styles.candidateContent}>
            <div className={styles.mainContent}>
              <div className={styles.header}>
                <h2 className={styles.candidateTitle}>Loading candidate...</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { proposalCandidate: candidate } = candidateData;
  const content = candidate.latestVersion.content || {
    title: `Candidate #${candidate.number}`,
    description: '',
    targets: [],
    values: [],
    signatures: [],
    calldatas: [],
  };

  const handleSponsorSubmit = async () => {
    if (!sponsorReason.trim()) {
      alert('Please provide a reason for sponsoring this candidate.');
      return;
    }

    setIsSponsoring(true);

    try {
      await sponsorCandidate({
        proposer: candidate.proposer,
        slug: candidate.slug,
        proposalIdToUpdate: 0, // Assuming 0 for new proposals
        targets: content.targets,
        values: content.values,
        signatures: content.signatures,
        calldatas: content.calldatas,
        description: content.description,
        reason: sponsorReason,
      });
      
    } catch (error) {
      console.error('Error sponsoring candidate:', error);
      // Error is handled by the hook
    }
  };

  const canSponsor = isConnected && address && address.toLowerCase() !== candidate?.proposer?.toLowerCase() && !candidate?.canceled;

  // Mock proposer voting power (in a real app, you'd get this from the contract)
  const proposerVotingPower = 1; // Placeholder
  const proposalThreshold = 1; // Placeholder - should come from contract

  const canPromote = isConnected && 
    address && 
    address.toLowerCase() === candidate?.proposer?.toLowerCase() && 
    !candidate?.canceled &&
    validSignatures.length > 0;

  const canPromoteWithSelectedSignatures = selectedSignatures.length > 0 && 
    (proposerVotingPower + selectedSignatures.reduce((sum, sig) => sum + sig.nounsCount, 0)) > proposalThreshold;

  const handlePromoteSubmit = async () => {
    if (!canPromoteWithSelectedSignatures) {
      alert('Not enough voting power to promote this candidate');
      return;
    }

    try {
      const proposerSignatures = selectedSignatures.map(formatSignatureForContract);
      
      await promoteCandidate({
        proposerSignatures,
        targets: content.targets,
        values: content.values?.map(v => v.toString()) || [],
        signatures: content.signatures,
        calldatas: content.calldatas,
        description: content.description || content.title || `Candidate #${candidate.number}`,
      });

      // Reset state on success
      setShowPromoteDialog(false);
      setSelectedSignatures([]);
    } catch (error) {
      console.error('Error promoting candidate:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.candidateDetails}>
        <button className={styles.backButton} onClick={onBackToList}>
          ← Back to Candidates
        </button>
        <div className={styles.candidateContent}>
          <div className={styles.mainContent}>
            <div className={styles.header}>
              <h2 className={styles.candidateTitle}>
                {content.title || `Candidate #${candidate.number}`}
              </h2>
              <div className={styles.proposerInfo}>
                <div className={styles.proposerLeft}>
                  <span>Proposed by </span>
                  <AddressAvatar address={candidate.proposer} size={16} />
                </div>
                <div className={styles.proposerRight}>
                  <span>Created: </span>
                  <a 
                    href={`https://etherscan.io/tx/${candidate.createdTransactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.transactionLink}
                    title={candidate.createdTransactionHash}
                  >
                    {new Date(parseInt(candidate.createdTimestamp) * 1000).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </a>
                </div>
              </div>
              <div className={styles.transactionHistory}>
                <h3 className={styles.sectionTitle}>Transaction Details</h3>
                <div className={styles.transactionContent}>
                  {candidate.createdTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Created: </span>
                      <a 
                        href={`https://etherscan.io/tx/${candidate.createdTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {candidate.createdTransactionHash.slice(0, 6)}...{candidate.createdTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}
                  {candidate.canceledTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Canceled: </span>
                      <a 
                        href={`https://etherscan.io/tx/${candidate.canceledTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {candidate.canceledTransactionHash.slice(0, 6)}...{candidate.canceledTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.description}>
              {content.description && (
                <MarkdownReason content={content.description} />
              )}
            </div>
          </div>

          <div className={styles.sideContent}>
            {canPromote && (
              <div className={styles.supportProgress}>
                <h3 className={styles.sectionTitle}>Promote to Proposal</h3>
                <div className={styles.supportInfo}>
                  <div className={styles.sponsorSection}>
                    <button 
                      className={styles.sponsorButton}
                      onClick={() => setShowPromoteDialog(true)}
                      disabled={isPromoting}
                      style={{ background: '#000080', color: '#ffffff' }}
                    >
                      {isPromoting ? 'Promoting...' : 'Promote to Proposal'}
                    </button>
                    
                    {isPromoteSuccess && createdProposalId && (
                      <div className={styles.sponsorSuccess}>
                        ✅ Proposal created! 
                        <a 
                          href={`/proposal/${createdProposalId}`}
                          className={styles.transactionLink}
                        >
                          View Proposal #{createdProposalId}
                        </a>
                      </div>
                    )}
                    
                    {isPromoteError && (
                      <div className={styles.sponsorError}>
                        ❌ Error: {promoteError?.message || 'Failed to promote candidate'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.supportProgress}>
              <h3 className={styles.sectionTitle}>Sponsor Candidate</h3>
              <div className={styles.supportInfo}>
                {!isConnected ? (
                  <div className={styles.connectWalletMessage}>
                    Connect your wallet to sponsor this candidate
                  </div>
                ) : !canSponsor ? (
                  <div className={styles.cannotSponsorMessage}>
                    {address?.toLowerCase() === candidate?.proposer?.toLowerCase() 
                      ? "You cannot sponsor your own candidate" 
                      : candidate?.canceled 
                      ? "This candidate has been canceled"
                      : "Cannot sponsor this candidate"}
                  </div>
                ) : (
                  <div className={styles.sponsorSection}>
                    {!showSponsorForm ? (
                      <button 
                        className={styles.sponsorButton}
                        onClick={() => setShowSponsorForm(true)}
                        disabled={isSponsoring}
                      >
                        Sponsor Candidate
                      </button>
                    ) : (
                      <div className={styles.sponsorForm}>
                        <textarea
                          className={styles.sponsorReasonInput}
                          placeholder="Why do you want to sponsor this candidate?"
                          value={sponsorReason}
                          onChange={(e) => setSponsorReason(e.target.value)}
                          rows={3}
                          disabled={isSponsoring}
                        />
                        <div className={styles.sponsorFormButtons}>
                          <button 
                            className={styles.sponsorSubmitButton}
                            onClick={handleSponsorSubmit}
                            disabled={isSponsoring || !sponsorReason.trim()}
                          >
                            {isSponsoring ? 'Sponsoring...' : 'Submit Sponsorship'}
                          </button>
                          <button 
                            className={styles.sponsorCancelButton}
                            onClick={() => {
                              setShowSponsorForm(false);
                              setSponsorReason('');
                            }}
                            disabled={isSponsoring}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {isSponsorSuccess && transactionHash && (
                      <div className={styles.sponsorSuccess}>
                        ✅ Sponsorship submitted! 
                        <a 
                          href={`https://etherscan.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.transactionLink}
                        >
                          View transaction
                        </a>
                      </div>
                    )}
                    
                    {isSponsorError && (
                      <div className={styles.sponsorError}>
                        ❌ Error: {sponsorError?.message || 'Failed to sponsor candidate'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.supportProgress}>
              <h3 className={styles.sectionTitle}>Sponsor Signatures</h3>
              <div className={styles.supportInfo}>
                {validSignatures.length > 0 ? (
                  <div className={styles.signaturesSection}>
                    <div className={styles.signaturesSummary}>
                      <span className={styles.signatureCount}>
                        {validSignatures.length} active signature{validSignatures.length !== 1 ? 's' : ''}
                      </span>
                      <span className={styles.votingPower}>
                        {validSignatures.reduce((sum, sig) => sum + sig.nounsCount, 0)} voting power
                      </span>
                    </div>
                    <div className={styles.signaturesList}>
                      {validSignatures.map((sig) => (
                        <div key={sig.signer.id} className={styles.signatureItem}>
                          <div className={styles.signerInfo}>
                            <div className={styles.signerDetails}>
                              <AddressAvatar address={sig.signer.id} size={20} />
                              <div className={styles.signatureExpiry}>
                                Expires: {sig.expirationTimestamp.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span className={styles.nounCount}>
                            {sig.nounsCount} noun{sig.nounsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.noSignatures}>
                    No sponsor signatures yet
                  </div>
                )}
              </div>
            </div>

            <div className={styles.supportProgress}>
              <h3 className={styles.sectionTitle}>Feedback</h3>
              <div className={styles.supportInfo}>
                {feedbackData?.candidateFeedbacks && (
                  <div className={styles.supportStats}>
                    <span className={styles.votes}>
                      <span className={styles.voteLabel}>Total Feedback:</span> {feedbackData.candidateFeedbacks.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Promote Dialog */}
      {showPromoteDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowPromoteDialog(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3>Promote Candidate to Proposal</h3>
              <button 
                className={styles.dialogCloseButton}
                onClick={() => setShowPromoteDialog(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.dialogContent}>
              <p>Select sponsor signatures to include with your proposal:</p>
              
              {validSignatures.length === 0 ? (
                <p>No valid signatures available to promote this candidate.</p>
              ) : (
                <div className={styles.signatureList}>
                  {validSignatures.map((sig) => (
                    <label key={sig.signer.id} className={styles.signatureItem}>
                      <input
                        type="checkbox"
                        checked={selectedSignatures.some(s => s.signer.id === sig.signer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSignatures([...selectedSignatures, sig]);
                          } else {
                            setSelectedSignatures(selectedSignatures.filter(s => s.signer.id !== sig.signer.id));
                          }
                        }}
                        disabled={isPromoting}
                      />
                      <AddressAvatar address={sig.signer.id} size={20} />
                      <span>{sig.signer.id.slice(0, 6)}...{sig.signer.id.slice(-4)} ({sig.nounsCount} nouns)</span>
                    </label>
                  ))}
                </div>
              )}
              
              <div className={styles.votingPowerInfo}>
                <p>
                  Your voting power: {proposerVotingPower} | 
                  Selected sponsor power: {selectedSignatures.reduce((sum, sig) => sum + sig.nounsCount, 0)} | 
                  Total: {proposerVotingPower + selectedSignatures.reduce((sum, sig) => sum + sig.nounsCount, 0)} | 
                  Threshold: {proposalThreshold + 1}
                </p>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button 
                className={styles.sponsorCancelButton}
                onClick={() => setShowPromoteDialog(false)}
                disabled={isPromoting}
              >
                Cancel
              </button>
              <button 
                className={styles.sponsorSubmitButton}
                onClick={handlePromoteSubmit}
                disabled={isPromoting || !canPromoteWithSelectedSignatures}
              >
                {isPromoting ? 'Promoting...' : 'Create Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 