import axios, { AxiosInstance } from 'axios';

export interface User {
  name: string;
  email: string;
  password: string;
  userType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  description: string;
  token: string;
}

export interface RegisterResponse {
  description: string;
  email: string;
  name: string;
}

export interface ApiError {
  title: string;
  type: string;
  status: number;
  detail: string;
  instance: string;
}

const getBaseUrl = (): string => {
  const LOCAL_IP = '192.168.1.X'; // Reemplaza X con tu número de IP local
  return `http://${LOCAL_IP}:8080`;
};

const BASE_URL = getBaseUrl();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});


export const authClient = {
  async register(user: User): Promise<RegisterResponse> {
    try {
      const response = await axiosInstance.post<RegisterResponse>('/users', user);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error en registro:', error.response.data);
        throw error.response.data as ApiError;
      }
      throw new Error('Error al registrar usuario');
    }
  },


  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/login', credentials);
      
      if (response.data.token) {
        localStorage.setItem('userToken', response.data.token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error en login:', error.response.data);
        throw error.response.data as ApiError;
      }
      throw new Error('Error al iniciar sesión');
    }
  },
  

  logout(): void {
    delete axiosInstance.defaults.headers.common['Authorization'];
    localStorage.removeItem('userToken');
  },
  

  setAuthToken(token: string): void {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  async loadTokenFromStorage(): Promise<boolean> {
    try {
     
      const token = localStorage.getItem('userToken');
      
 
      if (token) {
        this.setAuthToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cargar token:', error);
      return false;
    }
  }
};

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authClient.logout();
    }
    return Promise.reject(error);
  }
);