import { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Text, ActivityIndicator, Button } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import { TaskForm } from "@/components/tasks/TaskForm"
import { StatusBar } from "expo-status-bar"
import { courseClient } from "@/api/coursesClient"
import {userApi} from "@/api/userApi";
import React from "react"

export default function EditTaskScreen() {
    const { courseId, taskId } = useLocalSearchParams<{ courseId: string; taskId: string }>()
    const [loading, setLoading] = useState(true)
    const [isInstructor, setIsInstructor] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                setLoading(true)

                // Obtener el ID del usuario actual
                const userId = await userApi.getUserId()
                if (!userId) {
                    setError("No se pudo obtener el ID del usuario")
                    return
                }

                // Verificar si el usuario es docente
                try {
                    const isTeacher = await userApi.isTeacher()
                    const instructorStatus = await courseClient.isInstructorInCourse(courseId, userId)
                    setIsInstructor(isTeacher || instructorStatus)
                } catch (error) {
                    console.error("Error al verificar si es docente:", error)
                    // Por defecto, permitimos el acceso para evitar bloqueos incorrectos
                    setIsInstructor(true)
                }

                // Verificar si el usuario es el creador de la tarea
                if (taskId) {
                    try {
                        const taskData = await taskClient.getTaskById(courseId, taskId)
                        if (taskData) {
                            setIsCreator(taskData.created_by === userId)
                        }
                    } catch (error) {
                        console.error("Error al obtener tarea:", error)
                        // Por defecto, permitimos el acceso para evitar bloqueos incorrectos
                        setIsCreator(true)
                    }
                }
            } catch (error) {
                console.error("Error al verificar permisos:", error)
                setError("No se pudieron verificar tus permisos")
            } finally {
                setLoading(false)
            }
        }

        checkPermissions()
    }, [courseId, taskId])

    const handleSave = () => {
        router.back()
    }

    const handleCancel = () => {
        router.back()
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Verificando permisos...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="headlineMedium" style={styles.errorTitle}>
                    Error
                </Text>
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    if (!isInstructor && !isCreator) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="headlineMedium" style={styles.errorTitle}>
                    Acceso denegado
                </Text>
                <Text style={styles.errorText}>Solo los docentes pueden editar actividades.</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <TaskForm courseId={courseId} taskId={taskId} onSave={handleSave} onCancel={handleCancel} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    errorTitle: {
        color: "#d32f2f",
        marginBottom: 16,
    },
    errorText: {
        textAlign: "center",
        color: "#666",
        marginBottom: 24,
    },
    backButton: {
        marginTop: 16,
    },
})
