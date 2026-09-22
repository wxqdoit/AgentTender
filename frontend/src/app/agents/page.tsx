'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Zap, Trophy, DollarSign, ShieldCheck, Cpu, Code2, CheckCircle2, Radio } from 'lucide-react';
import { AgentProfile } from '../../types';
import { CONFIG } from '../../config';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import { formatUSDC } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function AgentsPage() {
  const { t, localizeStrategyDescription } = useLanguage();
  const { activeAddress } = useWallet();

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>('');

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const [aRes, hRes] = await Promise.all([
          fetch(`${CONFIG.BACKEND_URL}/api/agents`).then((r) => r.json()),
          fetch(`${CONFIG.BACKEND_URL}/api/health`).then((r) => r.json()),
        ]);
        if (aRes.success) setAgents(aRes.data);
        if (hRes.status === 'OK') setBlockNumber(hRes.blockNumber);
      } catch (e) {
        console.warn('Error fetching agents:', e);
      }
    };
    fetchFleet();
    const interval = setInterval(fetchFleet, 3000);
    return () => clearInterval(interval);
  }, [activeAddress]);

  const totalStaked = agents.reduce((acc, a) => acc + (a.stakeUSDC || 0), 0);
  const totalVolume = agents.reduce((acc, a) => acc + (a.totalEarnedUSDC || 0), 0);
  const totalMissions = agents.reduce((acc, a) => acc + (a.totalWins || 0), 0);

  return (
    <div className="flex-1 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-primary shrink-0" />
              <span>{t('agents_title')}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('agents_subtitle')}
            </p>
          </div>

          <Badge variant="outline" className="font-mono text-xs border-border bg-secondary/50 self-start sm:self-auto">
            <Radio className="w-3 h-3 text-emerald-500 mr-1.5 animate-pulse" />
            {t('active_fleet_badge')}
          </Badge>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">{t('stat_nodes')}</span>
            <div className="my-1 text-2xl font-bold text-foreground">
              {agents.length} / {agents.length || 4}
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('agents_100_qualified')}
            </span>
          </Card>

          <Card className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">{t('stat_staked')}</span>
            <div className="my-1 text-2xl font-bold text-foreground tabular-nums">
              {formatUSDC(totalStaked)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <span className="text-[10px] text-primary font-semibold">{t('stake_secured')}</span>
          </Card>

          <Card className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">{t('stat_volume')}</span>
            <div className="my-1 text-2xl font-bold text-foreground tabular-nums">
              {formatUSDC(totalVolume)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold">{t('agents_atomic_settled')}</span>
          </Card>

          <Card className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">{t('stat_completed')}</span>
            <div className="my-1 text-2xl font-bold text-foreground tabular-nums">
              {totalMissions}
            </div>
            <span className="text-[10px] text-muted-foreground">{t('verified_proofs')}</span>
          </Card>
        </div>

        {/* Detailed Node Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="border border-border bg-card shadow-sm rounded-lg flex flex-col justify-between overflow-hidden group hover:border-primary/40 transition-colors"
            >
              <CardHeader className="py-3.5 px-4 border-b border-border flex flex-row items-center justify-between space-y-0 bg-card">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-xs font-bold text-foreground truncate">
                      {agent.name}
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {agent.address ? `${agent.address.slice(0, 6)}...${agent.address.slice(-4)}` : '---'}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10 shrink-0">
                  {t('qualified_badge')}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('model_type')}:</span>
                  <span className="font-bold text-foreground text-xs">{agent.model}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('strategy')}:</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {localizeStrategyDescription(agent.strategy.description)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t('min_margin')}</span>
                    <div className="font-bold text-primary text-xs">
                      {(agent.strategy.margin * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t('stake_status')}</span>
                    <div className="font-bold text-foreground text-xs tabular-nums">
                      {formatUSDC(agent.stakeUSDC)} USDC
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border text-[11px]">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t('bids')}</span>
                    <div className="font-bold text-foreground">{agent.totalBids}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t('wins')}</span>
                    <div className="font-bold text-foreground">{agent.totalWins}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t('earned')}</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatUSDC(agent.totalEarnedUSDC)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Game-Theoretic Formulation Card */}
        <Card className="border border-border bg-card p-5 rounded-lg text-xs shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-foreground">
            <Code2 className="w-4 h-4 text-primary" />
            <span>{t('pricing_rule_title')}</span>
          </div>
          <p className="text-muted-foreground mb-3 text-[11px] leading-relaxed">
            {t('pricing_rule_desc')}
          </p>
          <div className="p-3.5 rounded-md bg-secondary border border-border text-xs text-foreground font-bold">
            TargetBid = max(Cost_compute + Cost_gas + Floor_margin, CurrentLowestBid - StepDecrement)
          </div>
        </Card>
      </main>
    </div>
  );
}
