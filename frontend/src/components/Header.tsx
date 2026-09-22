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
  userBalance: number;
  onRefreshBalance: () => void;
}

export function Header({
  blockNumber,
  userBalance,
  onRefreshBalance,
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    activeAddress,
    isConnected,
    openReownModal,
    disconnectReown,
  } = useWallet();

  const handleFaucet = () => {
    window.open('https://faucet.testnet.arc.network', '_blank');
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
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute inset-0 rounded-md bg-secondary border border-border"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
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

        {/* Center: Live Arc Network Telemetry */}
        <div className="hidden 2xl:flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
          <Badge variant="outline" className="gap-1.5 py-0.5 px-2.5 bg-secondary/50 font-mono border-border whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-foreground">{t('network_arc')}</span>
            <span className="text-muted-foreground">#{blockNumber || '---'}</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-0.5 px-2.5 bg-secondary/50 font-mono border-border whitespace-nowrap shrink-0">
            <Coins className="w-3 h-3 text-primary shrink-0" />
            <span>{t('gas_native')}</span>
          </Badge>
        </div>

        {/* Right: Controls & Wallet */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Faucet Link */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleFaucet}
            className="h-8 px-2 sm:px-2.5 text-xs font-mono border-border hover:border-primary/50 text-foreground bg-secondary/40 hover:bg-secondary whitespace-nowrap shrink-0"
          >
            <Droplets className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
            <span>{t('faucet_btn')}</span>
          </Button>

          {/* User USDC Balance */}
          {isConnected && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden sm:flex items-center h-8 px-2.5 rounded-md bg-secondary text-xs font-mono border border-border whitespace-nowrap shrink-0"
            >
              <span className="text-muted-foreground mr-1.5">USDC:</span>
              <span className="font-bold text-foreground tabular-nums">{formatUSDC(userBalance)}</span>
            </motion.div>
          )}

          {/* Reown AppKit Wallet Button */}
          {isConnected ? (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={openReownModal}
                className="h-8 px-2.5 text-xs font-mono border-border text-foreground hover:border-primary/50 bg-secondary/30 shrink-0"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                <span>{shortAddr}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={disconnectReown}
                title={t('wallet_disconnect')}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
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
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                System
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
