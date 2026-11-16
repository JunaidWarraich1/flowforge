import React from 'react';

export type BadgeVariant =
  | 'draft'
  | 'active'
  | 'archived'
  | 'running'
  | 'completed'
  | 'failed'
  | 'pending'
  | 'cancelled'
  | 'skipped'
  | 'trigger'
  | 'http_request'
  | 'transform'
  | 'condition'
  | 'delay'
  | 'code'
  | 'log'
  | 'default';

export interface BadgeProps {
  variant?: BadgeVariant | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  pulse = false,
  children,
  className = '',
}) => {
  const getVariantStyles = (v: string): { bg: string; text: string; border: string; dot: string } => {
    switch (v) {
      case 'active':
      case 'completed':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'running':
        return {
          bg: 'bg-violet-500/15',
          text: 'text-violet-300',
          border: 'border-violet-500/40',
          dot: 'bg-violet-400',
        };
      case 'failed':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          dot: 'bg-red-400',
        };
      case 'archived':
      case 'condition':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'trigger':
        return {
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          dot: 'bg-cyan-400',
        };
      case 'http_request':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'transform':
        return {
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'code':
        return {
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          border: 'border-teal-500/30',
          dot: 'bg-teal-400',
        };
      case 'log':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'draft':
      case 'pending':
      case 'delay':
      case 'cancelled':
      case 'skipped':
      default:
        return {
          bg: 'bg-slate-800/60',
          text: 'text-slate-400',
          border: 'border-slate-700/60',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getVariantStyles(variant);
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {(pulse || variant === 'running') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
      </span>
      <span className="capitalize">{children}</span>
    </span>
  );
};
