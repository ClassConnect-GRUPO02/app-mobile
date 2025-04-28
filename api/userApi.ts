import { apiClient, setAuthToken } from './client';
import { getItemAsync, setItemAsync } from 'expo-secure-store';

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
  id: string;
  token: string;
  message?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  userType: string;
  latitude?: number;
  longitude?: number;
}

export const userApi = {
  // Registro de un nuevo usuario
  async register(userData: UserRegisterData): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/users', userData);
  },

  // Login de un usuario
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/login', credentials);
      
      // Si login es exitoso, almacenamos el token y el userId
      if (response.token && response.id) {
        console.log('Token recibido:', response.token);
        console.log('ID de usuario recibido:', response.id);
        await userApi.storeToken(response.token);  // Guardamos el token
        await userApi.storeUserId(response.id);    // Guardamos el id del usuario
      }

      return response;
    } catch (error) {
      console.error('Error en el login:', error);
      throw error;
    }
  },

  // Guardar el token de autenticación en el almacenamiento seguro
  async storeToken(token: string): Promise<void> {
    await setAuthToken(token); // Esto guarda en SecureStore y actualiza authToken
  },

  // Guardar el ID del usuario en el almacenamiento seguro
  storeUserId: async (id: string): Promise<void> => {
    await setItemAsync('userId', id);  // Guardamos el userId en secure-store
  },

  // Obtener el ID del usuario desde secure-store
  getUserId: async (): Promise<string | null> => {
    return await getItemAsync('userId');  // Recuperamos el ID del usuario
  },

  // Obtener todos los usuarios
  async getAllUsers(): Promise<{ users: UserInfo[] }> {
    return apiClient.get<{ users: UserInfo[] }>('/users');
  },

  // Obtener un usuario específico por ID
  async getUserById(id: string): Promise<{ user: UserInfo }> {
    return apiClient.get<{ user: UserInfo }>(`/user/${id}`);
  },

  async updateUser(id: string, userData: Partial<UserInfo>): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/user/${id}`, userData);
  }
};
