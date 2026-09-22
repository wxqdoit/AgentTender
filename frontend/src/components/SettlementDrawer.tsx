'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onRefreshBalance: () => void;
}

export function SettlementDrawer({
  tender,
  onSettled,
  onRefreshBalance,
}: SettlementDrawerProps) {
  const { t, getStatusText } = useLanguage();
  const { isConnected, openReownModal } = useWallet();

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
      onSettled();
      onRefreshBalance();
    } catch (err: any) {
      console.error(err);
      alert(`Confirmation failed: ${err.message || err}`);
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
      onSettled();
      onRefreshBalance();
    } catch (err: any) {
      console.error(err);
      alert(`Claim failed: ${err.message || err}`);
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
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="py-3 px-4 sm:px-5 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t('settlement_status_title')}</span>
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] uppercase border-border px-2 py-0.5 ${
                  isSettled
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : isDelivered
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                    : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                {getStatusText(tender.status, tender.statusText)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">{t('active_tender')}:</span>
              <span className="text-foreground font-bold">#{tender.id}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">{t('winning_node')}:</span>
              <span className="text-foreground font-medium">
                {tender.lowestBidderName || (tender.lowestBidder && tender.lowestBidder !== '0x0000000000000000000000000000000000000000'
                  ? `${tender.lowestBidder.slice(0, 8)}...${tender.lowestBidder.slice(-6)}`
                  : '---')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">{t('clearing_price')}:</span>
              <span className="text-primary font-bold tabular-nums">
                {tender.currentLowestBid > 0 ? `${formatUSDC(tender.currentLowestBid)} USDC` : '---'}
              </span>
            </div>

            <div className="pt-3 border-t border-border flex items-center gap-2.5">
              {tender.deliveryPayload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpen(true)}
                  className="flex-1 h-8 text-xs font-mono border-border bg-background hover:bg-secondary/70 rounded-md transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                  <span>{t('inspect_payload_btn')}</span>
                </Button>
              )}

              {isDelivered && (
                <Button
                  size="sm"
                  disabled={isConfirming}
                  onClick={handleConfirm}
                  className="flex-1 h-8 text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>{isConfirming ? t('confirming_payout') : t('confirm_payout_btn')}</span>
                </Button>
              )}

              {isSettled && (
                <div className="flex-1 h-8 px-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t('cleared_escrow_badge')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Dialog for Clean Structured Payload Viewing */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-card border-border font-mono rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between text-foreground">
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span>{t('delivery_payload_title')} #{tender.id}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs font-mono border border-border rounded"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('delivery_payload_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 font-mono text-xs">
            {parsedPayload && typeof parsedPayload === 'object' ? (
              <div className="space-y-3">
                {parsedPayload.result && (
                  <div className="p-3 rounded-md bg-secondary/50 border border-border">
                    <span className="text-muted-foreground block mb-1 uppercase text-[10px] tracking-wider font-bold">
                      {t('result_summary')}
                    </span>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {typeof parsedPayload.result === 'string'
                        ? parsedPayload.result
                        : JSON.stringify(parsedPayload.result, null, 2)}
                    </p>
                  </div>
                )}

                {parsedPayload.result?.extracted_metrics && (
                  <div className="p-3 rounded-md bg-secondary/50 border border-border">
                    <span className="text-muted-foreground block mb-1 uppercase text-[10px] tracking-wider font-bold">
                      {t('execution_telemetry')}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(parsedPayload.result.extracted_metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-border/50 py-1">
                          <span className="text-muted-foreground">{k}:</span>
                          <span className="text-foreground font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-md bg-secondary/20 border border-border">
                  <span className="text-muted-foreground block mb-1 uppercase text-[10px] tracking-wider font-bold">
                    {t('raw_verification_json')}
                  </span>
                  <pre className="text-[11px] overflow-x-auto text-muted-foreground">
                    {JSON.stringify(parsedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <pre className="p-3 rounded-md bg-secondary/50 border border-border overflow-x-auto text-foreground">
                {tender.deliveryPayload || 'No payload'}
              </pre>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono border-border rounded-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
