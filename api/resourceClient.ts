import {getBaseUrlCourses} from "./client"
import type { Resource } from "@/types/Resource"
import axios from "axios";

const API_URL = getBaseUrlCourses()

// Crea una instancia de axios con la configuración base
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

export const resourceClient = {

    // Obtener recursos de un módulo
    getResourcesByModuleId: async (moduleId: string): Promise<Resource[]> => {
        try {
            const response = await apiClient.get<{ data: Resource[] }>(`/modules/${moduleId}/resources`)
            return response.data.data || []
        } catch (error) {
            console.error(`Error fetching resources for module ${moduleId}:`, error)
            return []
        }
    },

    // Crear un nuevo recurso
    createResource: async (moduleId: string, resource: Omit<Resource, "id">): Promise<Resource | null> => {
        try {
            const response = await apiClient.post<{ data: Resource }>(`/modules/${moduleId}/resources`, resource)
            return response.data.data
        } catch (error) {
            console.error(`Error creating resource for module ${moduleId}:`, error)
            return null
        }
    },

    // Actualizar un recurso existente
    updateResource: async (
        moduleId: string,
        resourceId: string,
        resourceData: Partial<Resource>,
    ): Promise<Resource | null> => {
        try {
            const response = await apiClient.patch<{ data: Resource }>(
                `/modules/${moduleId}/resources/${resourceId}`,
                resourceData,
            )
            return response.data.data
        } catch (error) {
            console.error(`Error updating resource ${resourceId}:`, error)
            return null
        }
    },

    // Eliminar un recurso
    deleteResource: async (moduleId: string, resourceId: string): Promise<boolean> => {
        try {
            await apiClient.delete(`/modules/${moduleId}/resources/${resourceId}`)
            return true
        } catch (error) {
            console.error(`Error deleting resource ${resourceId}:`, error)
            return false
        }
    },

    // Actualizar el orden de los recursos
    updateResourcesOrder: async (moduleId: string, orderedResourceIds: string[]): Promise<boolean> => {
        try {
            await apiClient.patch(`/modules/${moduleId}/resources/order`, { orderedResourceIds })
            return true
        } catch (error) {
            console.error(`Error updating resources order for module ${moduleId}:`, error)
            return false
        }
    },
}
