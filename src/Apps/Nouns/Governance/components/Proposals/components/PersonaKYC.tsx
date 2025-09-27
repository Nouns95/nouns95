import React, { useState, useEffect, useRef } from 'react';
import Persona from 'persona';
import styles from './PersonaKYC.module.css';

interface PersonaKYCProps {
  onComplete: (data: { inquiryId: string; status: string; fields: Record<string, unknown> }) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
  disabled?: boolean;
  templateId?: string;
  walletAddress?: string;
  proposalTitle?: string;
}

export function PersonaKYC({
  onComplete,
  onCancel,
  onError,
  disabled = false,
  templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID,
  walletAddress,
  proposalTitle
}: PersonaKYCProps) {
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clientRef = useRef<unknown>(null);

  // No need to dynamically load SDK since we're importing it
  useEffect(() => {
    console.log('Persona SDK imported successfully');
  }, []);

  // Generate comprehensive reference ID
  const generateReferenceId = (): string => {
    const CLIENT_ID = '11'; // Nouns95 client ID
    
    // Create a safe slug from proposal title
    const titleSlug = proposalTitle 
      ? proposalTitle
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 30) // Limit length
      : 'untitled';
    
    // Create components for reference ID
    const components = [
      'nouns95',
      CLIENT_ID,
      walletAddress ? walletAddress.toLowerCase() : 'no-wallet',
      titleSlug
    ];
    
    return components.join('-');
  };

  const initializePersonaClient = () => {
    if (typeof window === 'undefined') {
      setErrorMessage('Client-side environment required');
      setKycStatus('error');
      return null;
    }

    if (!templateId) {
      setErrorMessage('Persona template ID not configured');
      setKycStatus('error');
      return null;
    }

    try {
      const referenceId = generateReferenceId();
      console.log('Generated reference ID:', referenceId);
      
      const client = new Persona.Client({
        templateId,
        referenceId,
        onReady: () => {
          console.log('Persona client ready');
          setIsLoading(false);
          client.open();
        },
        onComplete: (data: { inquiryId: string; status: string; fields: Record<string, unknown> }) => {
          console.log('KYC completed:', data);
          setKycStatus('completed');
          setIsKYCOpen(false);
          onComplete(data);
        },
        onCancel: (data: { inquiryId?: string; sessionToken?: string }) => {
          console.log('KYC cancelled:', data);
          setKycStatus('idle');
          setIsKYCOpen(false);
          onCancel?.();
        },
        onError: (error: unknown) => {
          console.error('KYC error:', error);
          setKycStatus('error');
          const errorMessage = error && typeof error === 'object' && 'message' in error 
            ? (error as { message: string }).message 
            : 'KYC verification failed';
          setErrorMessage(errorMessage);
          setIsKYCOpen(false);
          onError?.(error);
        },
        onEvent: (name: string, meta?: Record<string, unknown>) => {
          console.log(`Persona event: ${name}`, meta);
          switch (name) {
            case 'start':
              console.log(`KYC started with inquiry ID: ${meta?.inquiryId}`);
              setKycStatus('loading');
              break;
            default:
              console.log(`Received event: ${name} with meta:`, meta);
          }
        }
      });

      return client;
    } catch (error) {
      console.error('Failed to initialize Persona client:', error);
      setErrorMessage('Failed to initialize KYC verification');
      setKycStatus('error');
      onError?.(error);
      return null;
    }
  };

  const handleStartKYC = () => {
    if (disabled) return;
    
    // Debug logging
    console.log('KYC Button clicked');
    console.log('Template ID:', templateId);
    console.log('Wallet Address:', walletAddress);
    console.log('Proposal Title:', proposalTitle);
    console.log('Persona SDK imported:', !!Persona);
    
    setErrorMessage(null);
    setIsLoading(true);
    setKycStatus('loading');
    setIsKYCOpen(true);

    // Initialize and open Persona client
    const client = initializePersonaClient();
    if (client) {
      clientRef.current = client;
    } else {
      setIsLoading(false);
      setKycStatus('error');
      setIsKYCOpen(false);
    }
  };

  const handleCancelKYC = () => {
    if (clientRef.current) {
      try {
        (clientRef.current as { cancel: (force?: boolean) => void }).cancel(true);
      } catch (error) {
        console.error('Error cancelling KYC:', error);
      }
    }
    setIsKYCOpen(false);
    setKycStatus('idle');
    setIsLoading(false);
    onCancel?.();
  };

  const getButtonText = () => {
    switch (kycStatus) {
      case 'loading':
        return 'Verifying Identity...';
      case 'completed':
        return 'Identity Verified ✓';
      case 'error':
        return 'Retry Identity Verification';
      default:
        return 'Verify Identity with KYC';
    }
  };

  const getButtonClass = () => {
    const baseClass = styles.kycButton;
    switch (kycStatus) {
      case 'loading':
        return `${baseClass} ${styles.loading}`;
      case 'completed':
        return `${baseClass} ${styles.completed}`;
      case 'error':
        return `${baseClass} ${styles.error}`;
      default:
        return baseClass;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.label}>Identity Verification</label>
        <p className={styles.description}>
          Complete identity verification to create proposals. This helps ensure the security and legitimacy of governance proposals.
        </p>
        
        <button
          type="button"
          className={getButtonClass()}
          onClick={handleStartKYC}
          disabled={disabled || isLoading || kycStatus === 'completed'}
        >
          {getButtonText()}
        </button>

        {isKYCOpen && (
          <div className={styles.kycModal}>
            <div className={styles.modalOverlay} onClick={handleCancelKYC} />
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Identity Verification</h3>
                <button
                  className={styles.closeButton}
                  onClick={handleCancelKYC}
                  type="button"
                >
                  ×
                </button>
              </div>
              {isLoading && (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                  <p>Loading verification system...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className={styles.error}>
            {errorMessage}
          </div>
        )}

        {kycStatus === 'completed' && (
          <div className={styles.success}>
            Identity verification completed successfully! You can now create proposals.
          </div>
        )}
      </div>
    </div>
  );
}
