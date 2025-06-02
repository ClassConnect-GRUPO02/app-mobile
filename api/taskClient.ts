import { getBaseUrlCourses } from "@/api/client"
import type { Task } from "@/types/Task"
import axios from "axios"
import {getItemAsync} from "expo-secure-store";

const API_URL = getBaseUrlCourses()

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Añadir interceptores para debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error("[API Request Error]", error)
        return Promise.reject(error)
    },
)

apiClient.interceptors.request.use(
    async (config) => {
        const token = await getItemAsync('userToken');
        if (token) {
            (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const taskClient = {
    // Obtener todas las tareas de un curso
    getTasksByCourseId: async (courseId: string): Promise<Task[]> => {
        try {
            const response = await apiClient.get(`/courses/${courseId}/tasks`)
            return response.data.data
        } catch (error) {
            console.error("Error al obtener tareas:", error)
            return []
        }
    },

    // Obtener una tarea específica
    getTaskById: async (courseId: string, taskId: string): Promise<Task | null> => {
        try {
            const response = await apiClient.get(`/courses/${courseId}/tasks/${taskId}`)
            return response.data.data
        } catch (error) {
            console.error("Error al obtener tarea:", error)
            return null
        }
    },

    // Crear una nueva tarea
    createTask: async (courseId: string, taskData: Partial<Task>): Promise<Task | null> => {
        try {
            console.log("Enviando datos de tarea:", taskData)
            const response = await apiClient.post(`/courses/${courseId}/tasks`, taskData)
            return response.data.data
        } catch (error) {
            console.error("Error al crear tarea:", error)
            throw error
        }
    },

    // Actualizar una tarea existente
    updateTask: async (courseId: string, taskId: string, taskData: Partial<Task>): Promise<Task | null> => {
        try {
            const response = await apiClient.patch(`/courses/${courseId}/tasks/${taskId}`, taskData)
            return response.data.data
        } catch (error) {
            console.error("Error al actualizar tarea:", error)
            return null
        }
    },

    // Eliminar una tarea
    deleteTask: async (courseId: string, taskId: string): Promise<boolean> => {
        try {
            await apiClient.delete(`/courses/${courseId}/tasks/${taskId}`)
            return true
        } catch (error) {
            console.error("Error al eliminar tarea:", error)
            return false
        }
    },

    // Enviar una respuesta a una tarea
    submitTask: async (
        courseId: string,
        taskId: string,
        studentId: string,
        answers: Array<{ question_id: string; answer_text: string }>,
        fileUrl?: string,
    ): Promise<any> => {
        try {
            console.log("Enviando respuesta de tarea:", { student_id: studentId, answers, fileUrl })
            const response = await apiClient.post(`/courses/${courseId}/tasks/${taskId}/submissions`, {
                student_id: studentId,
                answers,
                fileUrl,
            })
            return response.data.data
        } catch (error) {
            console.error("Error al enviar respuesta:", error)
            throw error
        }
    },

    // Obtener todas las tareas asignadas a un estudiante
    getTasksByStudentId: async (studentId: string): Promise<Task[]> => {
        try {
            const response = await apiClient.get(`/tasks/students/${studentId}`)
            return response.data.data
        } catch (error) {
            console.error("Error al obtener tareas del estudiante:", error)
            return []
        }
    },

    // Obtener la entrega de una tarea específica
    getTaskSubmission: async (taskId: string, studentId: string): Promise<any> => {
        try {
            const response = await apiClient.get(`/tasks/${taskId}/submissions/${studentId}`)
            return response.data.data
        } catch (error) {
            console.error("Error al obtener entrega de tarea:", error)
            return null
        }
    },

    // Obtener todas las tareas creadas por un instructor
    getTasksByInstructorId: async (instructorId: string): Promise<any> => {
        try {
            const response = await apiClient.get(`/instructors/${instructorId}/tasks`)
            return response.data
        } catch (error) {
            console.error("Error al obtener tareas del instructor:", error)
            return { data: [] }
        }
    },

    // Obtener todas las entregas de una tarea
    getTaskSubmissions: async (courseId: string, instructorId: string, taskId: string): Promise<any[]> => {
        try {
            const response = await apiClient.get(
                `/courses/${courseId}/instructors/${instructorId}/tasks/${taskId}/submissions`,
            )
            return response.data.data
        } catch (error) {
            console.error("Error al obtener entregas de tarea:", error)
            return []
        }
    },

    // Añadir retroalimentación a una entrega
    addFeedbackToTask: async (taskId: string, studentId: string, grade: number, feedback: string): Promise<any> => {
        try {
            const response = await apiClient.patch(`/tasks/${taskId}/submissions/${studentId}/feedback`, {
                grade,
                feedback,
            })
            return response.data.data
        } catch (error) {
            console.error("Error al añadir retroalimentación:", error)
            return null
        }
    },

    // Iniciar un examen (solo para exámenes con timer)
    startExam: async (courseId: string, taskId: string): Promise<any> => {
        try {
            const response = await apiClient.post<{ data: any }>(`/courses/${courseId}/tasks/${taskId}/start-exam`)
            return response.data
        } catch (error) {
            console.error("Error al iniciar examen:", error)
            throw error
        }
    },

    // Obtener el tiempo restante de un examen
    getTaskTimer: async (taskId: string): Promise<string> => {
        try {
            const response = await apiClient.get<{ data: string }>(`/tasks/${taskId}/timer`)
            return response.data.data
        } catch (error) {
            console.error("Error al obtener timer:", error)
            throw error
        }
    },
}
