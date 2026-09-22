'use client';

import React from 'react';
import { Bot, CheckCircle, Zap, Trophy, DollarSign } from 'lucide-react';
import { AgentProfile } from '../types';
import { useLanguage } from '../lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface AgentNodesMonitorProps {
  agents: AgentProfile[];
}

export function AgentNodesMonitor({ agents }: AgentNodesMonitorProps) {
  const { t } = useLanguage();

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <CardTitle className="text-xs font-mono font-bold tracking-wider uppercase text-foreground">
            {t('fleet_title')}
          </CardTitle>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] gap-1 py-0.5 px-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t('nodes_ready')}
        </Badge>
      </CardHeader>

      <CardContent className="p-3 flex flex-col gap-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-2.5 rounded-md bg-secondary/40 border border-border flex flex-col gap-1.5 transition-colors hover:border-border/80"
          >
            {/* Name, Model & Stake Tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-card border border-border flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-foreground">
                      {agent.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({agent.model})
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
                {agent.stakeUSDC} USDC {t('staked')}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>{t('bids')}: {agent.totalBids}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-primary" />
                <span>{t('wins')}: {agent.totalWins}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <DollarSign className="w-3 h-3" />
                <span>{t('earned')}: {agent.totalEarnedUSDC.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
