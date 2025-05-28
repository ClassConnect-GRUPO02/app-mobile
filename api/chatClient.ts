import { getItemAsync } from "expo-secure-store";
import axios from "axios";

import { getBaseUrlCourses } from './client';

const API_URL = getBaseUrlCourses();

// Crea una instancia de axios con la configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Añadir interceptores para debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  async (config) => {
    const token = await getItemAsync("userToken");
    if (token) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response] Status: ${response.status} from ${response.config.url}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[API Error] Status: ${error.response.status}, URL: ${error.config.url}`
      );
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("[API Error] No response received:", error.request);
    } else {
      console.error("[API Error]", error.message);
    }
    return Promise.reject(error);
  }
);

// Cliente de chat
export const chatClient = {
  sendChatMessage: async ({
    message,
    history = [],
  }: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  }) => {
    try {
      const response = await api.post("/chat", {
        message,
        history,
      });
      console.log("Mensaje enviado al backend:", message);
      console.log("Respuesta del backend:", response.data);

      return response.data; // { reply: "..." }
    } catch (error) {
      console.error("Error enviando mensaje al backend:", error);
      throw error;
    }
  },
};
