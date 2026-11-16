import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NodeType, GraphData, CanvasNode, CanvasEdge, NodeExecutionStatus } from '../types';

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  updateNodeConfig: (nodeId: string, label: string, config: any) => void;
  updateNodeStatus: (nodeId: string, status: NodeExecutionStatus, result?: any) => void;
  clearAllNodeStatuses: () => void;
  removeNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;

  setGraph: (graph: GraphData) => void;
  getGraph: () => GraphData;
  resetGraph: () => void;
  markClean: () => void;
}

const getDefaultConfig = (type: NodeType): any => {
  switch (type) {
    case 'trigger':
      return { trigger_type: 'manual' };
    case 'http_request':
      return {
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
        timeout_seconds: 30,
      };
    case 'transform':
      return {
        expression: '$.data',
        mappings: [{ source: '$.id', target: '$.record_id' }],
      };
    case 'condition':
      return {
        field: '$.status_code',
        operator: 'eq',
        value: 200,
      };
    case 'delay':
      return { seconds: 5 };
    case 'code':
      return {
        code: 'result = [u for u in input_data.get("users", []) if u.get("active")]',
        timeout_seconds: 10,
      };
    case 'log':
      return {
        message: 'Step execution completed successfully: {$.count} records processed',
        level: 'info',
      };
    default:
      return {};
  }
};

const getDefaultLabel = (type: NodeType): string => {
  switch (type) {
    case 'trigger':
      return 'Manual Trigger';
    case 'http_request':
      return 'HTTP Request';
    case 'transform':
      return 'Transform Data';
    case 'condition':
      return 'Evaluate Condition';
    case 'delay':
      return 'Delay Execution';
    case 'code':
      return 'Run Script';
    case 'log':
      return 'Log Output';
    default:
      return 'Node';
  }
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  onConnect: (connection: Connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: 'default',
          animated: false,
        },
        state.edges
      ),
      isDirty: true,
    }));
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label: getDefaultLabel(type),
        config: getDefaultConfig(type),
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isDirty: true,
    }));

    return id;
  },

  updateNodeConfig: (nodeId: string, label: string, config: any) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                label,
                config,
              },
            }
          : n
      ),
      isDirty: true,
    }));
  },

  updateNodeStatus: (nodeId: string, status: NodeExecutionStatus, result?: any) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                status,
                executionResult: result ?? (n.data as any)?.executionResult,
              },
            }
          : n
      ),
    }));
  },

  clearAllNodeStatuses: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: undefined,
          executionResult: undefined,
        },
      })),
      edges: state.edges.map((e) => ({
        ...e,
        animated: false,
        className: undefined,
      })),
    }));
  },

  removeNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    }));
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  setGraph: (graph: GraphData) => {
    const nodes: Node[] = (graph.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position || { x: 100, y: 100 },
      data: {
        label: n.data?.label || getDefaultLabel(n.type),
        config: n.data?.config || getDefaultConfig(n.type),
        status: n.data?.status,
      },
    }));

    const edges: Edge[] = (graph.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined,
      label: e.label || undefined,
      animated: e.animated || false,
    }));

    set({
      nodes,
      edges,
      selectedNodeId: null,
      isDirty: false,
    });
  },

  getGraph: (): GraphData => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type as NodeType) || 'trigger',
        position: n.position,
        data: {
          label: (n.data as any)?.label || 'Node',
          config: (n.data as any)?.config || {},
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
        label: (e.label as string) ?? null,
      })),
    };
  },

  resetGraph: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
    });
  },

  markClean: () => set({ isDirty: false }),
}));
