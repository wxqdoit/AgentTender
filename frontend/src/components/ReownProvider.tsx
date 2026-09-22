'use client';

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { WagmiProvider, useAccount, useDisconnect, useConnect, injected } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit, useAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { arcTestnet, arc } from '@reown/appkit/networks';
import { defineChain, http, type Address } from 'viem';
import { CONFIG } from '../config';
import { fetchUSDCBalance } from '../lib/web3';

// Define local Devnet if needed
export const arcDevnet = defineChain({
  id: 31337,
  name: 'Arc Local Devnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// Default to configured network
const configuredNetwork =
  CONFIG.CHAIN_ID === 5042002
    ? arcTestnet
    : CONFIG.CHAIN_ID === 5042
    ? arc
    : arcDevnet;

// Wagmi adapter with official Arc Testnet (5042002), Arc Mainnet (5042) and local Arc Devnet
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [arcTestnet, arc, arcDevnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(CONFIG.RPC_URL || 'https://rpc.testnet.arc.network'),
    [arc.id]: http('https://rpc.mainnet.arc.io'),
    [arcDevnet.id]: http('http://127.0.0.1:8545'),
  },
});

// AppKit modal instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnet, arc, arcDevnet],
  defaultNetwork: configuredNetwork,
  projectId,
  metadata: {
    name: 'AgentTender',
    description: 'Autonomous Reverse-Auction Protocol for Arc & Circle USDC',
    url: 'https://agenttender.io',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  themeMode: 'dark',
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

interface WalletContextType {
  activeAddress?: Address;
  isConnected: boolean;
  userBalance: number;
  refreshBalance: () => Promise<void>;
  openReownModal: () => Promise<void>;
  disconnectReown: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

function WalletManager({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const appKit = useAppKit();

  const [userBalance, setUserBalance] = useState<number>(0);

  const activeAddress: Address | undefined = useMemo(() => {
    return address as Address | undefined;
  }, [address]);

  // Global persistent balance refresh that does NOT flicker or reset to 0 on route navigation
  const refreshBalance = useCallback(async () => {
    if (activeAddress) {
      try {
        const bal = await fetchUSDCBalance(activeAddress);
        setUserBalance(bal);
      } catch (e) {
        console.warn('Balance sync error:', e);
      }
    } else {
      setUserBalance(0);
    }
  }, [activeAddress]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 10000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const handleOpenWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const injectedConn = connectors.find((c) => c.id === 'injected') || connectors[0];
        if (injectedConn) {
          try {
            await connect({ connector: injectedConn });
            return;
          } catch (connErr: any) {
            console.warn('Direct injected connection prompt, falling back to modal:', connErr);
          }
        }
      }
      await appKit.open();
    } catch (err) {
      console.warn('Wallet open error:', err);
      try {
        await appKit.open();
      } catch {}
    }
  };

  return (
    <WalletContext.Provider
      value={{
        activeAddress,
        isConnected,
        userBalance,
        refreshBalance,
        openReownModal: handleOpenWallet,
        disconnectReown: () => {
          disconnect();
          setUserBalance(0);
        },
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

const queryClient = new QueryClient();

export function ReownProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletManager>{children}</WalletManager>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within ReownProvider');
  return ctx;
}
