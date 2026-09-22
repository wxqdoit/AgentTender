'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, Send, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { publishTender } from '../lib/web3';
import { useLanguage } from '../lib/i18n';
import { useWallet } from './ReownProvider';
import { toast } from 'sonner';
import { formatWeb3Error } from '../lib/error';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

interface TenderCreatorProps {
  onTenderPublished: (tenderId: number) => void;
  onRefreshBalance: () => void;
  userBalance: number;
}

export function TenderCreator({
  onTenderPublished,
  onRefreshBalance,
  userBalance,
}: TenderCreatorProps) {
  const { t } = useLanguage();
  const { isConnected, openReownModal } = useWallet();

  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState(0.01);
  const [biddingWindow, setBiddingWindow] = useState(35);
  const [executionWindow, setExecutionWindow] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const presets = [
    {
      title: t('preset_audit'),
      desc: 'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
      budget: 0.01,
      bidWin: 35,
      execWin: 45,
      prompt: 'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
    },
    {
      title: t('preset_financial'),
      desc: 'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
      budget: 0.005,
      bidWin: 30,
      execWin: 40,
      prompt: 'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
    },
    {
      title: t('preset_synthesis'),
      desc: 'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
      budget: 0.02,
      bidWin: 45,
      execWin: 60,
      prompt: 'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      openReownModal();
      return;
    }
    if (!prompt.trim() || budget < 0.001) {
      toast.warning('最高限额必须大于或等于 0.001 USDC');
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
      onTenderPublished(result.tenderId);
      onRefreshBalance();

      setTimeout(() => {
        setStatusMessage(null);
        setPrompt('');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast.error(`发布招标失败: ${formatWeb3Error(err)}`);
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="py-3 px-4 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{t('create_title')}</span>
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px] border-border bg-secondary/50">
            Arc L1 Invariant
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Presets */}
        <div>
          <label className="text-xs font-mono font-medium text-muted-foreground mb-1.5 block">
            {t('presets')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                className="text-left p-2.5 rounded-md border border-border bg-secondary/30 hover:bg-secondary/70 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-foreground mb-1">
                  <span>{p.title}</span>
                  <span className="text-primary font-mono">{p.budget} USDC</span>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground line-clamp-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono font-medium text-muted-foreground mb-1 block">
              {t('prompt_label')}
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('prompt_placeholder')}
              className="font-mono text-xs h-20 resize-none bg-background border-border"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono font-medium text-muted-foreground mb-1 flex items-center justify-between">
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
                className="font-mono text-xs h-8 bg-background border-border"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-muted-foreground mb-1 flex items-center justify-between">
                <span>{t('bidding_window')}</span>
                <span className="font-mono text-foreground">{biddingWindow}s</span>
              </label>
              <Input
                type="number"
                min="20"
                max="300"
                value={biddingWindow}
                onChange={(e) => setBiddingWindow(Number(e.target.value))}
                className="font-mono text-xs h-8 bg-background border-border"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-muted-foreground mb-1 flex items-center justify-between">
                <span>{t('exec_window')}</span>
                <span className="font-mono text-foreground">{executionWindow}s</span>
              </label>
              <Input
                type="number"
                min="10"
                max="600"
                value={executionWindow}
                onChange={(e) => setExecutionWindow(Number(e.target.value))}
                className="font-mono text-xs h-8 bg-background border-border"
              />
            </div>
          </div>

          {/* Escrow note */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-secondary/40 border border-border text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Arc L1 USDC Escrow</span>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0">{budget} USDC</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs">
              {statusMessage && (
                <span className="text-primary font-mono flex items-center gap-1.5 animate-pulse">
                  <Zap className="w-3.5 h-3.5" />
                  {statusMessage}
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !prompt.trim() || budget < 0.001}
              className="h-9 px-4 text-xs font-mono font-medium"
            >
              {isSubmitting ? (
                <span>{t('broadcasting')}</span>
              ) : !isConnected ? (
                <span>{t('wallet_connect')}</span>
              ) : (
                <>
                  <span>{t('btn_publish')}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
