import type { Metadata } from "next";
import { headers } from 'next/headers'
import "./globals.css";
import { Inter } from "next/font/google";
import AppkitContext from "../src/context/AppkitContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nouns95",
  description: "A Windows 95-inspired interface for Nouns",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppkitContext cookies={cookies}>
          {children}
        </AppkitContext>
      </body>
    </html>
  );
}
