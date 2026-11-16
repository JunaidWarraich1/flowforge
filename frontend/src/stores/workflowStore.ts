import { create } from 'zustand';
import {
  Workflow,
  WorkflowSummary,
  WorkflowCreatePayload,
  WorkflowUpdatePayload,
} from '../types';
import { workflowsApi } from '../api/workflows';

interface WorkflowState {
  workflows: WorkflowSummary[];
  total: number;
  page: number;
  pages: number;
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchWorkflows: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchWorkflow: (id: string) => Promise<Workflow>;
  createWorkflow: (payload: WorkflowCreatePayload) => Promise<Workflow>;
  updateWorkflow: (id: string, payload: WorkflowUpdatePayload) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  clearError: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  total: 0,
  page: 1,
  pages: 1,
  currentWorkflow: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchWorkflows: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await workflowsApi.list(params);
      set({
        workflows: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch workflows',
        isLoading: false,
      });
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowsApi.getById(id);
      set({ currentWorkflow: workflow, isLoading: false });
      return workflow;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to load workflow',
        isLoading: false,
      });
      throw err;
    }
  },

  createWorkflow: async (payload: WorkflowCreatePayload) => {
    set({ isSaving: true, error: null });
    try {
      const created = await workflowsApi.create(payload);
      set((state) => ({
        workflows: [created, ...state.workflows],
        isSaving: false,
      }));
      return created;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to create workflow',
        isSaving: false,
      });
      throw err;
    }
  },

  updateWorkflow: async (id: string, payload: WorkflowUpdatePayload) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await workflowsApi.update(id, payload);
      set((state) => ({
        currentWorkflow: updated,
        workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        isSaving: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to update workflow',
        isSaving: false,
      });
      throw err;
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await workflowsApi.delete(id);
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        currentWorkflow:
          state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to delete workflow',
        isLoading: false,
      });
      throw err;
    }
  },

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  clearError: () => set({ error: null }),
}));
