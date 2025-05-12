import { apiClient, setAuthToken } from './client';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import NotificationSettings from '@/types/NotificationSettings';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
  userType?: string;
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
  refreshToken?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  userType: string;
  latitude?: number;
  longitude?: number;
  avatarUrl?: string;
}

export const userApi = {
  // Registro de un nuevo usuario
  async register(userData: UserRegisterData): Promise<RegisterResponse> {
    return apiClient.postWithoutAuth<RegisterResponse>('/users', userData);

  },

  // Login de un usuario
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/login', credentials);
      console.log('Respuesta del login:', response);
      // Si login es exitoso, almacenamos el token y el userId
      if (response.token && response.id && response.refreshToken) {
        console.log('Token recibido:', response.token);
        console.log('ID de usuario recibido:', response.id);
        await userApi.storeToken(response.token);  // Guardamos el token
        await userApi.storeUserId(response.id);    // Guardamos el id del usuario
          await userApi.storeRefreshToken(response.refreshToken);
        
      }

      return response;
    } catch (error) {
      console.error("Error en el login:", error);
      throw error;
    }
  },

  // Guardar el token de autenticación en el almacenamiento seguro
  async storeToken(token: string): Promise<void> {
    await setAuthToken(token); // Esto guarda en SecureStore y actualiza authToken
  },

  // Guardar el ID del usuario en el almacenamiento seguro
  storeUserId: async (id: string): Promise<void> => {
    await setItemAsync("userId", id); // Guardamos el userId en secure-store
  },

  storeRefreshToken: async (refreshToken: string): Promise<void> => {
    await setItemAsync('refreshToken', refreshToken);  // Guardamos el refreshToken en secure-store
  },

  // Obtener el ID del usuario desde secure-store
  getUserId: async (): Promise<string | null> => {
    return await getItemAsync("userId"); // Recuperamos el ID del usuario
  },

  // Obtener todos los usuarios
  async getAllUsers(): Promise<{ users: UserInfo[] }> {
    return apiClient.get<{ users: UserInfo[] }>("/users");
  },

  // Obtener un usuario específico por ID
  async getUserById(id: string): Promise<{ user: UserInfo }> {
    return apiClient.get<{ user: UserInfo }>(`/user/${id}`);
  },


  async checkEmailExists(email: string): Promise<{ exists: boolean; token: string; id: string }> {
    const response = await apiClient.get<{ exists: boolean; token: string, id: string }>(`/check-email-exists/${email}`);

    return { exists: response.exists,
              token: response.token,
              id: response.id  // Agregamos el ID a la respuesta
    };
  },  

  async updateUser(
    id: string,
    userData: Partial<UserInfo>
  ): Promise<{ description: string }> {
    return apiClient.put<{ description: string }>(`/user/${id}`, userData);
  },
   async verifyPin(pin: number, email: string): Promise<{ success: boolean; description: string }> {
    try {
      const response = await apiClient.postWithoutAuth<{ success: boolean; description: string }>('/users/verify', {
        email,
        pin,
      });
      return response;
    } catch (error) {
      console.error('Error al verificar el PIN:', error);
      throw error;
    }
  },

  // Solicitar un nuevo PIN
  async requestNewPin(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.postWithoutAuth<{ success: boolean; message?: string }>('/users/request-new-pin', {
        email,
      });
      return response;
    } catch (error) {
      console.error('Error al solicitar un nuevo PIN:', error);
      throw error;
    }
  },


  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/biometric-login', { refreshToken });
      
      // Si el refresh es exitoso, almacenamos el nuevo token
      if (response.token) {
        console.log('Nuevo token recibido:', response.token);
        await userApi.storeToken(response.token);  // Guardamos el nuevo token
        await userApi.storeUserId(response.id);    // Guardamos el id del usuario
      }

      return response;
    } catch (error) {
      console.error('Error al refrescar el token:', error);
      throw error;
    }
  },
  
  async setNotificationsSettings(
    id: string,
    settings: NotificationSettings
  ): Promise<{ description: string }> {
    return apiClient.put<{ description: string }>(`/users/${id}/notification-settings`, settings);
  },

  async getNotificationSettings(id: string): Promise<{ settings: NotificationSettings }> {
    return apiClient.get<{ settings: NotificationSettings }>(`/users/${id}/notification-settings`);
  },

   async  registerPushToken() {

    const userId = await getItemAsync('userId');
  
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
  
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  
    if (finalStatus !== 'granted') return;
  
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  
    // Enviá el token al backend de usuarios
   return apiClient.post<{ description: string }>(`/users/${userId}/push-token`, {
      token: token,
    });
},

async notifyUser(
  userId: string,
  title: string,
  body: string,
  notificationType: string
): Promise<{ description: string }> {
  return apiClient.post<{ description: string }>(`/users/${userId}/notifications`, {
    title,
    body,
    notificationType,
  });
}
}
