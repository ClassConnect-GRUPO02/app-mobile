import { router } from 'expo-router';
import { getItemAsync, setItemAsync } from 'expo-secure-store';

const getBaseUrl = (): string => {
  const IP = '35.223.247.76';
  return `http://${IP}:8080`;
};

const BASE_URL = getBaseUrl();

let authToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  authToken = token;

  if (token) {
    await setItemAsync('userToken', token);
  }
};

// obtener headers con token
const getAuthHeaders = async (): Promise<HeadersInit> => {
  if (!authToken) {
    const token = await getItemAsync('userToken');
    authToken = token;
  }

  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};


const handleSessionExpired = async () => {
  console.warn("Sesión expirada, redirigiendo a login...");
  await setAuthToken(null);
  await setItemAsync("userId", "");
  router.push("/(auth)/login");
};


// Cliente básico para peticiones HTTP
export const apiClient = {
  // Método para peticiones POST
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
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
    const headers = await getAuthHeaders(); // Obtener los headers con el token
    console.log('Headers:', headers); // Verificar los headers

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (response.status === 401 && responseData.title === "Session expired") {
        await handleSessionExpired();
        throw new Error("Sesión expirada. Redirigiendo a login...");
      }
      

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
