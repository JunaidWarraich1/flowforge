import { apiClient } from './client';
import { User, TokenResponse, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
  async register(data: RegisterPayload): Promise<User> {
    const response = await apiClient.post<User>('/api/v1/auth/register', {
      email: data.email,
      full_name: data.full_name,
      password: data.password,
    });
    return response.data;
  },

  async login(data: LoginPayload): Promise<TokenResponse> {
    // Supports standard OAuth2 form username/password as specified in architecture
    const formParams = new URLSearchParams();
    formParams.append('username', data.email);
    formParams.append('password', data.password);

    try {
      const response = await apiClient.post<TokenResponse>('/api/v1/auth/login', formParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (err: any) {
      // Fallback if backend accepts raw JSON
      if (err.response?.status === 422) {
        const jsonResponse = await apiClient.post<TokenResponse>('/api/v1/auth/login', {
          email: data.email,
          password: data.password,
        });
        return jsonResponse.data;
      }
      throw err;
    }
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },
};
