'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Header } from '../components/Header';
import { LiveArena } from '../components/LiveArena';
import { MachineLogsTerminal } from '../components/MachineLogsTerminal';
import { SettlementDrawer } from '../components/SettlementDrawer';
import { TenderData, AgentProfile, MachineLog } from '../types';
import { CONFIG } from '../config';
import { fetchUSDCBalance } from '../lib/web3';
import { useWallet } from '../components/ReownProvider';

function HomeContent() {
  const searchParams = useSearchParams();
  const queryTenderId = searchParams.get('tenderId');

  const { activeAddress } = useWallet();

  const [tenders, setTenders] = useState<TenderData[]>([]);
  const [activeTenderId, setActiveTenderId] = useState<number | null>(null);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [logs, setLogs] = useState<MachineLog[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);

  // Refresh user balance
  const refreshBalance = useCallback(async () => {
    if (activeAddress) {
      const bal = await fetchUSDCBalance(activeAddress);
      setUserBalance(bal);
    }
  }, [activeAddress]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 8000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  // Fetch state via REST
  const fetchState = useCallback(async () => {
    try {
      const [tendersRes, agentsRes, logsRes, healthRes] = await Promise.all([
        fetch(`${CONFIG.BACKEND_URL}/api/tenders`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/agents`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/logs`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/health`).then((r) => r.json()),
      ]);

      if (tendersRes.success) {
        setTenders(tendersRes.data);
        if (tendersRes.data.length > 0) {
          setActiveTenderId((prev) => {
            if (queryTenderId) {
              const matched = tendersRes.data.find((t: any) => t.id === parseInt(queryTenderId, 10));
              if (matched) return matched.id;
            }
            return prev !== null ? prev : tendersRes.data[0].id;
          });
        }
      }
      if (agentsRes.success) setAgents(agentsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (healthRes.status === 'OK') setBlockNumber(healthRes.blockNumber);
    } catch (err) {
      console.warn('REST sync error:', err);
    }
  }, [queryTenderId]);

  // WebSocket real-time subscription
  useEffect(() => {
    fetchState();

    const connectWs = () => {
      try {
        const ws = new WebSocket(CONFIG.WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WS] Connected to AgentTender bus');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'INIT') {
              setTenders(msg.data.tenders);
              setAgents(msg.data.agents);
              setLogs(msg.data.logs);
              if (msg.data.tenders.length > 0) {
                setActiveTenderId((prev) => (prev !== null ? prev : msg.data.tenders[0].id));
              }
            } else if (msg.type === 'TENDER_UPDATE') {
              const updated = msg.data as TenderData;
              setTenders((prev) => {
                const idx = prev.findIndex((t) => t.id === updated.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = updated;
                  return copy;
                }
                return [updated, ...prev];
              });
              setActiveTenderId((prev) => (prev === null ? updated.id : prev));
            } else if (msg.type === 'LOG') {
              const newLog = msg.data as MachineLog;
              setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        ws.onclose = () => {
          setTimeout(connectWs, 2000);
        };

        ws.onerror = (e) => {
          console.warn('[WS] Error:', e);
        };
      } catch (e) {
        setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    const pollInterval = setInterval(fetchState, 8000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchState]);

  const activeTender = tenders.find((t) => t.id === activeTenderId) || tenders[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        blockNumber={blockNumber}
        userBalance={userBalance}
        onRefreshBalance={refreshBalance}
      />

      <motion.main initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        {/* Core 2-Column Responsive Workspace: Live Arena (7 cols) + Telemetry Logs (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Bidding Arena (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <LiveArena
              tender={activeTender}
              tendersList={tenders}
              onSelectTender={setActiveTenderId}
            />

            {/* Compact Settlement & Delivery Verification Strip */}
            {activeTender && (
              <SettlementDrawer
                tender={activeTender}
                onSettled={fetchState}
                onRefreshBalance={refreshBalance}
              />
            )}
          </div>

          {/* Machine Reasoning Logs Stream (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <MachineLogsTerminal logs={logs} />
          </div>
        </div>
      </motion.main>

      {/* Clean Industrial Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-[11px] font-mono text-muted-foreground">
        AgentTender &bull; Machine Commerce Reverse-Auction Protocol on Arc L1 &bull; Native USDC Gas
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
