import { router } from 'expo-router';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import * as Network from 'expo-network';

const getBaseUrl = (): string => {
  const IP = '35.223.247.76';
  return `http://${IP}:8080`;
};

export const getBaseUrlCourses = (): string => {
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

// Función helper para verificar conectividad
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    console.log('📶 Network State:', networkState);
    return networkState.isConnected === true;
  } catch (error) {
    console.error('Error checking network:', error);
    return true; // Asumimos que hay conexión si no podemos verificar
  }
};
const logNetworkRequest = (method: string, url: string, headers: any, data?: any) => {
  console.log(`🌐 ${method} Request:`, {
    url,
    headers,
    data: data ? JSON.stringify(data).substring(0, 200) : 'No data'
  });
};

const logNetworkResponse = (method: string, url: string, status: number, response: any) => {
  console.log(`📡 ${method} Response:`, {
    url,
    status,
    response: typeof response === 'string' ? response.substring(0, 200) : response
  });
};

const handleNetworkError = async (error: any, method: string, endpoint: string) => {
  // Verificar conectividad primero
  const isConnected = await checkNetworkConnectivity();
  
  console.error(`❌ Network Error (${method} ${endpoint}):`, {
    message: error.message,
    name: error.name,
    isConnected,
    platform: Platform.OS,
    stack: error.stack?.substring(0, 300),
    cause: error.cause
  });
  
  // En desarrollo, mostrar alert con el error
  if (__DEV__) {
    Alert.alert(
      'Error de Conexión',
      `${method} ${endpoint}\n${error.message}\nConectado: ${isConnected}`,
      [{ text: 'OK' }]
    );
  }
};

export const apiClient = {
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();
    
    logNetworkRequest('POST', url, headers, data);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        // Agregar timeout
        signal: AbortSignal.timeout(30000) // 30 segundos
      });

      const responseData = await response.json();
      logNetworkResponse('POST', url, response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error: any) {
      await handleNetworkError(error, 'POST', endpoint);
      
      // Verificar si es error de timeout o conexión
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout: El servidor no responde. Verifica tu conexión.');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor.');
      }
      
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },

  async postWithoutAuth<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    
    logNetworkRequest('POST', url, headers, data);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30000)
      });

      const responseData = await response.json();
      logNetworkResponse('POST', url, response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      handleNetworkError(error, 'POST', endpoint);
      
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout: El servidor no responde. Verifica tu conexión.');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor.');
      }
      
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();
    
    logNetworkRequest('GET', url, headers);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000)
      });

      const responseData = await response.json();
      logNetworkResponse('GET', url, response.status, responseData);

      if (response.status === 401 && responseData.title === "Session expired") {
        await handleSessionExpired();
        throw new Error("Sesión expirada. Redirigiendo a login...");
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error: any) {
      handleNetworkError(error, 'GET', endpoint);
      
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout: El servidor no responde. Verifica tu conexión.');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor.');
      }
      
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },

  async getWithoutAuth<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    
    logNetworkRequest('GET', url, headers);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000)
      });

      const responseData = await response.json();
      logNetworkResponse('GET', url, response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error: any) {
      handleNetworkError(error, 'GET', endpoint);
      
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout: El servidor no responde. Verifica tu conexión.');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor.');
      }
      
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();
    
    logNetworkRequest('PUT', url, headers, data);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30000)
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        logNetworkResponse('PUT', url, response.status, responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return responseData;
      } else {
        const textResponse = await response.text();
        logNetworkResponse('PUT', url, response.status, textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
      }
    } catch (error: any) {
      handleNetworkError(error, 'PUT', endpoint);
      
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout: El servidor no responde. Verifica tu conexión.');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor.');
      }
      
      throw error instanceof Error ? error : new Error('Error desconocido');
    }
  }
};