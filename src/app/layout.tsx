import type { Metadata } from 'next';
import { headers } from 'next/headers'
import AppkitContext from '../context/AppkitContext'
import '@reown/appkit-wallet-button/react'
import './globals.css';

export const metadata: Metadata = {
  title: 'Nouns95',
  description: 'Windows 95-style Nouns interface',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body>
        <AppkitContext cookies={cookies}>
          {children}
        </AppkitContext>
      </body>
    </html>
  );
} 