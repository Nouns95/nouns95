import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import AppkitContext from "../src/lib/wrappers/AppkitContext";
import { Analytics } from '@vercel/analytics/next';
import { ApolloWrapper } from "../src/lib/wrappers/ApolloWrapper";
import NeynarWrapper from "../src/lib/wrappers/NeynarContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Nouns 95 - Service Unavailable",
  description: "Nouns 95 has been deprecated. Please visit BerryOS for the latest experience.",
  applicationName: "Nouns 95",
  authors: [{ name: "Macrohard" }],
  keywords: ["Nouns", "DAO", "95", "BerryOS"],
  metadataBase: new URL("https://nouns95.wtf"),
  openGraph: {
    title: "Nouns 95 - Service Unavailable",
    description: "Nouns 95 has been deprecated. Visit BerryOS.wtf for the latest experience.",
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
    title: "Nouns 95 - Service Unavailable",
    description: "Nouns 95 has been deprecated. Visit BerryOS.wtf",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppkitContext>
          <ApolloWrapper>
            <NeynarWrapper>
              {children}
            </NeynarWrapper>
          </ApolloWrapper>
        </AppkitContext>
        <Analytics />
      </body>
    </html>
  );
}
