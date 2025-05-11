import {getBaseUrlCourses} from "@/api/client"
import type { Task, TaskSubmission, TaskWithSubmissionCount } from "@/types/Task"
import axios from "axios";

const API_URL = getBaseUrlCourses()

// Crea una instancia de axios con la configuración base
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

export const taskClient = {
    // Get all tasks for a course
    getTasksByCourseId: async (courseId: string): Promise<Task[]> => {
        try {
            console.log("Fetching tasks for course:", courseId)
            const response = await apiClient.get<{ data: Task[] }>(`/courses/${courseId}/tasks`)
            console.log("Tasks response:", response)
            return response.data.data || []
        } catch (error) {
            console.error(`Error fetching tasks for course ${courseId}:`, error)
            return []
        }
    },

    // Get a specific task by ID
    getTaskById: async (courseId: string, taskId: string): Promise<Task | null> => {
        try {
            console.log(`Fetching task ${taskId} for course ${courseId}`)
            const response = await apiClient.get<{ data: Task }>(`/courses/${courseId}/tasks/${taskId}`)
            return response.data.data
        } catch (error) {
            console.error(`Error fetching task ${taskId} for course ${courseId}:`, error)
            return null
        }
    },

    // Create a new task
    createTask: async (courseId: string, task: any): Promise<Task | null> => {
        try {
            console.log("Creating task with data:", JSON.stringify(task, null, 2))

            // Ensure we're not sending an id field
            const { id, ...taskWithoutId } = task

            const response = await apiClient.post<{ data: Task }>(`/courses/${courseId}/tasks`, taskWithoutId)
            console.log("Create task response:", response)
            return response.data.data
        } catch (error) {
            console.error(`Error creating task for course ${courseId}:`, error)
            throw error
        }
    },

    // Update an existing task
    updateTask: async (courseId: string, taskId: string, task: Partial<Task>): Promise<Task | null> => {
        try {
            const response = await apiClient.patch<{ data: Task }>(`/courses/${courseId}/tasks/${taskId}`, task)
            return response.data.data
        } catch (error) {
            console.error(`Error updating task ${taskId} for course ${courseId}:`, error)
            return null
        }
    },

    // Delete a task
    deleteTask: async (courseId: string, taskId: string): Promise<boolean> => {
        try {
            await apiClient.delete(`/courses/${courseId}/tasks/${taskId}`)
            return true
        } catch (error) {
            console.error(`Error deleting task ${taskId} from course ${courseId}:`, error)
            return false
        }
    },

    // Submit a task
    submitTask: async (
        courseId: string,
        taskId: string,
        studentId: string,
        answers: string[],
        fileUrl?: string,
    ): Promise<TaskSubmission | null> => {
        try {
            const response = await apiClient.post<{ data: TaskSubmission }>(
                `/courses/${courseId}/tasks/${taskId}/submissions`,
                {
                    student_id: studentId,
                    answers,
                    fileUrl: fileUrl || "",
                },
            )
            return response.data.data
        } catch (error) {
            console.error(`Error submitting task ${taskId} for course ${courseId}:`, error)
            return null
        }
    },

    // Get tasks by instructor ID (with pagination)
    getTasksByInstructorId: async (
        instructorId: string,
        page = 1,
        pageSize = 10,
    ): Promise<{
        total: number
        page: number
        pageSize: number
        totalPages: number
        data: TaskWithSubmissionCount[]
    }> => {
        try {
            const response = await apiClient.get<{
                total: number
                page: number
                pageSize: number
                totalPages: number
                data: TaskWithSubmissionCount[]
            }>(`/instructors/${instructorId}/tasks?page=${page}&pageSize=${pageSize}`)
            return response.data
        } catch (error) {
            console.error(`Error fetching tasks for instructor ${instructorId}:`, error)
            return {
                total: 0,
                page: 1,
                pageSize: 10,
                totalPages: 0,
                data: [],
            }
        }
    },

    // Get tasks by student ID
    getTasksByStudentId: async (studentId: string): Promise<Task[]> => {
        try {
            const response = await apiClient.get<{ data: Task[] }>(`/students/${studentId}/tasks`)
            return response.data.data || []
        } catch (error) {
            console.error(`Error fetching tasks for student ${studentId}:`, error)
            return []
        }
    },
}