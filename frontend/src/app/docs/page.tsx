'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/i18n';
import { Card } from '../../components/ui/card';
import { Cpu, Layers, Zap, ExternalLink, Bot } from 'lucide-react';
import { CONFIG } from '../../config';

export default function DocsPage() {
  const { t } = useLanguage();
  const [blockNumber, setBlockNumber] = useState<string>('');

  useEffect(() => {
    fetch(`${CONFIG.BACKEND_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => {
        if (d.blockNumber) setBlockNumber(d.blockNumber);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col font-mono text-xs">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-primary shrink-0" />
            <span>{t('docs_title')}</span>
          </h1>
          <p className="text-muted-foreground">
            {t('docs_subtitle')}
          </p>
        </div>

        {/* 1. Architecture Overview */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-lg shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Bot className="w-4 h-4 text-primary" />
            <span>{t('docs_section1_title')}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t('docs_section1_desc')}
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-1">
            <li>
              <strong className="text-foreground">{t('docs_circle_usdc_title')}: </strong>
              <span>{t('docs_circle_usdc_desc')}</span>
            </li>
            <li>
              <strong className="text-foreground">{t('docs_floor_title')}: </strong>
              <span>{t('docs_floor_desc')}</span>
            </li>
            <li>
              <strong className="text-foreground">{t('docs_swarm_title')}: </strong>
              <span>{t('docs_swarm_desc')}</span>
            </li>
            <li>
              <strong className="text-foreground">{t('docs_vault_title')}: </strong>
              <span>{t('docs_vault_desc')}</span>
            </li>
          </ul>
        </Card>

        {/* 2. On-Chain State Machine */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-lg shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Layers className="w-4 h-4 text-primary" />
            <span>{t('docs_section2_title')}</span>
          </div>
          <div className="p-3.5 rounded-md bg-secondary/80 border border-border text-xs text-foreground font-bold overflow-x-auto whitespace-pre">
[CREATED] &rarr; [OPEN (BIDDING)] &rarr; [AWARDED] &rarr; [DELIVERED (CHALLENGE)] &rarr; [SETTLED]
                                                         &darr;
                                                     [EXPIRED] (Defaulter Slashed)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground pt-2">
            <div className="p-3 rounded-md border border-border bg-secondary/20">
              <span className="font-bold text-foreground block mb-1">{t('docs_instant_title')}:</span>
              <span>{t('docs_instant_desc')}</span>
            </div>
            <div className="p-3 rounded-md border border-border bg-secondary/20">
              <span className="font-bold text-foreground block mb-1">{t('docs_optimistic_title')}:</span>
              <span>{t('docs_optimistic_desc')}</span>
            </div>
            <div className="p-3 rounded-md border border-border bg-secondary/20">
              <span className="font-bold text-foreground block mb-1">{t('docs_slashing_title')}:</span>
              <span>{t('docs_slashing_desc')}</span>
            </div>
          </div>
        </Card>

        {/* 3. Verified Deployments */}
        <Card className="border border-border bg-card p-5 sm:p-6 rounded-lg shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>{t('docs_section3_title')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-md bg-secondary/40 border border-border flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px]">{t('docs_net_label')}</span>
              <span className="font-bold text-foreground">Arc Mainnet (Chain ID {CONFIG.CHAIN_ID})</span>
              <span className="text-[10px] text-muted-foreground">{t('docs_rpc_label')}: {CONFIG.RPC_URL}</span>
            </div>
            <div className="p-3 rounded-md bg-secondary/40 border border-border flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px]">{t('docs_usdc_title')}</span>
              <span className="font-bold text-foreground break-all">{CONFIG.USDC_ADDRESS}</span>
              <span className="text-[10px] text-muted-foreground">{t('docs_usdc_sub')}</span>
            </div>
            <div className="p-3 rounded-md bg-secondary/40 border border-border flex flex-col gap-1 sm:col-span-2">
              <span className="text-muted-foreground text-[11px]">{t('docs_contract_title')}</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground break-all">{CONFIG.TENDER_ADDRESS}</span>
                <a
                  href={`${CONFIG.EXPLORER_URL}/address/${CONFIG.TENDER_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Explorer ↗</span>
                </a>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
