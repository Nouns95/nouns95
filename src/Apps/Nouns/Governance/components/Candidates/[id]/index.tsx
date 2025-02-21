import React from 'react';
import { useQuery } from '@apollo/client';
import styles from './CandidateDetails.module.css';
import { MarkdownReason } from '../../Proposals/MarkdownReason';
import { AddressAvatar } from '../../Common/AddressAvatar';
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

interface ParsedContent {
  title?: string;
  description?: string;
  targets?: string[];
  values?: string[];
  signatures?: string[];
  calldatas?: string[];
}

const parseContent = (content: string | null | undefined): ParsedContent => {
  if (!content) {
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || parsed.name,
      description: parsed.description || parsed.summary || parsed.content,
      targets: parsed.targets,
      values: parsed.values,
      signatures: parsed.signatures,
      calldatas: parsed.calldatas
    };
  } catch {
    // If content is not JSON, try to extract title from first line
    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s*/, ''); // Remove markdown heading
    const description = lines.slice(1).join('\n').trim();
    return { title, description };
  }
};

export default function CandidateDetails({ id, onBackToList }: CandidateDetailsProps) {
  const { data: candidateData, loading: candidateLoading, error: candidateError } = useQuery<ProposalCandidateQuery['data']>(
    PROPOSAL_CANDIDATE_QUERY,
    {
      variables: { id },
      pollInterval: 30000,
    }
  );

  const { data: feedbackData } = useQuery<CandidateFeedbackQuery['data']>(
    CANDIDATE_FEEDBACK_QUERY,
    {
      variables: { candidateId: id },
      pollInterval: 30000,
    }
  );

  if (candidateLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (candidateError || !candidateData?.proposalCandidate) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {candidateError ? 'Error loading candidate' : 'Candidate not found'}
        </div>
      </div>
    );
  }

  const { proposalCandidate: candidate } = candidateData;
  const content = candidate.latestVersion.content ? parseContent(candidate.latestVersion.content) : { title: `Candidate #${candidate.number}` };

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
    </div>
  );
} 