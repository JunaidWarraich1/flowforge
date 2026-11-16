import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const HttpRequestNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const method = nodeData.config?.method || 'GET';
  const url = nodeData.config?.url || 'https://api.example.com';

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#3b82f6"
      icon={Globe}
      typeName="HTTP Request"
      label={nodeData.label || 'Fetch Data'}
      status={nodeData.status}
    >
      <div className="flex items-center gap-2 pt-2">
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            methodColors[method] || methodColors.GET
          }`}
        >
          {method}
        </span>
        <span className="text-xs font-mono text-slate-400 truncate flex-1">
          {url}
        </span>
      </div>
    </BaseNode>
  );
};
