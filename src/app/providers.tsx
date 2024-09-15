"use client";
import { type ReactNode, useState, useEffect } from "react";

import { CacheProvider } from "@chakra-ui/next-js";
import { extendTheme, ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

const DAppKitProvider = dynamic(
  async () => {
      const { DAppKitProvider: _DAppKitProvider } = await import(
          '@vechain/dapp-kit-react'
      );
      return _DAppKitProvider;
  },
  {
      ssr: false,
  },
);


export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const queryClient = new QueryClient();

  const theme = extendTheme({ initialColorMode: "dark", useSystemColorMode: false });

  const appInfo = {
    appName: "EpheSafe",
  };

  return (
    <DAppKitProvider
    // REQUIRED: The URL of the node you want to connect to
    nodeUrl={'https://testnet.vechain.org/'}
    // OPTIONAL: Required if you're not connecting to the main net
    genesis={'test'}
    // OPTIONAL: Whether or not to persist state in local storage (account, wallet source)
    usePersistence={true}
    // OPTIONAL: A log level for console logs
    logLevel="DEBUG"

    // OPTIONAL: every wallet has a connection certificate, but wallet connect doesn't connect with a certificate, it uses a session; if required, with this option, we will force the user to sign a certificate after he finishes the connection with wallet connect
    // requireCertificate= {false}
>

      <QueryClientProvider client={queryClient}>
        <CacheProvider>
          <ChakraProvider resetCSS theme={theme}>
          {mounted && children}

          </ChakraProvider>
        </CacheProvider>
      </QueryClientProvider>
      </DAppKitProvider>

  );
}
