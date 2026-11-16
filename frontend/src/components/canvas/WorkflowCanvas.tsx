import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../nodes';
import { useCanvasStore } from '../../stores/canvasStore';
import { NodeType } from '../../types';

interface WorkflowCanvasInnerProps {
  readOnly?: boolean;
}

const WorkflowCanvasInner: React.FC<WorkflowCanvasInnerProps> = ({ readOnly = false }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useCanvasStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (readOnly) return;

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [readOnly, screenToFlowPosition, addNode]
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      // Prevent connecting node to itself
      if (connection.source === connection.target) return false;
      // Prevent duplicate edges
      const isDuplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle
      );
      return !isDuplicate;
    },
    [edges]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => {
          if (!readOnly) selectNode(node.id);
        }}
        onPaneClick={() => {
          if (!readOnly) selectNode(null);
        }}
        isValidConnection={isValidConnection}
        fitView
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1e293b"
          className="bg-[#0a0a0f]"
        />
        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger':
                return '#06b6d4';
              case 'http_request':
                return '#3b82f6';
              case 'transform':
                return '#8b5cf6';
              case 'condition':
                return '#f59e0b';
              case 'delay':
                return '#64748b';
              case 'code':
                return '#10b981';
              case 'log':
                return '#f43f5e';
              default:
                return '#94a3b8';
            }
          }}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export interface WorkflowCanvasProps {
  readOnly?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ readOnly = false }) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner readOnly={readOnly} />
    </ReactFlowProvider>
  );
};
