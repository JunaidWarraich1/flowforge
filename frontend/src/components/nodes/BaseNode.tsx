import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { LucideIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { NodeExecutionStatus } from '../../types';

export interface BaseNodeProps {
  id: string;
  selected?: boolean;
  typeColor: string;
  icon: LucideIcon;
  typeName: string;
  label: string;
  subtitle?: string;
  status?: NodeExecutionStatus;
  showInputHandle?: boolean;
  showOutputHandle?: boolean;
  customHandles?: React.ReactNode;
  children?: React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  selected,
  typeColor,
  icon: Icon,
  typeName,
  label,
  subtitle,
  status,
  showInputHandle = true,
  showOutputHandle = true,
  customHandles,
  children,
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'running':
        return 'ring-2 ring-violet-500 animate-pulse-glow border-violet-500';
      case 'completed':
        return 'border-emerald-500/80 shadow-glow-emerald';
      case 'failed':
        return 'border-red-500/80 shadow-glow-red';
      default:
        return selected ? 'ring-2 ring-primary border-primary' : 'border-slate-800 hover:border-slate-700';
    }
  };

  return (
    <div
      className={`relative w-72 rounded-xl bg-[#111118]/95 backdrop-blur-md border shadow-xl transition-all duration-200 select-none ${getStatusBorder()}`}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: typeColor,
      }}
    >
      {/* Top Input Handle */}
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-[#111118] hover:!bg-accent transition-transform hover:scale-125"
        />
      )}

      {/* Node Header */}
      <div className="p-3.5 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${typeColor}15`,
            borderColor: `${typeColor}35`,
            color: typeColor,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-mono uppercase tracking-wider font-semibold"
              style={{ color: typeColor }}
            >
              {typeName}
            </span>

            {/* Execution status indicator */}
            {status === 'running' && (
              <span className="flex items-center gap-1 text-[11px] text-violet-400 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                Running
              </span>
            )}
            {status === 'completed' && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}
            {status === 'failed' && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 font-mono">
                <XCircle className="w-3 h-3" />
                Failed
              </span>
            )}
          </div>

          <h5 className="text-sm font-semibold text-slate-100 truncate mt-0.5">
            {label}
          </h5>

          {subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Custom Body / Extra info */}
      {children && (
        <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-800/40 mt-1">
          {children}
        </div>
      )}

      {/* Custom or default bottom output handle */}
      {customHandles ? (
        customHandles
      ) : showOutputHandle ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-[#111118] hover:!bg-accent transition-transform hover:scale-125"
        />
      ) : null}
    </div>
  );
};
