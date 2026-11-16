import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'primary' | 'accent' | 'emerald' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  glow = 'none',
  className = '',
  ...props
}) => {
  const glowClasses = {
    none: '',
    primary: 'hover:shadow-glow-primary hover:border-primary/50',
    accent: 'hover:shadow-glow-accent hover:border-accent/50',
    emerald: 'hover:shadow-glow-emerald hover:border-emerald-500/50',
  };

  return (
    <div
      className={`bg-[#111118]/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 transition-all duration-200 ${
        hoverEffect ? 'hover:border-slate-700 hover:-translate-y-0.5' : ''
      } ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
