import { getBaseUrlCourses } from "./client";
import axios from "axios";
import { getItemAsync } from "expo-secure-store";

const API_URL = getBaseUrlCourses();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getItemAsync("userToken");
    if (token) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tipos (pueden ir en otro archivo si preferís)
export interface TrendStats {
  date: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionRate: number;
  examSubmissionRate: number;
}

export interface GlobalStats {
  instructorId?: string;
  courseId?: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionsRate: number;
  examSubmissionsRate: number;
  trends: TrendStats[];
}

export interface StudentStatsSummary {
  studentId: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionRate: number;
  examSubmissionRate: number;
}

export interface Submission {
  taskId: string;
  taskTitle: string;
  type: string;
  grade: number;
  submitted_at: string;
  status: string;
}

export interface StudentStatsDetail {
  studentId: string;
  courseId: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionRate: number;
  examSubmissionRate: number;
  submissions: Submission[];
}

// Cliente
export const statisticsClient = {
  // Estadísticas globales del instructor
  getInstructorStats: async (instructorId: string): Promise<GlobalStats | null> => {
    try {
      const response = await apiClient.get<{ data: GlobalStats }>(`/stats/${instructorId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching stats for instructor ${instructorId}:`, error);
      return null;
    }
  },

  // Estadísticas del curso (con opcional from / to)
  getCourseStats: async (
    courseId: string,
    from?: string,
    to?: string
  ): Promise<GlobalStats | null> => {
    try {
      const params = { from, to };
      const response = await apiClient.get<{ data: GlobalStats }>(
        `/courses/${courseId}/stats`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching stats for course ${courseId}:`, error);
      return null;
    }
  },

  // Estadísticas generales de los estudiantes del curso
  getCourseStudentsStats: async (
    courseId: string,
    from?: string,
    to?: string
  ): Promise<StudentStatsSummary[]> => {
    try {
      const params = { from, to };
      const response = await apiClient.get<{ data: StudentStatsSummary[] }>(
        `/courses/${courseId}/stats/students`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching student stats for course ${courseId}:`, error);
      return [];
    }
  },

  // Estadísticas detalladas de un estudiante específico
  getStudentStatsInCourse: async (
    courseId: string,
    studentId: string,
    from?: string,
    to?: string
  ): Promise<StudentStatsDetail | null> => {
    try {
      const params = { from, to };
      const response = await apiClient.get<{ data: StudentStatsDetail }>(
        `/courses/${courseId}/stats/students/${studentId}`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching detailed stats for student ${studentId} in course ${courseId}:`,
        error
      );
      return null;
    }
  },
};
