import { apiClient } from './client';
import { setItemAsync } from 'expo-secure-store';

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
  userType: string;
  latitude?: number;
  longitude?: number;
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

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  userType: string;
}

export const userApi = {
  // Registro de un nuevo usuario
  async register(userData: UserRegisterData): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/users', userData);
  },

  // Login de un usuario
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/login', credentials);
  },

  // Guardar el token de autenticación en el almacenamiento seguro
  async storeToken(token: string): Promise<void> {
    await setItemAsync('userToken', token);
  },

  // Obtener todos los usuarios
  async getAllUsers(): Promise<{ users: UserInfo[] }> {
    return apiClient.get<{ users: UserInfo[] }>('/users');
  },

  // Obtener un usuario específico por ID
  async getUserById(id: string): Promise<{ user: UserInfo }> {
    return apiClient.get<{ user: UserInfo }>(`/user/${id}`);
  },
};
