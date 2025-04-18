import axios from "axios"
import {Course} from "@/types/Course";

// Configura la URL base de la API
// En desarrollo con Expo, puedes usar la IP de tu máquina en lugar de localhost
const getBaseUrl = (): string => {
    const LOCAL_IP = "35.223.247.76";
    return `http://${LOCAL_IP}:3000`;
}


const API_URL = getBaseUrl()


// Crea una instancia de axios con la configuración base
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

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

    // Crear un nuevo curso
    createCourse: async (course: Course) => {
        try {
            const response = await api.post("/courses", course)
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
}
