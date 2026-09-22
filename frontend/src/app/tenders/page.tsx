'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Layers, PlusCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { TenderData, TenderStatus } from '../../types';
import { CONFIG } from '../../config';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import { formatUSDC } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function TendersPage() {
  const { t, getStatusText } = useLanguage();
  const { activeAddress } = useWallet();

  const [tenders, setTenders] = useState<TenderData[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTender, setSelectedTender] = useState<TenderData | null>(null);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const [tRes, hRes] = await Promise.all([
          fetch(`${CONFIG.BACKEND_URL}/api/tenders`).then((r) => r.json()),
          fetch(`${CONFIG.BACKEND_URL}/api/health`).then((r) => r.json()),
        ]);
        if (tRes.success) setTenders(tRes.data);
        if (hRes.status === 'OK') setBlockNumber(hRes.blockNumber);
      } catch (e) {
        console.warn('Error fetching tenders:', e);
      }
    };
    fetchTenders();
    const interval = setInterval(fetchTenders, 3000);
    return () => clearInterval(interval);
  }, [activeAddress]);

  const filtered = tenders.filter((item) => {
    const matchesSearch =
      item.taskMetadataURI.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm);

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && item.status.toString() === statusFilter;
  });

  return (
    <div className="flex-1 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-primary shrink-0" />
              <span>{t('explorer_title')}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('explorer_subtitle')}
            </p>
          </div>

          <Link href="/create">
            <Button size="sm" className="h-9 px-3 text-xs font-mono gap-1.5 self-start sm:self-auto">
              <PlusCircle className="w-4 h-4" />
              <span>{t('create_tender_btn')}</span>
            </Button>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <Card className="border border-border bg-card shadow-sm p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search_placeholder')}
                className="pl-9 h-9 text-xs font-mono bg-background border-border rounded-md"
              />
            </div>

            <div className="w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[185px] h-9 text-xs font-mono bg-background border-border flex items-center gap-2 cursor-pointer">
                  <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder={t('all_status')} />
                </SelectTrigger>
                <SelectContent align="end" className="font-mono text-xs border-border bg-popover">
                  <SelectItem value="all">{t('all_status')}</SelectItem>
                  <SelectItem value={TenderStatus.OPEN.toString()}>{t('filter_open')}</SelectItem>
                  <SelectItem value={TenderStatus.AWARDED.toString()}>{t('filter_awarded')}</SelectItem>
                  <SelectItem value={TenderStatus.DELIVERED.toString()}>{t('filter_delivered')}</SelectItem>
                  <SelectItem value={TenderStatus.SETTLED.toString()}>{t('filter_settled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table Results */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16 font-mono text-xs font-bold text-foreground uppercase">{t('th_id')}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground uppercase">{t('th_task')}</TableHead>
                  <TableHead className="w-28 font-mono text-xs font-bold text-foreground uppercase">{t('th_budget')}</TableHead>
                  <TableHead className="w-32 font-mono text-xs font-bold text-foreground uppercase">{t('th_lowest')}</TableHead>
                  <TableHead className="w-36 font-mono text-xs font-bold text-foreground uppercase">{t('th_winner')}</TableHead>
                  <TableHead className="w-32 font-mono text-xs font-bold text-foreground uppercase">{t('th_status')}</TableHead>
                  <TableHead className="w-24 text-right font-mono text-xs font-bold text-foreground uppercase">{t('th_action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-mono">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {t('empty_bids')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tItem) => (
                    <TableRow key={tItem.id} className="border-border hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-bold text-primary">#{tItem.id}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium text-foreground">
                        {tItem.taskMetadataURI}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold text-foreground">
                        {formatUSDC(tItem.maxBudget)} USDC
                      </TableCell>
                      <TableCell className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {formatUSDC(tItem.currentLowestBid)} USDC
                      </TableCell>
                      <TableCell className="truncate text-muted-foreground">
                        {tItem.lowestBidderName || t('th_none')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono uppercase border-border ${
                            tItem.status === TenderStatus.SETTLED
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : tItem.status === TenderStatus.OPEN
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-secondary text-foreground'
                          }`}
                        >
                          {getStatusText(tItem.status, tItem.statusText)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTender(tItem)}
                          className="h-7 px-2.5 text-xs font-mono border border-transparent hover:border-border"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>{t('action_view')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* Details Dialog */}
      <Dialog open={!!selectedTender} onOpenChange={(open) => !open && setSelectedTender(null)}>
        <DialogContent className="sm:max-w-2xl w-full font-mono text-xs bg-card border-border rounded-xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <span>{t('select_tender')} #{selectedTender?.id}</span>
              <Badge variant="outline" className="text-[10px] border-border">
                {selectedTender && getStatusText(selectedTender.status, selectedTender.statusText)}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedTender?.taskMetadataURI}
            </DialogDescription>
          </DialogHeader>

          {selectedTender && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <div className="p-3 rounded-md bg-secondary/40 border border-border min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t('modal_budget')}</span>
                  <div className="font-bold text-sm text-foreground mt-0.5 tabular-nums truncate">
                    {formatUSDC(selectedTender.maxBudget)} USDC
                  </div>
                </div>
                <div className="p-3 rounded-md bg-secondary/40 border border-border min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t('modal_winning_bid')}</span>
                  <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums truncate">
                    {formatUSDC(selectedTender.currentLowestBid)} USDC
                  </div>
                </div>
                <div className="p-3 rounded-md bg-secondary/40 border border-border min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t('modal_winner_node')}</span>
                  <div className="font-bold text-sm text-foreground mt-0.5 truncate" title={selectedTender.lowestBidderName || t('th_none')}>
                    {selectedTender.lowestBidderName || t('th_none')}
                  </div>
                </div>
              </div>

              {selectedTender.deliveryPayload && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-foreground uppercase text-[10px] tracking-wider">
                    {t('modal_delivery_payload')}
                  </span>
                  <pre className="p-3 rounded-md bg-background border border-border text-[11px] overflow-x-auto max-h-48 leading-relaxed text-foreground">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedTender.deliveryPayload), null, 2);
                      } catch {
                        return selectedTender.deliveryPayload;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
