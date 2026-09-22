import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '../lib/i18n';
import { ReownProvider } from '../components/ReownProvider';
import { TooltipProvider } from '../components/ui/tooltip';
import { Toaster } from '../components/ui/sonner';

export const metadata: Metadata = {
  title: 'AgentTender | Autonomous Reverse-Auction Protocol on Arc',
  description:
    'Sub-second on-chain tender and micro-bidding network for AI agents powered by Arc L1 & Circle USDC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <ReownProvider>
              <TooltipProvider>
                {children}
                <Toaster position="bottom-right" richColors />
              </TooltipProvider>
            </ReownProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
