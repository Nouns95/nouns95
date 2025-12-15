'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SIWNCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('Callback page loaded. Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('SIWN Callback received:', { code: code?.substring(0, 10) + '...', error, state });

    // Check if we're actually on the callback page with parameters
    if (!code && !error && window.location.search === '') {
      console.log('No parameters found - this might be the initial load before Neynar redirect');
      return;
    }

    // Send message to parent window (popup opener)
    if (window.opener) {
      console.log('Sending message to parent window');
      
      if (error) {
        console.log('Sending error to parent:', error);
        window.opener.postMessage({
          type: 'SIWN_CALLBACK',
          error: error
        }, window.location.origin);
      } else if (code) {
        console.log('Sending code to parent:', code.substring(0, 10) + '...');
        window.opener.postMessage({
          type: 'SIWN_CALLBACK',
          code: code,
          state: state
        }, window.location.origin);
      } else {
        console.log('No code or error received');
        window.opener.postMessage({
          type: 'SIWN_CALLBACK',
          error: 'No authorization code received'
        }, window.location.origin);
      }
      
      // Close the popup after a short delay to ensure message is sent
      setTimeout(() => {
        console.log('Closing popup');
        window.close();
      }, 1000);
    } else {
      console.log('No window.opener found');
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'MS Sans Serif, sans-serif',
      backgroundColor: '#f0f0f0',
      color: '#000000'
    }}>
      <div style={{
        padding: '20px',
        border: '2px inset #c0c0c0',
        backgroundColor: '#ffffff',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          {searchParams.get('code') ? 'Authentication Successful!' : 'Processing Authentication...'}
        </h2>
        <p style={{ margin: '0', fontSize: '11px', color: '#808080' }}>
          {searchParams.get('code') 
            ? 'Completing sign-in process...' 
            : 'If you see a "Continue" button in Neynar, please click it to proceed.'
          }
        </p>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #808080',
          borderTop: '2px solid #000000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '10px auto'
        }}></div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
