import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const ConditionNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const field = nodeData.config?.field || '$.status';
  const operator = nodeData.config?.operator || 'eq';
  const value = String(nodeData.config?.value ?? '200');

  const customHandles = (
    <div className="relative w-full flex justify-between px-8 py-2 border-t border-slate-800/60 bg-[#0e0e16]/60 rounded-b-xl">
      <div className="relative flex flex-col items-center">
        <span className="text-[10px] font-mono font-bold text-emerald-400">TRUE</span>
        <Handle
          type="source"
          id="true"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#111118] hover:scale-125 transition-transform !bottom-[-6px]"
        />
      </div>

      <div className="relative flex flex-col items-center">
        <span className="text-[10px] font-mono font-bold text-red-400">FALSE</span>
        <Handle
          type="source"
          id="false"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-red-400 !border-2 !border-[#111118] hover:scale-125 transition-transform !bottom-[-6px]"
        />
      </div>
    </div>
  );

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#f59e0b"
      icon={GitBranch}
      typeName="Condition"
      label={nodeData.label || 'Check Condition'}
      status={nodeData.status}
      showOutputHandle={false}
      customHandles={customHandles}
    >
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 pt-2">
        <span className="text-amber-400 truncate max-w-[90px]">{field}</span>
        <span className="text-slate-500 font-bold">{operator}</span>
        <span className="text-cyan-400 truncate max-w-[80px]">{value}</span>
      </div>
    </BaseNode>
  );
};
