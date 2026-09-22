'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  Bot,
  PlusCircle,
  Vault,
  FileText,
  Droplets,
  Wallet,
  Sun,
  Moon,
  Languages,
  Check,
  Coins,
  LogOut,
  Menu,
  ChevronDown,
  Copy,
  ExternalLink,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '../lib/i18n';
import { useWallet } from './ReownProvider';
import { formatUSDC } from '../lib/utils';
import { CONFIG } from '../config';
import { Logo } from './Logo';
import { UsdcLogo } from './UsdcLogo';
import Counter from './Counter';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface HeaderProps {
  blockNumber?: number | string;
}

export function Header({ blockNumber: propBlockNumber }: HeaderProps = {}) {
  const pathname = usePathname();
  const [internalBlockNumber, setInternalBlockNumber] = useState<string | number>('');

  React.useEffect(() => {
    if (propBlockNumber) return;
    let isMounted = true;
    const fetchBlock = async () => {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/health`);
        const data = await res.json();
        if (isMounted && data?.blockNumber) {
          setInternalBlockNumber(data.blockNumber);
        }
      } catch {}
    };
    fetchBlock();
    const timer = setInterval(fetchBlock, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [propBlockNumber]);

  const blockNumber = propBlockNumber || internalBlockNumber;
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const {
    activeAddress,
    isConnected,
    userBalance,
    refreshBalance,
    openReownModal,
    disconnectReown,
  } = useWallet();

  const handleFaucet = () => {
    window.open('https://faucet.testnet.arc.network', '_blank');
  };

  const handleCopyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleOpenExplorer = () => {
    if (activeAddress) {
      window.open(`https://testnet.arcscan.app/address/${activeAddress}`, '_blank');
    }
  };

  const navItems = [
    { href: '/', label: t('nav_dashboard'), icon: Activity },
    { href: '/create', label: t('nav_create'), icon: PlusCircle },
    { href: '/tenders', label: t('nav_tenders'), icon: Layers },
    { href: '/agents', label: t('nav_agents'), icon: Bot },
    { href: '/vault', label: t('nav_vault'), icon: Vault },
    { href: '/docs', label: t('nav_docs'), icon: FileText },
  ];

  const shortAddr = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="w-full flex h-14 items-center justify-between px-3 sm:px-6">
        {/* Left: Brand + Navigation */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link href="/" className="shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-md bg-secondary border border-border" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Consolidated Account Dropdown & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            /* Consolidated Web3 Account Dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs font-mono border-border text-foreground hover:border-primary/50 bg-secondary/30 shrink-0 gap-2 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-semibold">{shortAddr}</span>
                  <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-border/80 text-muted-foreground">
                    <UsdcLogo className="w-3.5 h-3.5" />
                    <span className="text-foreground font-bold tabular-nums">{formatUSDC(userBalance)}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70 ml-0.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72 font-mono text-xs border border-border bg-popover p-2 space-y-2 shadow-lg">
                {/* Account & Balance Section */}
                <div className="p-2.5 rounded-md bg-secondary/40 border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t('balance')}</span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshBalance();
                      }}
                      className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                      title={t('refresh_balance')}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>{t('refresh_balance')}</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="text-lg font-bold text-foreground tabular-nums flex items-baseline gap-0.5">
                      <Counter
                        value={userBalance}
                        fontSize={18}
                        fontWeight={700}
                        gap={1}
                        horizontalPadding={0}
                        textColor="currentColor"
                        places={userBalance >= 10 ? [10, 1, '.', 0.1, 0.01, 0.001, 0.0001] : [1, '.', 0.1, 0.01, 0.001, 0.0001]}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-secondary/60 text-xs font-semibold text-foreground shadow-xs">
                      <UsdcLogo className="w-3.5 h-3.5" />
                      <span>USDC</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[170px]" title={activeAddress}>
                      {shortAddr}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleCopyAddress}
                      className="h-4 px-1 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                    >
                      {addressCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-emerald-500">{t('address_copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>{t('copy')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Network & Gas Details */}
                <div className="px-2 py-1 space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('network_label')}:</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('network_arc')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('gas_label')}:</span>
                    <span className="text-foreground font-semibold">{t('gas_val')}</span>
                  </div>
                  {blockNumber && (
                    <div className="flex items-center justify-between">
                      <span>{t('block')}:</span>
                      <span className="text-foreground tabular-nums">#{blockNumber}</span>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Action Items */}
                <DropdownMenuItem
                  onClick={handleFaucet}
                  className="cursor-pointer text-xs flex items-center justify-between hover:bg-secondary/80 focus:bg-secondary/80 py-1.5 px-2"
                >
                  <span className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-primary" />
                    <span>{t('faucet_link')}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleOpenExplorer}
                  className="cursor-pointer text-xs flex items-center justify-between hover:bg-secondary/80 focus:bg-secondary/80 py-1.5 px-2"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{t('view_explorer')}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setTimeout(() => {
                      openReownModal('Account');
                    }, 60);
                  }}
                  onClick={() => {
                    setTimeout(() => {
                      openReownModal('Account');
                    }, 60);
                  }}
                  className="cursor-pointer text-xs flex items-center justify-between hover:bg-secondary/80 focus:bg-secondary/80 py-1.5 px-2"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{t('manage_wallet')}</span>
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={disconnectReown}
                  className="cursor-pointer text-xs text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 py-1.5 px-2 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('wallet_disconnect')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Connect Wallet Button */
            <Button
              size="sm"
              onClick={() => openReownModal('Connect')}
              className="h-8 px-3 text-xs font-mono font-medium gap-1.5 shrink-0"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{t('wallet_connect')}</span>
            </Button>
          )}

          {/* Language Toggle Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border shrink-0"
                title={language === 'zh' ? '多语言' : 'Language'}
              >
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono text-xs border-border bg-popover">
              <DropdownMenuItem
                onClick={() => setLanguage('zh')}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>简体中文</span>
                {language === 'zh' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border shrink-0"
            title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Mobile Hamburger Menu */}
          <div className="xl:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border shrink-0"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4 font-mono bg-background border-border">
                <SheetHeader className="text-left mb-4">
                  <SheetTitle className="text-sm font-bold text-foreground">
                    <Logo size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-secondary text-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
