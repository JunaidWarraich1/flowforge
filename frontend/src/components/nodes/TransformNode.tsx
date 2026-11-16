import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Shuffle } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const TransformNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const mappingsCount = nodeData.config?.mappings?.length || 0;
  const expr = nodeData.config?.expression || '$.data';

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#8b5cf6"
      icon={Shuffle}
      typeName="Transform"
      label={nodeData.label || 'Transform Data'}
      status={nodeData.status}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
        <span>Expr: {expr}</span>
        <span className="text-[11px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded border border-violet-500/20">
          {mappingsCount} {mappingsCount === 1 ? 'rule' : 'rules'}
        </span>
      </div>
    </BaseNode>
  );
};
