import React from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const LogNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const level = nodeData.config?.level || 'info';
  const message = nodeData.config?.message || 'Processing event...';

  const levelStyles: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#f43f5e"
      icon={FileText}
      typeName="Log"
      label={nodeData.label || 'Log Output'}
      status={nodeData.status}
    >
      <div className="flex items-center gap-2 pt-2">
        <span
          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
            levelStyles[level] || levelStyles.info
          }`}
        >
          {level}
        </span>
        <span className="text-xs font-mono text-slate-400 truncate flex-1">
          {message}
        </span>
      </div>
    </BaseNode>
  );
};
