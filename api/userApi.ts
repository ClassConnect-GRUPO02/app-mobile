import { apiClient } from './client';
import { setItemAsync } from 'expo-secure-store';

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message?: string;
}

export const userApi = {
  async register(userData: UserRegisterData): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/users', userData);
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/login', credentials);
  },

  async storeToken(token: string): Promise<void> {
    await setItemAsync('userToken', token);
  }
};
