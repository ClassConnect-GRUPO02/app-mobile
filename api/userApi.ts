import { apiClient } from './client';

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
  userType: string;
}

export interface RegisterResponse {
  id?: string;
  message?: string;
}

export const userApi = {
  async register(userData: UserRegisterData): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/users', userData);
  }
};