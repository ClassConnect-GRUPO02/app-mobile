import {getBaseUrlCourses} from "./client"
import type { Module } from "@/types/Module"
import axios from "axios";

const API_URL = getBaseUrlCourses()

// Crea una instancia de axios con la configuración base
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

export const moduleClient = {
    // Obtener todos los módulos de un curso
    getModulesByCourseId: async (courseId: string): Promise<Module[]> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules`)
            return response.data.data || []
        } catch (error) {
            console.error(`Error fetching modules for course ${courseId}:`, error)
            return []
        }
    },

    // Obtener un módulo específico
    getModuleById: async (courseId: string, moduleId: string): Promise<Module | null> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules/${moduleId}`)
            return response.data.data
        } catch (error) {
            console.error(`Error fetching module ${moduleId}:`, error)
            return null
        }
    },

    // Crear un nuevo módulo
    createModule: async (courseId: string, module: Omit<Module, "id">): Promise<Module | null> => {
        try {
            const response = await api.post(`/courses/${courseId}/modules`, module)
            return response.data.data
        } catch (error) {
            console.error("Error creating module:", error)
            throw error
        }
    },

    // Actualizar un módulo
    updateModule: async (courseId: string, moduleId: string, moduleData: Partial<Module>): Promise<Module | null> => {
        try {
            const response = await api.patch(`/courses/${courseId}/modules/${moduleId}`, moduleData)
            return response.data.data
        } catch (error) {
            console.error(`Error updating module ${moduleId}:`, error)
            throw error
        }
    },

    // Eliminar un módulo
    deleteModule: async (courseId: string, moduleId: string): Promise<boolean> => {
        try {
            await api.delete(`/courses/${courseId}/modules/${moduleId}`)
            return true
        } catch (error) {
            console.error(`Error deleting module ${moduleId}:`, error)
            return false
        }
    },

    // Actualizar el orden de los módulos
    updateModulesOrder: async (courseId: string, orderedModuleIds: string[]): Promise<boolean> => {
        try {
            await api.patch(`/courses/${courseId}/modules/order`, { orderedModuleIds })
            return true
        } catch (error) {
            console.error("Error updating modules order:", error)
            return false
        }
    },
}
