import type { Metadata, Viewport } from "next";
import { headers } from 'next/headers'
import "./globals.css";
import { Inter } from "next/font/google";
import AppkitContext from "../src/context/AppkitContext";
import { Analytics } from '@vercel/analytics/next';
import { ApolloWrapper } from "../src/wrappers/ApolloWrapper";

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
  metadataBase: new URL("https://nouns95.wtf"),
  openGraph: {
    title: "Nouns 95",
    description: "Nouns95 - Start me up.",
    url: "https://nouns95.wtf",
    siteName: "Nouns 95",
    images: [
      {
        url: "/icons/shell/TaskBar/StartMenu/StartMenu.png",
        width: 32,
        height: 32,
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
    images: ["/icons/shell/TaskBar/StartMenu/StartMenu.png"],
  },
  icons: {
    icon: '/icons/shell/TaskBar/StartMenu/StartMenu.png',
    shortcut: '/icons/shell/TaskBar/StartMenu/StartMenu.png',
    apple: '/icons/shell/TaskBar/StartMenu/StartMenu.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icons/shell/TaskBar/StartMenu/StartMenu.png',
    },
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
