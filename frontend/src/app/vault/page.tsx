'use client';

import React, { useState, useEffect } from 'react';
import {
  Vault,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Bot,
  Zap,
  Lock,
} from 'lucide-react';
import { CONFIG } from '../../config';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import {
  fetchUserStake,
  depositStakeOnChain,
  withdrawStakeOnChain,
} from '../../lib/web3';
import { toast } from 'sonner';
import { formatWeb3Error } from '../../lib/error';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { AgentProfile } from '../../types';
import { formatUSDC } from '../../lib/utils';

export default function StakeVaultPage() {
  const { t, language } = useLanguage();
  const { activeAddress, isConnected, userBalance, refreshBalance, openReownModal } = useWallet();

  const [userStake, setUserStake] = useState(0);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [blockNumber, setBlockNumber] = useState<number | string>('');

  const [depositAmount, setDepositAmount] = useState('0.01');
  const [withdrawAmount, setWithdrawAmount] = useState('0.005');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const refreshStake = async () => {
    if (activeAddress) {
      try {
        const stk = await fetchUserStake(activeAddress);
        setUserStake(stk);
      } catch (e) {
        console.warn('Stake fetch error:', e);
      }
    } else {
      setUserStake(0);
    }
  };

  useEffect(() => {
    refreshStake();
    const fetchVaultData = async () => {
      try {
        const [aRes, hRes] = await Promise.all([
          fetch(`${CONFIG.BACKEND_URL}/api/agents`).then((r) => r.json()),
          fetch(`${CONFIG.BACKEND_URL}/api/health`).then((r) => r.json()),
        ]);
        if (aRes.success) setAgents(aRes.data);
        if (hRes.status === 'OK') setBlockNumber(hRes.blockNumber);
      } catch (e) {
        console.warn('Error fetching vault data:', e);
      }
    };
    fetchVaultData();
    const interval = setInterval(fetchVaultData, 4000);
    return () => clearInterval(interval);
  }, [activeAddress]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      openReownModal();
      return;
    }
    const val = parseFloat(depositAmount);
    if (!val || val < 0.001) {
      toast.warning(t('vault_min_stake_warn'));
      return;
    }

    const toastId = toast.loading(t('vault_deposit_loading'));
    try {
      setIsDepositing(true);
      await depositStakeOnChain(val);
      toast.success(`${t('vault_deposit_success')} (+${val} USDC)`, { id: toastId });
      await Promise.all([refreshBalance(), refreshStake()]);
    } catch (err: any) {
      toast.error(`${t('vault_deposit_fail')}: ${formatWeb3Error(err, language)}`, { id: toastId });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      openReownModal();
      return;
    }
    const val = parseFloat(withdrawAmount);
    if (!val || val < 0.001 || val > userStake) {
      toast.warning(t('vault_invalid_withdraw_warn'));
      return;
    }

    const toastId = toast.loading(t('vault_withdraw_loading'));
    try {
      setIsWithdrawing(true);
      await withdrawStakeOnChain(val);
      toast.success(`${t('vault_withdraw_success')} (-${val} USDC)`, { id: toastId });
      await Promise.all([refreshBalance(), refreshStake()]);
    } catch (err: any) {
      toast.error(`${t('vault_withdraw_fail')}: ${formatWeb3Error(err, language)}`, { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const totalAgentStake = agents.reduce((acc, a) => acc + (a.stakeUSDC || 0), 0);

  return (
    <div className="flex-1 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Vault className="w-6 h-6 text-primary shrink-0" />
            <span>{t('vault_title')}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('vault_desc')}
          </p>
        </div>

        {/* Global Vault Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border bg-card shadow-sm rounded-lg p-5">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              {t('user_stake')}
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums my-1.5 flex items-baseline gap-1.5">
              <span>{formatUSDC(userStake)}</span>
              <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t('stake_secured')}
            </span>
          </Card>

          <Card className="border border-border bg-card shadow-sm rounded-lg p-5">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              {t('total_staked_pool')}
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums my-1.5 flex items-baseline gap-1.5">
              <span>{formatUSDC(totalAgentStake + userStake)}</span>
              <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <span className="text-[10px] text-primary font-semibold">
              Arc L1 StakeVault (0xfcAF...0EcF)
            </span>
          </Card>

          <Card className="border border-border bg-card shadow-sm rounded-lg p-5">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              {t('min_qualification')}
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums my-1.5 flex items-baseline gap-1.5">
              <span>0.010</span>
              <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {t('slashing_rule_title')}
            </span>
          </Card>
        </div>

        {/* Slashing Invariant Warning */}
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{t('slashing_rule_title')}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
            {t('slashing_rule_desc')}
          </p>
        </div>

        {/* Deposit & Withdraw Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deposit Stake */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-border bg-card">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                  <span className="text-foreground">{t('deposit_stake_title')}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-border bg-secondary/50 font-normal">
                  {t('balance')}: {formatUSDC(userBalance)} USDC
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">
                    {t('stake_amount_label')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={userBalance}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="font-mono text-xs bg-background border-border rounded-md h-10 px-3"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(userBalance > 0 ? userBalance.toFixed(3) : '0.01')}
                      className="text-xs font-mono border-border shrink-0 h-10 px-4"
                    >
                      {t('max_btn')}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isDepositing || userBalance < 0.001 || parseFloat(depositAmount) < 0.001}
                  className="w-full h-10 text-xs font-medium rounded-md"
                >
                  {isDepositing ? t('broadcasting') : !isConnected ? t('wallet_connect') : t('deposit_btn')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdraw Stake */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-border bg-card">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4 text-amber-500" />
                  <span className="text-foreground">{t('vault_withdraw_title')}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-border bg-secondary/50 font-normal">
                  {t('staked')}: {formatUSDC(userStake)} USDC
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">
                    {t('vault_withdraw_amount')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={userStake}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="font-mono text-xs bg-background border-border rounded-md h-10 px-3"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(userStake > 0 ? userStake.toFixed(3) : '0')}
                      className="text-xs font-mono border-border shrink-0 h-10 px-4"
                    >
                      {t('max_btn')}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isWithdrawing || userStake <= 0 || parseFloat(withdrawAmount) > userStake || parseFloat(withdrawAmount) < 0.001}
                  className="w-full h-10 text-xs font-medium border border-border rounded-md"
                >
                  {isWithdrawing ? t('vault_withdrawing') : !isConnected ? t('wallet_connect') : t('withdraw_btn')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Agent Node Stakes */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-border bg-card">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Bot className="w-4 h-4 text-primary" />
              <span>{t('vault_agent_reserves')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {agents.map((agent) => (
                <div key={agent.id} className="py-3.5 px-6 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <span>{agent.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px] border-border bg-secondary/40">
                          {agent.address ? `${agent.address.slice(0, 6)}...${agent.address.slice(-4)}` : '---'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                        {agent.model}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatUSDC(agent.stakeUSDC)} USDC
                    </span>
                    <span className="block text-[10px] text-emerald-500 font-mono mt-0.5 uppercase tracking-wider font-semibold">
                      {t('vault_qualified_active')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
