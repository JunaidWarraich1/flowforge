import { apiClient } from './client';
import {
  Workflow,
  WorkflowSummary,
  WorkflowCreatePayload,
  WorkflowUpdatePayload,
  PaginatedResponse,
  Execution,
} from '../types';

export const workflowsApi = {
  async list(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WorkflowSummary>> {
    const response = await apiClient.get<PaginatedResponse<WorkflowSummary>>('/api/v1/workflows', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Workflow> {
    const response = await apiClient.get<Workflow>(`/api/v1/workflows/${id}`);
    return response.data;
  },

  async create(data: WorkflowCreatePayload): Promise<Workflow> {
    const response = await apiClient.post<Workflow>('/api/v1/workflows', data);
    return response.data;
  },

  async update(id: string, data: WorkflowUpdatePayload): Promise<Workflow> {
    const response = await apiClient.put<Workflow>(`/api/v1/workflows/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/workflows/${id}`);
  },

  async execute(id: string, inputData: any = {}): Promise<Execution> {
    const response = await apiClient.post<Execution>(`/api/v1/workflows/${id}/execute`, {
      input_data: inputData,
    });
    return response.data;
  },
};
