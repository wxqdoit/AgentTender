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
  CONFIG.CHAIN_ID === 5042
    ? arc
    : CONFIG.CHAIN_ID === 5042002
    ? arcTestnet
    : arcDevnet;

// Wagmi adapter with official Arc Testnet (5042002), Arc Mainnet (5042) and local Arc Devnet
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [arc, arcTestnet, arcDevnet],
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
  networks: [arc, arcTestnet, arcDevnet],
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
  openReownModal: (view?: 'Account' | 'Connect' | 'Networks') => Promise<void>;
  disconnectReown: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

function WalletManager({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const appKit = useAppKit();

  const activeAddress: Address | undefined = useMemo(() => {
    return address as Address | undefined;
  }, [address]);

  // Read initial balance from localStorage to prevent any reset to 0 upon route switching or mount
  const [userBalance, setUserBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('agent_tender_usdc_bal');
      if (cached) {
        const val = parseFloat(cached);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  });

  // Global persistent balance refresh that does NOT flicker or reset to 0 on route navigation
  const refreshBalance = useCallback(async () => {
    if (activeAddress) {
      try {
        const bal = await fetchUSDCBalance(activeAddress);
        setUserBalance(bal);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agent_tender_usdc_bal', String(bal));
          localStorage.setItem(`agent_tender_usdc_bal_${activeAddress.toLowerCase()}`, String(bal));
        }
      } catch (e) {
        console.warn('Balance sync error:', e);
      }
    } else {
      setUserBalance(0);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agent_tender_usdc_bal');
      }
    }
  }, [activeAddress]);

  // When activeAddress changes, check if we have a cached balance for this specific address
  useEffect(() => {
    if (activeAddress && typeof window !== 'undefined') {
      const cached = localStorage.getItem(`agent_tender_usdc_bal_${activeAddress.toLowerCase()}`);
      if (cached) {
        const val = parseFloat(cached);
        if (!isNaN(val)) setUserBalance(val);
      }
    }
    refreshBalance();
  }, [activeAddress, refreshBalance]);

  // Silent automatic background polling every 4 seconds without flickering
  useEffect(() => {
    if (!activeAddress) return;
    const interval = setInterval(() => {
      refreshBalance();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeAddress, refreshBalance]);

  const handleOpenWallet = async (view?: 'Account' | 'Connect' | 'Networks') => {
    try {
      if (view) {
        await appKit.open({ view });
        return;
      }
      if (isConnected) {
        await appKit.open({ view: 'Account' });
        return;
      }
      // If disconnected, try injected or open Connect modal
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const injectedConn = connectors.find((c) => c.id === 'injected') || connectors[0];
        if (injectedConn) {
          try {
            await connect({ connector: injectedConn });
            return;
          } catch (connErr: any) {
            console.warn('Injected connection prompt error, opening modal:', connErr);
          }
        }
      }
      await appKit.open({ view: 'Connect' });
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('agent_tender_usdc_bal');
          }
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
