import type { Metadata } from "next";
import "./globals.css";
import BlockchainProvider from "@/src/presentation/components/providers/BlockchainProvider";

export const metadata: Metadata = {
  title: "Nouns95",
  description: "Windows 95-inspired desktop environment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BlockchainProvider>
          {children}
        </BlockchainProvider>
      </body>
    </html>
  );
}
