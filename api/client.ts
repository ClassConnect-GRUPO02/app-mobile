import { getItemAsync } from 'expo-secure-store';

const getBaseUrl = (): string => {
  const CLOUD_IP = '35.223.247.76'; // Reemplaza X con tu número de IP
  return `http://${CLOUD_IP}:8080`;
};

const BASE_URL = getBaseUrl();

// Almacenará el token de autenticación
let authToken: string | null = null;

// Función para configurar el token
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Función auxiliar para obtener headers con token
const getAuthHeaders = async (): Promise<HeadersInit> => {
  if (!authToken) {
    // Si no hay token configurado, lo intentamos obtener de secure-store
    const token = await getItemAsync('userToken');
    authToken = token;
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };
};

// Cliente básico para peticiones HTTP
export const apiClient = {
  // Método para peticiones POST
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Ocurrió un error en la petición');
      }

      return responseData;
    } catch (error) {
      console.error(`Error en petición POST a ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },

  // Método para peticiones GET con token
  async get<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Ocurrió un error en la petición');
      }

      return responseData;
    } catch (error) {
      console.error(`Error en petición GET a ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },
};
