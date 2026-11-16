import { apiClient } from './client';
import { Execution, ExecutionSummary, PaginatedResponse } from '../types';

export const executionsApi = {
  async list(params?: {
    workflow_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ExecutionSummary>> {
    const response = await apiClient.get<PaginatedResponse<ExecutionSummary>>('/api/v1/executions', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Execution> {
    const response = await apiClient.get<Execution>(`/api/v1/executions/${id}`);
    return response.data;
  },
};
