'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { publishTender, fetchUSDCBalance } from '../../lib/web3';
import { formatUSDC } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { CONFIG } from '../../config';

export default function CreateTenderPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { activeAddress, isConnected, openReownModal } = useWallet();

  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState(0.01);
  const [biddingWindow, setBiddingWindow] = useState(35);
  const [executionWindow, setExecutionWindow] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [userBalance, setUserBalance] = useState(0);
  const [blockNumber, setBlockNumber] = useState<number | string>('');

  const refreshBalance = async () => {
    if (activeAddress) {
      const bal = await fetchUSDCBalance(activeAddress);
      setUserBalance(bal);
    } else {
      setUserBalance(0);
    }
  };

  useEffect(() => {
    refreshBalance();
    fetch(`${CONFIG.BACKEND_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => {
        if (d.blockNumber) setBlockNumber(d.blockNumber);
      })
      .catch(() => {});
  }, [activeAddress]);

  const presets = [
    {
      title: t('preset_audit'),
      desc: 'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
      budget: 0.01,
      bidWin: 35,
      execWin: 45,
      prompt:
        'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
    },
    {
      title: t('preset_financial'),
      desc: 'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
      budget: 0.005,
      bidWin: 30,
      execWin: 40,
      prompt:
        'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
    },
    {
      title: t('preset_synthesis'),
      desc: 'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
      budget: 0.02,
      bidWin: 45,
      execWin: 60,
      prompt:
        'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      openReownModal();
      return;
    }
    if (!prompt.trim() || budget < 0.001) {
      alert('Minimum budget must be at least 0.001 USDC');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(t('broadcasting'));

      const result = await publishTender({
        taskMetadataURI: prompt.trim(),
        maxBudgetUSDC: budget,
        biddingWindowSeconds: biddingWindow,
        executionWindowSeconds: executionWindow,
      });

      setStatusMessage(`${t('published_success')} #${result.tenderId}`);
      await refreshBalance();

      setTimeout(() => {
        router.push(`/?tenderId=${result.tenderId}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || err}`);
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono">
      <Header
        blockNumber={blockNumber}
        userBalance={userBalance}
        onRefreshBalance={refreshBalance}
      />

      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 space-y-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <span>{t('create_title')}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('create_desc')}
          </p>
        </div>

        {/* Preset Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {t('presets')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(p.prompt);
                  setBudget(p.budget);
                  setBiddingWindow(p.bidWin);
                  setExecutionWindow(p.execWin);
                }}
                className="text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                    <span>{p.title}</span>
                    <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 bg-primary/5">
                      {p.budget} USDC
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {p.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 mt-2 border-t border-border/60">
                  <span>Window: {p.bidWin}s</span>
                  <span className="group-hover:text-primary transition-colors flex items-center gap-0.5">
                    Select &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Creation Form Card */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-border bg-card">
            <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
              <span>Task Parameters &amp; Arc L1 Escrow</span>
              <Badge variant="outline" className="font-mono text-[10px] border-border bg-secondary/50">
                Sub-Second Clearing
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  {t('prompt_label')}
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('prompt_placeholder')}
                  className="font-mono text-xs h-32 resize-none bg-background border-border p-3 focus-visible:ring-1 focus-visible:ring-primary rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>{t('max_budget')}</span>
                    <span className="font-mono text-primary font-bold">{budget} USDC</span>
                  </label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    max="500"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className="font-mono text-xs h-10 bg-background border-border rounded-md px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>{t('bidding_window')}</span>
                    <span className="font-mono text-foreground">{biddingWindow}s</span>
                  </label>
                  <Input
                    type="number"
                    min="20"
                    max="300"
                    value={biddingWindow}
                    onChange={(e) => setBiddingWindow(Number(e.target.value))}
                    className="font-mono text-xs h-10 bg-background border-border rounded-md px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>{t('exec_window')}</span>
                    <span className="font-mono text-foreground">{executionWindow}s</span>
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="600"
                    value={executionWindow}
                    onChange={(e) => setExecutionWindow(Number(e.target.value))}
                    className="font-mono text-xs h-10 bg-background border-border rounded-md px-3"
                  />
                </div>
              </div>

              {/* Escrow Confirmation Box */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Arc L1 USDC Escrow</span>
                  </div>
                  <span className="font-mono font-bold text-foreground tabular-nums text-sm">
                    {formatUSDC(budget)} USDC
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Budget is locked on-chain in Arc official USDC. Lowest winning bidder receives cleared payout, excess is automatically refunded.
                </p>
              </div>

              {/* Actions & Feedback */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {statusMessage && (
                    <span className="text-primary font-mono flex items-center gap-1.5 animate-pulse">
                      <Zap className="w-4 h-4" />
                      {statusMessage}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !prompt.trim() || budget < 0.001}
                  className="h-10 px-6 text-xs font-medium rounded-md"
                >
                  {isSubmitting ? (
                    <span>{t('broadcasting')}</span>
                  ) : !isConnected ? (
                    <span>{t('wallet_connect')}</span>
                  ) : (
                    <>
                      <span>{t('btn_publish')}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
}
