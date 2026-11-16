import { create } from 'zustand';
import {
  Execution,
  ExecutionSummary,
  ExecutionStatus,
  NodeExecutionStatus,
  NodeExecution,
} from '../types';
import { executionsApi } from '../api/executions';
import { workflowsApi } from '../api/workflows';

interface ExecutionState {
  executions: ExecutionSummary[];
  total: number;
  page: number;
  pages: number;
  currentExecution: Execution | null;
  activeExecutionId: string | null;
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;

  fetchExecutions: (params?: {
    workflow_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchExecution: (id: string) => Promise<Execution>;
  startExecution: (workflowId: string, inputData?: any) => Promise<Execution>;
  updateExecutionStatus: (status: ExecutionStatus, startedAt?: string, finishedAt?: string, error?: string) => void;
  updateNodeStatus: (payload: {
    node_id: string;
    status: NodeExecutionStatus;
    input_data?: any;
    output_data?: any;
    duration_ms?: number;
    error?: string;
  }) => void;
  completeExecution: (status: ExecutionStatus, finishedAt?: string) => void;
  resetCurrentExecution: () => void;
  clearError: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  executions: [],
  total: 0,
  page: 1,
  pages: 1,
  currentExecution: null,
  activeExecutionId: null,
  isRunning: false,
  isLoading: false,
  error: null,

  fetchExecutions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await executionsApi.list(params);
      set({
        executions: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch executions',
        isLoading: false,
      });
    }
  },

  fetchExecution: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const execution = await executionsApi.getById(id);
      const isRunning = execution.status === 'running' || execution.status === 'pending';
      set({
        currentExecution: execution,
        activeExecutionId: isRunning ? execution.id : null,
        isRunning,
        isLoading: false,
      });
      return execution;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to load execution details',
        isLoading: false,
      });
      throw err;
    }
  },

  startExecution: async (workflowId: string, inputData: any = {}) => {
    set({ isRunning: true, error: null });
    try {
      const execution = await workflowsApi.execute(workflowId, inputData);
      set({
        activeExecutionId: execution.id,
        currentExecution: execution,
        isRunning: true,
      });
      return execution;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to trigger execution',
        isRunning: false,
      });
      throw err;
    }
  },

  updateExecutionStatus: (status, startedAt, finishedAt, error) => {
    set((state) => {
      if (!state.currentExecution) return state;
      return {
        isRunning: status === 'running' || status === 'pending',
        currentExecution: {
          ...state.currentExecution,
          status,
          started_at: startedAt ?? state.currentExecution.started_at,
          finished_at: finishedAt ?? state.currentExecution.finished_at,
          error: error ?? state.currentExecution.error,
        },
      };
    });
  },

  updateNodeStatus: (payload) => {
    set((state) => {
      if (!state.currentExecution) return state;

      const existingNodes = [...(state.currentExecution.node_executions || [])];
      const index = existingNodes.findIndex((n) => n.node_id === payload.node_id);

      if (index >= 0) {
        existingNodes[index] = {
          ...existingNodes[index],
          status: payload.status,
          input_data: payload.input_data ?? existingNodes[index].input_data,
          output_data: payload.output_data ?? existingNodes[index].output_data,
          duration_ms: payload.duration_ms ?? existingNodes[index].duration_ms,
          error: payload.error ?? existingNodes[index].error,
          finished_at:
            payload.status === 'completed' || payload.status === 'failed'
              ? new Date().toISOString()
              : existingNodes[index].finished_at,
        };
      } else {
        const newNode: NodeExecution = {
          id: `ne_${payload.node_id}_${Date.now()}`,
          execution_id: state.currentExecution.id,
          node_id: payload.node_id,
          node_type: 'trigger',
          status: payload.status,
          input_data: payload.input_data,
          output_data: payload.output_data,
          duration_ms: payload.duration_ms,
          error: payload.error,
          started_at: new Date().toISOString(),
        };
        existingNodes.push(newNode);
      }

      return {
        currentExecution: {
          ...state.currentExecution,
          node_executions: existingNodes,
        },
      };
    });
  },

  completeExecution: (status, finishedAt) => {
    set((state) => ({
      isRunning: false,
      activeExecutionId: null,
      currentExecution: state.currentExecution
        ? {
            ...state.currentExecution,
            status,
            finished_at: finishedAt || new Date().toISOString(),
          }
        : null,
    }));
  },

  resetCurrentExecution: () => {
    set({
      currentExecution: null,
      activeExecutionId: null,
      isRunning: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
