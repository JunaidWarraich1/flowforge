import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const DelayNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const seconds = nodeData.config?.seconds || 5;

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#64748b"
      icon={Clock}
      typeName="Delay"
      label={nodeData.label || 'Wait'}
      subtitle={`Delay: ${seconds}s`}
      status={nodeData.status}
    />
  );
};
