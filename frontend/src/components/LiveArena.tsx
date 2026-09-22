'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  Clock,
  Award,
  Layers,
  PlusCircle,
  CheckCircle2,
  Zap,
  ArrowDownRight,
  Radio,
} from 'lucide-react';
import { TenderData, TenderStatus } from '../types';
import { useLanguage } from '../lib/i18n';
import { formatUSDC } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface LiveArenaProps {
  tender: TenderData | null;
  tendersList: TenderData[];
  onSelectTender: (id: number) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border p-2.5 rounded-md shadow-md text-xs font-mono space-y-1 z-50">
        <div className="flex items-center justify-between gap-3 text-muted-foreground text-[10px] pb-1 border-b border-border">
          <span>Step {data.step}: {data.label}</span>
          <span className="font-bold text-foreground">{data.bidder}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatUSDC(data.price)} USDC
          </span>
        </div>
        {data.savings && (
          <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground">
            <span>Saved:</span>
            <span className="text-emerald-500 font-semibold">{data.savings}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function LiveArena({ tender, tendersList, onSelectTender }: LiveArenaProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalWindow, setTotalWindow] = useState<number>(35);

  useEffect(() => {
    if (!tender) return;

    const nowSec = Math.floor(Date.now() / 1000);
    if (tender.status === TenderStatus.OPEN) {
      const remaining = Math.max(0, tender.biddingDeadline - nowSec);
      setTimeLeft(remaining);
      setTotalWindow(Math.max(remaining, 35));
    } else if (tender.status === TenderStatus.DELIVERED) {
      const remaining = Math.max(0, tender.challengePeriodEnd - nowSec);
      setTimeLeft(remaining);
      setTotalWindow(15);
    } else {
      setTimeLeft(0);
    }

    const interval = setInterval(() => {
      const curr = Math.floor(Date.now() / 1000);
      if (tender.status === TenderStatus.OPEN) {
        setTimeLeft(Math.max(0, tender.biddingDeadline - curr));
      } else if (tender.status === TenderStatus.DELIVERED) {
        setTimeLeft(Math.max(0, tender.challengePeriodEnd - curr));
      } else {
        setTimeLeft(0);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [tender]);

  // Recharts Staircase Trajectory Data
  const chartData = useMemo(() => {
    if (!tender) return [];
    const points = [
      {
        step: 0,
        label: 'Budget',
        price: tender.maxBudget,
        bidder: 'Creator Escrow',
        savings: '0%',
      },
    ];

    tender.bids.forEach((bid, idx) => {
      const savedAmount = tender.maxBudget - bid.bidAmount;
      const savedPct = tender.maxBudget > 0 ? ((savedAmount / tender.maxBudget) * 100).toFixed(1) + '%' : '0%';
      points.push({
        step: idx + 1,
        label: `Bid #${idx + 1}`,
        price: bid.bidAmount,
        bidder: bid.bidderName,
        savings: savedPct,
      });
    });

    return points;
  }, [tender]);

  if (!tender) {
    return (
      <Card className="border border-border bg-card shadow-sm p-8 text-center flex flex-col items-center justify-center gap-3 min-h-[340px]">
        <Layers className="w-8 h-8 text-muted-foreground animate-pulse" />
        <h3 className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
          {t('empty_tender_title')}
        </h3>
        <p className="font-mono text-xs text-muted-foreground max-w-sm">
          {t('empty_tender_desc')}
        </p>
        <Link href="/create">
          <Button size="sm" className="font-mono text-xs gap-1.5 mt-2">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('create_tender_btn')}</span>
          </Button>
        </Link>
      </Card>
    );
  }

  const savings = Math.max(0, tender.maxBudget - tender.currentLowestBid);
  const savingsPercent =
    tender.maxBudget > 0 ? ((savings / tender.maxBudget) * 100).toFixed(1) : '0';

  const isBidding = tender.status === TenderStatus.OPEN;
  const isDelivered = tender.status === TenderStatus.DELIVERED;
  const isSettled = tender.status === TenderStatus.SETTLED;

  const progressRatio = isSettled
    ? 100
    : totalWindow > 0
    ? Math.min(100, Math.max(0, (timeLeft / totalWindow) * 100))
    : 0;

  return (
    <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
      {/* Header Bar */}
      <CardHeader className="py-3 px-4 sm:px-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 space-y-0 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            key={tender.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-7 h-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary text-xs shrink-0"
          >
            #{tender.id}
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="font-mono font-bold text-xs tracking-wider text-foreground uppercase whitespace-nowrap">
                {t('arena_title')}
              </CardTitle>
              <Badge
                variant={isSettled ? 'outline' : isBidding ? 'default' : 'secondary'}
                className={`font-mono text-[10px] uppercase font-bold py-0 h-5 whitespace-nowrap border-border ${
                  isBidding
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : isSettled
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {isBidding && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping inline-block" />}
                {tender.statusText}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-md sm:max-w-lg mt-0.5" title={tender.taskMetadataURI}>
              {tender.taskMetadataURI}
            </p>
          </div>
        </div>

        {/* shadcn Select Dropdown & Quick New Tender Link */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <Select
            value={String(tender.id)}
            onValueChange={(val) => onSelectTender(Number(val))}
          >
            <SelectTrigger className="h-7 text-xs font-mono border-border bg-background px-2.5 min-w-[140px] max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="font-mono text-xs border-border bg-popover max-h-56">
              {tendersList.map((tItem) => (
                <SelectItem key={tItem.id} value={String(tItem.id)}>
                  #{tItem.id} ({formatUSDC(tItem.currentLowestBid)} USDC)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/create">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs font-mono border-border bg-secondary/50 hover:bg-secondary shrink-0"
              title={t('create_tender_btn')}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1 text-primary" />
              <span>{t('nav_create')}</span>
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Core Pricing & Reverse Bidding Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          {/* 1. Current Lowest Bid */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {t('lowest_bid')}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                -{savingsPercent}%
              </span>
            </div>
            <div className="my-1.5">
              <motion.div
                key={tender.currentLowestBid}
                initial={{ scale: 1.1, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="text-2xl font-black text-foreground tabular-nums tracking-tight"
              >
                {formatUSDC(tender.currentLowestBid)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
              </motion.div>
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {t('initial_budget')}: {formatUSDC(tender.maxBudget)} USDC ({t('saved_ratio')}: {formatUSDC(savings)} USDC)
            </div>
          </div>

          {/* 2. Leading Winner Node */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {t('leader')}
              </span>
              <Award className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="my-1.5">
              <motion.span
                key={tender.lowestBidderName}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base font-bold text-primary truncate block"
              >
                {tender.lowestBidderName || 'None'}
              </motion.span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground truncate">
              {tender.lowestBidder && tender.lowestBidder !== '0x0000000000000000000000000000000000000000'
                ? `${tender.lowestBidder.slice(0, 8)}...${tender.lowestBidder.slice(-6)}`
                : 'Awaiting Bids...'}
            </div>
          </div>

          {/* 3. Phase Countdown Clock */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {isSettled ? t('finalized') : isDelivered ? t('challenge_countdown') : t('bidding_countdown')}
              </span>
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <motion.span
                key={Math.floor(timeLeft)}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-black text-foreground tabular-nums"
              >
                {isSettled ? '0.0' : timeLeft.toFixed(1)}
              </motion.span>
              <span className="text-xs text-muted-foreground">seconds</span>
            </div>
            {/* Flat Progress Indicator */}
            <div className="w-full bg-background border border-border h-1.5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  isSettled ? 'bg-emerald-500' : isBidding ? 'bg-primary' : 'bg-blue-500'
                }`}
                animate={{ width: `${progressRatio}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Recharts Price Cliff Step Trajectory Chart */}
        <div className="p-3.5 rounded-md bg-secondary/30 border border-border flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-foreground flex items-center gap-1.5 whitespace-nowrap">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('price_trajectory')} (Recharts Step Graph)</span>
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              {formatUSDC(tender.maxBudget)} &rarr; {formatUSDC(tender.currentLowestBid)} USDC ({chartData.length - 1} steps)
            </span>
          </div>

          <div className="w-full h-44 bg-background border border-border rounded-md p-2 flex items-center justify-center">
            {chartData.length <= 1 && tender.bids.length === 0 ? (
              <div className="w-full text-center text-xs font-mono text-muted-foreground py-6">
                {t('empty_bids')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(val) => `${val}`}
                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine
                    y={tender.currentLowestBid}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{
                      value: `Floor: ${formatUSDC(tender.currentLowestBid)}`,
                      fill: '#10B981',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      position: 'top',
                    }}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="price"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="rgba(16, 185, 129, 0.06)"
                    isAnimationActive={true}
                    animationDuration={600}
                    dot={{
                      r: 3.5,
                      fill: 'hsl(var(--card))',
                      stroke: '#10B981',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5.5,
                      fill: '#10B981',
                      stroke: 'hsl(var(--card))',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bidding Log Timeline with Framer Motion AnimatePresence */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            <span>{t('bids_timeline')}:</span>
            <span className="text-[10px] text-muted-foreground lowercase font-normal">
              {tender.bids.length} entries
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {tender.bids.length === 0 ? (
              <div className="text-xs font-mono text-muted-foreground py-3 text-center bg-secondary/20 rounded border border-border/50">
                {t('empty_bids')}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {tender.bids.map((bid, idx) => (
                  <motion.div
                    key={`${bid.bidder}_${bid.bidAmount}_${idx}`}
                    initial={{ opacity: 0, x: -12, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-xs font-mono hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground font-bold shrink-0">#{idx + 1}</span>
                      <span className="font-bold text-foreground truncate">{bid.bidderName}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline shrink-0">
                        ({bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {bid.marginPercent && (
                        <span className="text-[10px] text-muted-foreground">
                          +{bid.marginPercent}%
                        </span>
                      )}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        {formatUSDC(bid.bidAmount)} USDC
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
