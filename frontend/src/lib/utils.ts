import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * High-precision formatter for Arc L1 micro-USDC figures
 * Supports down to 0.001 USDC step decrements without losing precision
 */
export function formatUSDC(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return '0.00';
  if (num >= 100) return num.toFixed(2);
  if (num >= 1) {
    const s = num.toFixed(3);
    return s.endsWith('0') ? num.toFixed(2) : s;
  }
  // Micro values < 1 USDC
  const s = num.toFixed(4);
  const trimmed = s.replace(/(\.\d*?[1-9])0+$/, '$1');
  return trimmed.length < 4 ? num.toFixed(2) : trimmed;
}
