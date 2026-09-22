'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { Logo } from './Logo';
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
  userBalance?: number;
  onRefreshBalance?: () => void;
}

export function Header({
  blockNumber,
  userBalance: propUserBalance,
  onRefreshBalance: propOnRefreshBalance,
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const {
    activeAddress,
    isConnected,
    userBalance: globalUserBalance,
    refreshBalance: globalRefreshBalance,
    openReownModal,
    disconnectReown,
  } = useWallet();

  const userBalance = propUserBalance !== undefined ? propUserBalance : globalUserBalance;
  const onRefreshBalance = propOnRefreshBalance || globalRefreshBalance;

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

          {/* Desktop Navigation Links with Framer Motion hover & active transitions */}
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
                  <div className="hidden sm:flex items-center gap-1 pl-1.5 border-l border-border/80 text-muted-foreground">
                    <span className="text-[10px]">USDC:</span>
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
                        onRefreshBalance();
                      }}
                      className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                      title={t('refresh_balance')}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>{t('refresh_balance')}</span>
                    </Button>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black text-foreground tabular-nums">
                      {formatUSDC(userBalance)}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      USDC
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[180px] font-mono select-all">
                      {activeAddress}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="hover:text-foreground text-primary flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {addressCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{addressCopied ? t('address_copied') : t('copy')}</span>
                    </button>
                  </div>
                </div>

                {/* Network & Gas Details */}
                <div className="px-2 py-1 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('network_label')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {t('network_arc')} {blockNumber ? `#${blockNumber}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-primary" />
                      {t('gas_label')}
                    </span>
                    <span className="font-semibold text-foreground">{t('gas_val')}</span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Action Links */}
                <DropdownMenuItem
                  onClick={handleFaucet}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Droplets className="w-3.5 h-3.5 text-primary" />
                  <span className="flex-1">{t('faucet_link')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleOpenExplorer}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="flex-1">{t('view_explorer')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={openReownModal}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="flex-1">{t('manage_wallet')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Disconnect */}
                <DropdownMenuItem
                  onClick={disconnectReown}
                  className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="w-3.5 h-3.5 text-destructive" />
                  <span>{t('wallet_disconnect')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Connect Button */
            <Button
              size="sm"
              variant="default"
              onClick={openReownModal}
              className="h-8 px-3 text-xs font-mono whitespace-nowrap shrink-0"
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>{t('wallet_connect')}</span>
            </Button>
          )}

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-border">
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28 font-mono text-xs border border-border">
              <DropdownMenuItem
                onClick={() => setLanguage('zh')}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>中文</span>
                {language === 'zh' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-border">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28 font-mono text-xs border border-border">
              <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                {t('theme_light')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                {t('theme_dark')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                {t('theme_system')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile & Tablet Drawer Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="xl:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 border border-border">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 font-mono bg-card border-r border-border flex flex-col justify-between">
              <div className="space-y-4">
                <SheetHeader className="pb-3 border-b border-border">
                  <SheetTitle className="text-left">
                    <Logo size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1.5 pt-2">
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
                            ? 'bg-secondary text-foreground font-bold border border-border'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-border pt-3 text-[10px] text-muted-foreground">
                Arc Testnet &bull; Chain 5042002
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
