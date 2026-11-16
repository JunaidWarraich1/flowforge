import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';

export const TriggerNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as NodeData;
  const triggerType = nodeData.config?.trigger_type || 'manual';

  return (
    <BaseNode
      id={id}
      selected={selected}
      typeColor="#06b6d4"
      icon={Play}
      typeName="Trigger"
      label={nodeData.label || 'Manual Trigger'}
      subtitle={`Trigger: ${triggerType.toUpperCase()}`}
      status={nodeData.status}
      showInputHandle={false}
      showOutputHandle={true}
    />
  );
};
