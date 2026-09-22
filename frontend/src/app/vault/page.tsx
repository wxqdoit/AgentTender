'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { Header } from '../../components/Header';
import { CONFIG } from '../../config';
import { useLanguage } from '../../lib/i18n';
import { useWallet } from '../../components/ReownProvider';
import {
  fetchUSDCBalance,
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
  const { t } = useLanguage();
  const { activeAddress, isConnected, openReownModal } = useWallet();

  const [userBalance, setUserBalance] = useState(0);
  const [userStake, setUserStake] = useState(0);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [blockNumber, setBlockNumber] = useState<number | string>('');

  const [depositAmount, setDepositAmount] = useState('0.01');
  const [withdrawAmount, setWithdrawAmount] = useState('0.005');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const refreshState = async () => {
    if (activeAddress) {
      const [bal, stk] = await Promise.all([
        fetchUSDCBalance(activeAddress),
        fetchUserStake(activeAddress),
      ]);
      setUserBalance(bal);
      setUserStake(stk);
    } else {
      setUserBalance(0);
      setUserStake(0);
    }
  };

  useEffect(() => {
    refreshState();
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
      toast.warning('最低质押金额不能小于 0.001 USDC');
      return;
    }

    const toastId = toast.loading('正在向 Arc L1 存入质押保证金...');
    try {
      setIsDepositing(true);
      await depositStakeOnChain(val);
      toast.success(`成功质押 ${val} USDC 到 StakeVault！`, { id: toastId });
      await refreshState();
    } catch (err: any) {
      toast.error(`存入保证金失败: ${formatWeb3Error(err)}`, { id: toastId });
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
      toast.warning('提现金额不合法或超出当前已质押额度');
      return;
    }

    const toastId = toast.loading('正在从 Arc L1 提取质押保证金...');
    try {
      setIsWithdrawing(true);
      await withdrawStakeOnChain(val);
      toast.success(`成功提取 ${val} USDC 质押金！`, { id: toastId });
      await refreshState();
    } catch (err: any) {
      toast.error(`提取保证金失败: ${formatWeb3Error(err)}`, { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const totalAgentStake = agents.reduce((acc, a) => acc + (a.stakeUSDC || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono">
      <Header
        blockNumber={blockNumber}
        userBalance={userBalance}
        onRefreshBalance={refreshState}
      />

      <motion.main
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Vault className="w-6 h-6 text-primary shrink-0" />
            <span>{t('vault_title')}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('vault_desc')}
          </p>
        </div>

        {/* Global Vault Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border bg-card shadow-sm p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">
              Total Swarm Stake
            </span>
            <div className="my-2 text-2xl font-bold text-foreground tabular-nums">
              {formatUSDC(totalAgentStake)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
              <Lock className="w-3 h-3" />
              <span>Locked in AgentTender.sol</span>
            </div>
          </Card>

          <Card className="border border-border bg-card shadow-sm p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">
              Your Deposited Stake
            </span>
            <div className="my-2 text-2xl font-bold text-primary tabular-nums">
              {formatUSDC(userStake)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{userStake >= 0.01 ? 'Qualified as Agent Bidder' : 'Stake >= 0.01 USDC to Bid'}</span>
            </div>
          </Card>

          <Card className="border border-border bg-card shadow-sm p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground uppercase font-bold">
              Wallet Available Balance
            </span>
            <div className="my-2 text-2xl font-bold text-foreground tabular-nums">
              {formatUSDC(userBalance)} <span className="text-xs font-normal text-muted-foreground">USDC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Coins className="w-3 h-3 text-primary" />
              <span>Official Arc Native USDC</span>
            </div>
          </Card>
        </div>

        {/* Slashing & Security Invariant */}
        <Card className="border border-border bg-card p-5 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Anti-Griefing &amp; Defaulter Slashing Invariant</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The StakeVault requires participating nodes to maintain a minimum stake (0.01 USDC). If a winning node fails to submit execution proof before the deadline, the contract slashes their stake and transfers it directly to the tender creator as compensation.
          </p>
        </Card>

        {/* Deposit & Withdraw Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Deposit Stake */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-border bg-card">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                  <span className="text-foreground">Deposit Agent Stake</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-border bg-secondary/50 font-normal">
                  Min: 0.001 USDC
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Deposit Amount (USDC)
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
                      MAX
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isDepositing || userBalance < 0.001 || parseFloat(depositAmount) < 0.001}
                  className="w-full h-10 text-xs font-medium rounded-md"
                >
                  {isDepositing ? 'Depositing on Arc L1...' : !isConnected ? t('wallet_connect') : 'Deposit Stake'}
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
                  <span className="text-foreground">Withdraw Stake</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-border bg-secondary/50 font-normal">
                  Staked: {formatUSDC(userStake)} USDC
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Withdraw Amount (USDC)
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
                      MAX
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isWithdrawing || userStake <= 0 || parseFloat(withdrawAmount) > userStake || parseFloat(withdrawAmount) < 0.001}
                  className="w-full h-10 text-xs font-medium border border-border rounded-md"
                >
                  {isWithdrawing ? 'Withdrawing...' : !isConnected ? t('wallet_connect') : 'Withdraw Stake'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="p-3.5 rounded-lg border border-border bg-secondary/60 text-xs font-mono text-primary flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Agent Node Stakes */}
        <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-border bg-card">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Bot className="w-4 h-4 text-primary" />
              <span>Agent Node Staked Reserves</span>
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
                      QUALIFIED / ACTIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
}
