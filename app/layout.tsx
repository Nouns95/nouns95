import type { Metadata, Viewport } from "next";
import { headers } from 'next/headers'
import "./globals.css";
import { Inter } from "next/font/google";
import AppkitContext from "../src/context/AppkitContext";
import { Analytics } from '@vercel/analytics/next';
import { ApolloWrapper } from "../src/components/ApolloWrapper";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Nouns 95",
  description: "Nouns 95",
  applicationName: "Nouns 95",
  authors: [{ name: "Macrohard" }],
  keywords: ["Nouns", "DAO", "95"],
  metadataBase: new URL("https://nouns95v2.vercel.app"),
  openGraph: {
    title: "Nouns 95",
    description: "Nouns95 - A Web3 Operating System",
    url: "https://nouns95v2.vercel.app",
    siteName: "Nouns 95",
    images: [
      {
        url: "https://nouns95v2.vercel.app/public/icons/clouds.png",
        width: 640,
        height: 480,
        alt: "Nouns 95"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nouns 95",
    description: "Nouns 95",
    images: ["https://nouns95v2.vercel.app/public/icons/clouds.png"],
  },
  icons: {
    icon: [
      { url: "/public/icons/clouds.png" },
    ],
    apple: [
      { url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </AppkitContext>
        <Analytics />
      </body>
    </html>
  );
}
