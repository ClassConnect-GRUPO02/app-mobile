const getBaseUrl = (): string => {
    const LOCAL_IP = '192.168.89.21'; // Reemplaza X con tu número de IP
    return `http://${LOCAL_IP}:8080`;
  };
  
  const BASE_URL = getBaseUrl();
  
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
    }
  };