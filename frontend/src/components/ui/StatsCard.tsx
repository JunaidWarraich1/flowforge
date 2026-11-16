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
  color?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  icon: Icon,
  trend,
  color = 'violet',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(easeProgress * value);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  const colorStyles = {
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      iconText: 'text-violet-400',
      glow: 'group-hover:border-violet-500/40 group-hover:shadow-glow-primary',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      iconText: 'text-cyan-400',
      glow: 'group-hover:border-cyan-500/40 group-hover:shadow-glow-accent',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconText: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/40 group-hover:shadow-glow-emerald',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconText: 'text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      iconText: 'text-blue-400',
      glow: 'group-hover:border-blue-500/40',
    },
  };

  const scheme = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-[#111118]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 transition-all duration-300 ${scheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${scheme.bg} ${scheme.border} ${scheme.iconText}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-mono">
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
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span
            className={trend.isPositive ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs last period</span>
        </div>
      )}
    </motion.div>
  );
};
