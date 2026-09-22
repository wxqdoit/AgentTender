'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Filter, Pause, Play, Sparkles } from 'lucide-react';
import { MachineLog } from '../types';
import { useLanguage } from '../lib/i18n';
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

interface MachineLogsTerminalProps {
  logs: MachineLog[];
}

export function MachineLogsTerminal({ logs }: MachineLogsTerminalProps) {
  const { t, localizeLogMessage } = useLanguage();
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const filteredLogs = logs.filter((log) => {
    if (filterAgent === 'all') return true;
    return log.agentId === filterAgent;
  });

  const getActionColor = (action: MachineLog['action']) => {
    switch (action) {
      case 'DETECT':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'EVALUATE':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'BID':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'WIN':
        return 'text-primary bg-primary/10 border-primary/30';
      case 'DELIVER':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'SETTLE':
        return 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30';
      case 'ERROR':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-muted-foreground bg-secondary border-border';
    }
  };

  return (
    <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="py-3 px-4 sm:px-5 border-b border-border flex flex-row items-center justify-between space-y-0 bg-card">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <CardTitle className="text-xs font-mono font-bold tracking-wider uppercase text-foreground">
            {t('logs_title')}
          </CardTitle>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Filter controls with shadcn Select */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="h-7 text-[11px] font-mono border-border bg-background px-2.5 min-w-[125px]">
              <SelectValue placeholder={t('filter_all')} />
            </SelectTrigger>
            <SelectContent align="end" className="font-mono text-xs border-border bg-popover">
              <SelectItem value="all">{t('filter_all')}</SelectItem>
              <SelectItem value="agent-alpha">Agent-Alpha</SelectItem>
              <SelectItem value="agent-beta">Agent-Beta</SelectItem>
              <SelectItem value="agent-gamma">Agent-Gamma</SelectItem>
              <SelectItem value="agent-delta">Agent-Delta</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAutoScroll(!autoScroll)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground border border-border"
            title={t('auto_scroll')}
          >
            {autoScroll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="h-[480px] lg:h-[580px] overflow-y-auto bg-background border border-border rounded-md p-3 font-mono text-[11px] flex flex-col gap-1.5 leading-relaxed">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground italic py-12 text-center">
              {t('waiting_logs')}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, idx) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <motion.div
                    key={log.id}
                    initial={idx < 4 ? { opacity: 0, y: -4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2 hover:bg-secondary/40 p-1.5 rounded transition-colors border-b border-border/40 last:border-0"
                  >
                    {/* Left block: Agent name, badge & time underneath */}
                    <div className="flex flex-col items-start gap-0.5 shrink-0 min-w-[96px]">
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-1 rounded border text-[9px] font-bold uppercase shrink-0 leading-tight ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-primary font-semibold text-[11px] truncate max-w-[70px]" title={log.agentName}>
                          {log.agentName}
                        </span>
                      </div>
                      <span className="text-muted-foreground select-none text-[9px] tabular-nums pl-0.5">
                        {timeStr}
                      </span>
                    </div>

                    {/* Right block: log message */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-foreground text-[11px] leading-relaxed break-words">
                        {localizeLogMessage(log.message)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
