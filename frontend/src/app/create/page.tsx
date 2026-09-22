'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Zap,
  Lock,
  Clock,
  ShieldAlert,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { publishTender } from '../../lib/web3';
import { formatUSDC } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import { toast } from 'sonner';
import { formatWeb3Error } from '../../lib/error';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { CONFIG } from '../../config';

export default function CreateTenderPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { activeAddress, isConnected, userBalance, openReownModal, refreshBalance } = useWallet();

  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState(0.01);
  const [biddingWindow, setBiddingWindow] = useState(35);
  const [executionWindow, setExecutionWindow] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | string>('');

  useEffect(() => {
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
      desc: t('preset_audit_desc'),
      budget: 0.01,
      bidWin: 35,
      execWin: 45,
      prompt: t('preset_audit_prompt'),
    },
    {
      title: t('preset_financial'),
      desc: t('preset_financial_desc'),
      budget: 0.005,
      bidWin: 30,
      execWin: 40,
      prompt: t('preset_financial_prompt'),
    },
    {
      title: t('preset_synthesis'),
      desc: t('preset_synthesis_desc'),
      budget: 0.02,
      bidWin: 45,
      execWin: 60,
      prompt: t('preset_synthesis_prompt'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      openReownModal();
      return;
    }
    if (!prompt.trim() || budget < 0.001) {
      toast.warning(t('create_min_budget_warn'));
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
      refreshBalance();

      setTimeout(() => {
        router.push(`/?tenderId=${result.tenderId}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(`${t('create_publish_fail')}: ${formatWeb3Error(err, language)}`);
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <span>{t('create_title')}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('create_desc')}
          </p>
        </div>

        {/* 2-Column Responsive Layout: Form on Left (7 cols) + Invariants on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Presets + Main Creation Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Preset Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t('presets')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <span>{t('create_window_unit')}: {p.bidWin}s</span>
                      <span className="group-hover:text-primary transition-colors flex items-center gap-0.5">
                        {t('create_select_preset')}
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
                  <span>{t('create_task_params')}</span>
                  <Badge variant="outline" className="font-mono text-[10px] border-border bg-secondary/50">
                    {t('create_subsecond')}
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

                  {/* Actions & Feedback */}
                  <div className="flex items-center justify-between pt-2">
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
          </div>

          {/* Right Column: Escrow Breakdown & Safety Invariants (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Escrow Breakdown Card */}
            <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border bg-card">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('create_escrow_breakdown')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-md bg-secondary/30 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('max_budget')}:</span>
                    <span className="font-bold text-foreground tabular-nums text-sm">
                      {formatUSDC(budget)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('floor_label')}:</span>
                    <span className="text-foreground font-mono">0.001 USDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('step_label')}:</span>
                    <span className="text-foreground font-mono">0.001 USDC</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                    <span className="text-muted-foreground">{t('balance')}:</span>
                    <span className="text-primary font-bold tabular-nums">
                      {formatUSDC(userBalance)} USDC
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('create_escrow_note')}
                </p>
              </CardContent>
            </Card>

            {/* Invariants & Security Guard Card */}
            <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border bg-card">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>{t('create_guarantee_title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="space-y-2">
                  <div className="p-2.5 rounded border border-border bg-secondary/20 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3 h-3 text-primary" />
                      {t('create_challenge_window')}
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {t('create_challenge_desc')}
                    </p>
                  </div>

                  <div className="p-2.5 rounded border border-amber-500/30 bg-amber-500/5 space-y-1">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-[11px]">
                      <ShieldAlert className="w-3 h-3" />
                      {t('create_slashing_title')}
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {t('create_slashing_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-semibold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Arc L1 Sub-Second Finality • Circle Official Native USDC</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
