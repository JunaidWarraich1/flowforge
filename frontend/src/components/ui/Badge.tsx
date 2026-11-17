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
          bg: 'bg-emerald-950/40',
          text: 'text-emerald-400',
          border: 'border-emerald-800/60',
          dot: 'bg-emerald-400',
        };
      case 'running':
        return {
          bg: 'bg-amber-950/40',
          text: 'text-amber-400',
          border: 'border-amber-800/60',
          dot: 'bg-amber-400',
        };
      case 'failed':
        return {
          bg: 'bg-rose-950/40',
          text: 'text-rose-400',
          border: 'border-rose-800/60',
          dot: 'bg-rose-400',
        };
      case 'archived':
      case 'condition':
        return {
          bg: 'bg-amber-950/40',
          text: 'text-amber-400',
          border: 'border-amber-800/60',
          dot: 'bg-amber-400',
        };
      case 'trigger':
        return {
          bg: 'bg-[#1f1d17]',
          text: 'text-primary',
          border: 'border-primary/40',
          dot: 'bg-primary',
        };
      case 'http_request':
        return {
          bg: 'bg-sky-950/40',
          text: 'text-sky-400',
          border: 'border-sky-800/60',
          dot: 'bg-sky-400',
        };
      case 'transform':
        return {
          bg: 'bg-[#1f1d17]',
          text: 'text-[#e5c07b]',
          border: 'border-[#e5c07b]/40',
          dot: 'bg-[#e5c07b]',
        };
      case 'code':
        return {
          bg: 'bg-emerald-950/40',
          text: 'text-emerald-400',
          border: 'border-emerald-800/60',
          dot: 'bg-emerald-400',
        };
      case 'log':
        return {
          bg: 'bg-rose-950/40',
          text: 'text-rose-400',
          border: 'border-rose-800/60',
          dot: 'bg-rose-400',
        };
      case 'draft':
      case 'pending':
      case 'delay':
      case 'cancelled':
      case 'skipped':
      default:
        return {
          bg: 'bg-[#141416]',
          text: 'text-zinc-400',
          border: 'border-[#2a2822]',
          dot: 'bg-zinc-500',
        };
    }
  };

  const style = getVariantStyles(variant);
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
      </span>
      <span>{children}</span>
    </span>
  );
};
