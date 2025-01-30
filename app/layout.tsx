import type { Metadata } from "next";
import "./globals.css";
import '@solana/wallet-adapter-react-ui/styles.css';
import { Inter } from "next/font/google";
import WalletProvider from "@/src/presentation/components/providers/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nouns95",
  description: "A Windows 95-inspired interface for Nouns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
