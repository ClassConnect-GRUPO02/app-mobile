import { router } from 'expo-router';
import { getItemAsync, setItemAsync } from 'expo-secure-store';

const getBaseUrl = (): string => {
  const IP = '35.223.247.76';
  return `http://${IP}:8080`;
};

// Configura la URL base de la API
// En desarrollo con Expo, puedes usar la IP de tu máquina en lugar de localhost
export const getBaseUrlCourses = (): string => {
  //const LOCAL_IP = "192.168.100.25";
  const LOCAL_IP = "35.223.247.76";
  return `http://${LOCAL_IP}:3000`;
}

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

  async postWithoutAuth<T>(endpoint: string, data: any): Promise<T> {

    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
  
      const responseData = await response.json();
      console.log('Response:', responseData); // Verificar la respuesta
  
      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || 'Ocurrió un error en la petición');
      }
  
      return responseData;
    } catch (error) {
      console.error(`Error en petición POST sin auth a ${endpoint}:`, error);
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

  // Método para peticiones PUT con token
  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders(); // Obtener los headers con el token
  
    try {
      console.log(`Making PUT request to ${endpoint} with data:`, data);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json', // Make sure this header is set
        },
        body: JSON.stringify(data),
      });
  
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Ocurrió un error en la petición');
        }
        
        return responseData;
      } else {
        // Handle non-JSON response
        const textResponse = await response.text();
        console.error('Server returned non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`Error en petición PUT a ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  }
};
