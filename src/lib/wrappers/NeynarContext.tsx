"use client";

import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";

interface NeynarWrapperProps {
  children: React.ReactNode;
}

export default function NeynarWrapper({ children }: NeynarWrapperProps) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Dark,
        eventsCallbacks: {
          onAuthSuccess: () => {
            console.log("Neynar auth successful");
          },
          onSignout: () => {
            console.log("Neynar signout");
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  );
}
