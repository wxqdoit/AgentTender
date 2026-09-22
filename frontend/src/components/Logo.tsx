'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      {/* Precision Geometric Vector Monogram: 'A' + 'T' + Reverse-Auction Staircase */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative shrink-0"
      >
        <svg
          className={`${iconSizes[size]} shrink-0 transition-colors duration-200`}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flat Crisp Enclosure */}
          <rect
            x="1.5"
            y="1.5"
            width="33"
            height="33"
            rx="6"
            className="fill-secondary/60 stroke-border group-hover:stroke-primary/50 transition-colors"
            strokeWidth="1.5"
          />

          {/* Top Architectural Horizontal Crossbar ('T' Roof) */}
          <line
            x1="8"
            y1="9.5"
            x2="28"
            y2="9.5"
            className="stroke-foreground"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center Vertical Axis ('A' & 'T' spine) */}
          <line
            x1="18"
            y1="9.5"
            x2="18"
            y2="25"
            className="stroke-foreground"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Reverse-Auction Step 1 (Broad Market Entry) */}
          <line
            x1="10.5"
            y1="14.5"
            x2="25.5"
            y2="14.5"
            className="stroke-primary"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Reverse-Auction Step 2 (Price Undercutting Convergence) */}
          <line
            x1="13"
            y1="19"
            x2="23"
            y2="19"
            className="stroke-primary"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Reverse-Auction Step 3 (Lowest Clearing Floor) */}
          <line
            x1="15.5"
            y1="23.5"
            x2="20.5"
            y2="23.5"
            className="stroke-primary"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Sub-Second Deterministic Settlement Point */}
          <circle
            cx="18"
            cy="28"
            r="1.75"
            className="fill-primary"
          />
        </svg>
      </motion.div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5 font-mono tracking-tight font-bold">
            <span className={`text-foreground font-extrabold ${textSizes[size]}`}>AGENT</span>
            <span className={`text-primary font-black ${textSizes[size]}`}>TENDER</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider hidden sm:inline-block">
              ARC
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5 hidden sm:block">
            Reverse-Auction
          </span>
        </div>
      )}
    </div>
  );
}
