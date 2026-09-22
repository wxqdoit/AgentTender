'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  FileCode,
  Zap,
} from 'lucide-react';
import { TenderData, TenderStatus } from '../types';
import { useLanguage } from '../lib/i18n';
import { useWallet } from './ReownProvider';
import { formatUSDC } from '../lib/utils';
import { confirmDeliveryOnChain, claimPayoutOnChain } from '../lib/web3';
import { toast } from 'sonner';
import { formatWeb3Error } from '../lib/error';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface SettlementDrawerProps {
  tender: TenderData | null;
  onSettled: () => void;
}

export function SettlementDrawer({
  tender,
  onSettled,
}: SettlementDrawerProps) {
  const { t, language, getStatusText } = useLanguage();
  const { isConnected, openReownModal, refreshBalance } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!tender) return null;

  const isDelivered = tender.status === TenderStatus.DELIVERED || tender.statusText === 'DELIVERED (CHALLENGE)';
  const isSettled = tender.status === TenderStatus.SETTLED || tender.statusText === 'SETTLED';

  let parsedPayload: any = null;
  try {
    if (tender.deliveryPayload) {
      parsedPayload = JSON.parse(tender.deliveryPayload);
    }
  } catch {
    parsedPayload = tender.deliveryPayload;
  }

  const handleConfirm = async () => {
    if (!isConnected) {
      openReownModal();
      return;
    }
    try {
      setIsConfirming(true);
      await confirmDeliveryOnChain(tender.id);
      toast.success(t('settlement_confirm_success'));
      onSettled();
      refreshBalance();
    } catch (err: any) {
      console.error(err);
      toast.error(`${t('settlement_confirm_fail')}: ${formatWeb3Error(err, language)}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClaim = async () => {
    if (!isConnected) {
      openReownModal();
      return;
    }
    try {
      setIsClaiming(true);
      await claimPayoutOnChain(tender.id);
      toast.success(t('settlement_claim_success'));
      onSettled();
      refreshBalance();
    } catch (err: any) {
      console.error(err);
      toast.error(`${t('settlement_claim_fail')}: ${formatWeb3Error(err, language)}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCopy = () => {
    if (tender.deliveryPayload) {
      navigator.clipboard.writeText(tender.deliveryPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Compact Clean Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="py-3 px-4 sm:px-5 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <CardTitle className="text-xs font-mono font-bold tracking-wider uppercase text-foreground">
                  {isSettled ? t('settlement_status_title') : t('settlement_verification')}
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                {isSettled && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono text-[10px] uppercase font-bold">
                    {t('badge_settled')}
                  </Badge>
                )}
                {isDelivered && (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 font-mono text-[10px] uppercase font-bold animate-pulse">
                    {t('badge_delivered')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  {t('active_tender')}
                </span>
                <span className="font-bold text-foreground text-xs mt-0.5 block truncate">
                  #{tender.id}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  {t('winning_node')}
                </span>
                <span className="font-bold text-foreground text-xs mt-0.5 block truncate">
                  {tender.lowestBidderName || 'None'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  {t('clearing_price')}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block tabular-nums">
                  {formatUSDC(tender.currentLowestBid)} USDC
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  {t('refund_amount')}
                </span>
                <span className="font-bold text-primary text-xs mt-0.5 block tabular-nums">
                  {formatUSDC(Math.max(0, tender.maxBudget - tender.currentLowestBid))} USDC
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                {tender.deliveryPayload && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    className="h-8 text-xs font-mono border-border bg-background hover:bg-secondary gap-1.5"
                  >
                    <FileCode className="w-3.5 h-3.5 text-primary" />
                    <span>{t('inspect_payload_btn')}</span>
                  </Button>
                )}
                {isSettled && (
                  <span className="text-emerald-500 text-[11px] font-mono flex items-center gap-1 font-semibold">
                    {t('cleared_escrow_badge')}
                  </span>
                )}
              </div>

              {/* Settlement Triggers */}
              <div className="flex items-center gap-2">
                {isDelivered && (
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="h-8 text-xs font-mono font-medium gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isConfirming ? t('confirming_payout') : t('confirm_payout_btn')}</span>
                  </Button>
                )}

                {isDelivered && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="h-8 text-xs font-mono font-medium border border-border gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isClaiming ? t('claiming_payout') : t('claim_payout_btn')}</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Dialog for Deep Payload Inspection */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl font-mono text-xs bg-card border border-border shadow-xl rounded-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card">
            <DialogTitle className="flex items-center justify-between text-sm font-bold text-foreground">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span>{t('delivery_payload_title')}</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-border bg-secondary/50 font-normal">
                Tender #{tender.id}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {t('delivery_payload_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto bg-background/50">
            {parsedPayload && typeof parsedPayload === 'object' ? (
              <div className="space-y-3">
                {parsedPayload.summary && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      {t('result_summary')}
                    </span>
                    <div className="p-3 rounded-md bg-secondary/40 border border-border text-foreground text-xs leading-relaxed">
                      {parsedPayload.summary}
                    </div>
                  </div>
                )}

                {parsedPayload.metrics && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      {t('execution_telemetry')}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      {Object.entries(parsedPayload.metrics).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-secondary/30 border border-border">
                          <span className="text-muted-foreground block text-[9px] uppercase">{k}</span>
                          <span className="font-bold text-foreground tabular-nums">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    {t('raw_verification_json')}
                  </span>
                  <pre className="p-3 rounded-md bg-background border border-border text-[11px] overflow-x-auto leading-relaxed text-foreground">
                    {JSON.stringify(parsedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <pre className="p-3 rounded-md bg-background border border-border text-[11px] overflow-x-auto leading-relaxed text-foreground whitespace-pre-wrap">
                {tender.deliveryPayload}
              </pre>
            )}
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-between sm:justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 text-xs font-mono border-border gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copy')}</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="h-8 text-xs font-mono border-border"
            >
              {t('close_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
