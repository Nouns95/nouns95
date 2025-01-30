import type { Metadata } from 'next';
import RootProviders from '@/src/presentation/providers/RootProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nouns95',
  description: 'Windows 95-style Nouns interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
} 