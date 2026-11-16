import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Code2 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const CodeNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const rawCode = nodeData.config?.code || '';
  const firstLine = rawCode.split('\n').find((l: string) => l.trim().length > 0) || '# python script';

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#10b981"
      icon={Code2}
      typeName="Code"
      label={nodeData.label || 'Python Script'}
      status={nodeData.status}
    >
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
        <span className="truncate max-w-[170px] text-emerald-400/90">{firstLine}</span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25">
          PY 3.11
        </span>
      </div>
    </BaseNode>
  );
};
