import { getItemAsync } from "expo-secure-store"
import axios from "axios"
import {Course} from "@/types/Course";
import { getBaseUrlCourses } from './client';

const API_URL = getBaseUrlCourses()

// Crea una instancia de axios con la configuración base
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Añadir interceptores para debugging
api.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error("[API Request Error]", error)
        return Promise.reject(error)
    },
)

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] Status: ${response.status} from ${response.config.url}`)
        return response
    },
    (error) => {
        if (error.response) {
            console.error(`[API Error] Status: ${error.response.status}, URL: ${error.config.url}`)
            console.error("Response data:", error.response.data)
        } else if (error.request) {
            console.error("[API Error] No response received:", error.request)
        } else {
            console.error("[API Error]", error.message)
        }
        return Promise.reject(error)
    },
)

// Servicio para cursos
export const courseClient = {
    // Obtener todos los cursos
    getAllCourses: async () => {
        try {
            const response = await api.get("/courses")
            return response.data.data
        } catch (error) {
            console.error("Error fetching courses:", error)
            throw error
        }
    },

    // Obtener un curso por ID
    getCourseById: async (id: string) => {
        try {
            const response = await api.get(`/courses/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error fetching course with ID ${id}:`, error)
            throw error
        }
    },

    // Verificar si un usuario está inscrito en un curso
    isEnrolledInCourse: async (courseId: string, userId: string) => {
        try {
            const response = await api.get(`/courses/${courseId}/enrollments/${userId}`)
            return response.data.isEnrolled === true
        } catch (error) {
            console.error(`Error checking enrollment for user ${userId} in course ${courseId}:`, error)
            return false
        }
    },

    // Verificar si un usuario es instructor en un curso
    isInstructorInCourse: async (courseId: string, userId: string) => {
        try {
            const response = await api.get(`/courses/${courseId}/instructors/${userId}`)
            return response.data.isInstructor
        } catch (error) {
            console.error(`Error checking instructor status for user ${userId} in course ${courseId}:`, error)
            throw error
        }
    },

    // Inscribir a un estudiante en un curso
    enrollStudentInCourse: async (courseId: string, userId: string) => {
        try {
            await api.post(`/courses/${courseId}/enrollments`, { userId })
            return true
        } catch (error) {
            console.error(`Error enrolling user ${userId} in course ${courseId}:`, error)
            throw error
        }
    },

    // Crear un nuevo curso
    createCourse: async (course: Course) => {
        try {
            // Obtener el ID del usuario actual para asignarlo como creador
            const userId = await getItemAsync("userId")
            if (!userId) {
                throw new Error("No se encontró el ID del usuario")
            }

            // Asignar el ID del creador al curso
            const courseWithCreator = {
                ...course,
                creatorId: userId,
            }
            const response = await api.post("/courses", courseWithCreator)
            return response.data.data
        } catch (error) {
            console.error("Error creating course:", error)
            throw error
        }
    },

    // Eliminar un curso
    deleteCourse: async (id: string) => {
        try {
            await api.delete(`/courses/${id}`)
            return true
        } catch (error) {
            console.error(`Error deleting course with ID ${id}:`, error)
            throw error
        }
    },

    // Editar un curso
    updateCourse: async (course: Partial<Course>) => {
        const id = course.id;
        try {
            const response = await api.patch(`/courses/${id}`, course);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating course with ID ${id}:`, error);
            throw error;
        }
    },

    // Obtener módulos de un curso
    getModules: async (courseId: string) => {
        try {
            const response = await api.get(`/courses/${courseId}/modules`)
            return response.data.data
        } catch (error) {
            console.error(`Error fetching modules for course ${courseId}:`, error)
            return []
        }
    },

    // Obtener un módulo específico
    getModule: async (courseId: string, moduleId: string) => {
        try {
            const response = await api.get(`/courses/${courseId}/modules/${moduleId}`)
            return response.data.data
        } catch (error) {
            console.error(`Error fetching module ${moduleId} for course ${courseId}:`, error)
            throw error
        }
    },

    // Añadir un módulo a un curso
    addModuleToCourse: async (courseId: string, module: any) => {
        try {
            const response = await api.post(`/courses/${courseId}/modules`, module)
            return response.data.data
        } catch (error) {
            console.error(`Error adding module to course ${courseId}:`, error)
            throw error
        }
    },

    // Eliminar un módulo de un curso
    deleteModule: async (courseId: string, moduleId: string) => {
        try {
            await api.delete(`/courses/${courseId}/modules/${moduleId}`)
            return true
        } catch (error) {
            console.error(`Error deleting module ${moduleId} from course ${courseId}:`, error)
            throw error
        }
    },

    // Obtener cursos por ID de usuario
    getCoursesByUserId: async (userId: string) => {
        try {
            const response = await api.get(`/users/${userId}/courses`)
            return response.data.data
        } catch (error) {
            console.error(`Error fetching courses for user ${userId}:`, error)
            return []
        }
    },

    // Agregar curso a favoritos del usuario (UserId es el id del estudiante)
    addFavorite: async (userId: string, courseId: string) => {
        try {
            const response = await api.post(`/students/${userId}/favorite-courses/${courseId}`);
            return response.data;
        } catch (error) {
            //console.error(`Error adding favorite course ${courseId} for student ${userId}:`, error);
            //throw error;
        }
    },

    // Eliminar curso de favoritos del usuario (UserId es el id del estudiante)
    removeFavorite: async (userId: string, courseId: string) => {
        try {
            const response = await api.delete(`/students/${userId}/favorite-courses/${courseId}`);
            return response.data;
        } catch (error) {
            console.error(`Error removing favorite course ${courseId} for student ${userId}:`, error);
            throw error;
        }
    },

    // Verificar si un curso es favorito del usuario (UserId es el id del estudiante)
    checkIfFavorite: async (userId: string, courseId: string) => {
        try {
            const response = await api.get(`/students/${userId}/favorite-courses/${courseId}`);
            return !!response.data.data;
        } catch (error) {
            console.error(`Error checking favorite status for course ${courseId} for student ${userId}:`, error);
            return false;
        }
    },

    // Obtener ids de los cursos favoritos del usuario (UserId es el id del estudiante)
    getFavoriteCourses: async (userId: string) => {
        try {
            const response = await api.get(`/students/${userId}/favorite-courses`);
            const favorites_courses_ids: string[] = [];
            for (const favoriteCourse of response.data.data) {
                favorites_courses_ids.push(favoriteCourse.course_id);
            }
            console.log("Favoritos del estudiante:", favorites_courses_ids);
            return favorites_courses_ids;
        } catch (error) {
            console.error(`Error fetching favorite courses for student ${userId}:`, error);
            throw error;
        }
    }
}
