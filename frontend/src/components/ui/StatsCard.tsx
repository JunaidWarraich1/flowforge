import React, { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export interface StatsCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'gold';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  icon: Icon,
  trend,
  color = 'gold',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 900; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(easeProgress * value);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  const colorStyles: Record<string, { bg: string; border: string; iconText: string }> = {
    gold: {
      bg: 'bg-[#1f1d17]',
      border: 'border-primary/40',
      iconText: 'text-primary',
    },
    violet: {
      bg: 'bg-[#1f1d17]',
      border: 'border-primary/40',
      iconText: 'text-primary',
    },
    cyan: {
      bg: 'bg-sky-950/40',
      border: 'border-sky-800/50',
      iconText: 'text-sky-400',
    },
    emerald: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/50',
      iconText: 'text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/50',
      iconText: 'text-amber-400',
    },
    blue: {
      bg: 'bg-sky-950/40',
      border: 'border-sky-800/50',
      iconText: 'text-sky-400',
    },
  };

  const scheme = colorStyles[color] || colorStyles.gold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-[#141416] border border-[#2a2822] hover:border-primary/50 rounded-lg p-5 transition-all duration-200 shadow-card-carbon"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center border ${scheme.bg} ${scheme.border} ${scheme.iconText}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline gap-2">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-mono">
          {prefix}
          {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}
          {suffix}
        </h4>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span
            className={trend.isPositive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}
          >
            {trend.value}
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">vs last period</span>
        </div>
      )}
    </motion.div>
  );
};
