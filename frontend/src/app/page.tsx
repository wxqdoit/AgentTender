'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveArena } from '../components/LiveArena';
import { MachineLogsTerminal } from '../components/MachineLogsTerminal';
import { SettlementDrawer } from '../components/SettlementDrawer';
import { TenderData, AgentProfile, MachineLog, TenderStatus, BidRecord } from '../types';
import { CONFIG } from '../config';
import { useLanguage } from '../lib/i18n';

function HomeContent() {
  const searchParams = useSearchParams();
  const queryTenderId = searchParams.get('tenderId');

  const { t } = useLanguage();

  const [tenders, setTenders] = useState<TenderData[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [logs, setLogs] = useState<MachineLog[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>('');
  const [userPinnedTenderId, setUserPinnedTenderId] = useState<number | null>(() => {
    if (queryTenderId) {
      const parsed = parseInt(queryTenderId, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch state via REST
  const fetchState = useCallback(async () => {
    try {
      const [tendersRes, agentsRes, logsRes, healthRes] = await Promise.all([
        fetch(`${CONFIG.BACKEND_URL}/api/tenders`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/agents`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/logs`).then((r) => r.json()),
        fetch(`${CONFIG.BACKEND_URL}/api/health`).then((r) => r.json()),
      ]);

      if (tendersRes.success && Array.isArray(tendersRes.data)) {
        setTenders(tendersRes.data.sort((a: TenderData, b: TenderData) => b.id - a.id));
      }
      if (agentsRes.success) setAgents(agentsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (healthRes.status === 'OK') setBlockNumber(healthRes.blockNumber);
    } catch (err) {
      console.warn('REST sync error:', err);
    }
  }, []);

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
              if (Array.isArray(msg.data.tenders)) {
                setTenders(msg.data.tenders.sort((a: TenderData, b: TenderData) => b.id - a.id));
              }
              if (Array.isArray(msg.data.agents)) setAgents(msg.data.agents);
              if (Array.isArray(msg.data.logs)) setLogs(msg.data.logs);
            } else if (msg.type === 'TENDER_UPDATE') {
              const updated = msg.data as TenderData;
              setTenders((prev) => {
                const idx = prev.findIndex((t) => t.id === updated.id);
                let nextList: TenderData[];
                if (idx >= 0) {
                  nextList = [...prev];
                  nextList[idx] = updated;
                } else {
                  nextList = [updated, ...prev];
                }
                return nextList.sort((a, b) => b.id - a.id);
              });
            } else if (msg.type === 'NEW_BID') {
              const bid = msg.data as BidRecord;
              setTenders((prev) => {
                const idx = prev.findIndex((t) => t.id === bid.tenderId);
                if (idx >= 0) {
                  const nextList = [...prev];
                  const current = { ...nextList[idx] };
                  const exists = current.bids.some(
                    (b) => b.timestamp === bid.timestamp && b.bidder === bid.bidder
                  );
                  if (!exists) {
                    current.bids = [...current.bids, bid];
                    current.currentLowestBid = bid.bidAmount;
                    current.currentLowestBidRaw = bid.bidAmountRaw;
                    current.lowestBidder = bid.bidder;
                    current.lowestBidderName = bid.bidderName;
                    nextList[idx] = current;
                  }
                  return nextList;
                }
                return prev;
              });
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
    const pollInterval = setInterval(fetchState, 5000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchState]);

  // Dynamically resolve activeTender:
  // 1. If pinned manually by user: use that specific tender.
  // 2. Otherwise (Auto Live mode):
  //    - Prioritize any currently OPEN (bidding) tender.
  //    - Next, any DELIVERED tender awaiting challenge.
  //    - Fallback to newest tender in list.
  const activeTender = useMemo(() => {
    if (userPinnedTenderId !== null) {
      const pinned = tenders.find((t) => t.id === userPinnedTenderId);
      if (pinned) return pinned;
    }
    const openTender = tenders.find((t) => t.status === TenderStatus.OPEN);
    if (openTender) return openTender;

    const deliveredTender = tenders.find((t) => t.status === TenderStatus.DELIVERED);
    if (deliveredTender) return deliveredTender;

    return tenders[0] || null;
  }, [tenders, userPinnedTenderId]);

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        {/* Core 2-Column Responsive Workspace: Live Arena (7 cols) + Telemetry Logs (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Bidding Arena (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <LiveArena
              tender={activeTender}
              tendersList={tenders}
              isLiveAuto={userPinnedTenderId === null}
              onSelectTender={(id) => setUserPinnedTenderId(id)}
            />

            {/* Compact Settlement & Delivery Verification Strip */}
            {activeTender && (
              <SettlementDrawer
                tender={activeTender}
                onSettled={fetchState}
              />
            )}
          </div>

          {/* Machine Reasoning Logs Stream (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <MachineLogsTerminal logs={logs} />
          </div>
        </div>
      </main>

      {/* Clean Industrial Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-[11px] font-mono text-muted-foreground">
        {t('footer_protocol')}
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
