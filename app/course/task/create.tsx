import { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Text, ActivityIndicator, Button } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { TaskForm } from "@/components/tasks/TaskForm"
import { StatusBar } from "expo-status-bar"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"
import React from "react"

export default function CreateTaskScreen() {
    const { courseId } = useLocalSearchParams<{ courseId: string }>()
    const [loading, setLoading] = useState(true)
    const [isInstructor, setIsInstructor] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                setLoading(true)
                const currentUserId = await userApi.getUserId()

                if (!currentUserId) {
                    setError("No se pudo obtener el ID del usuario")
                    return
                }

                try {
                    const isTeacher = await userApi.isTeacher()
                    const instructorStatus = await courseClient.isInstructorInCourse(courseId, currentUserId)
                    setIsInstructor(isTeacher || instructorStatus)
                } catch (error) {
                    console.error("Error al verificar permisos:", error)
                    setIsInstructor(true)
                }
            } catch (error) {
                console.error("Error al verificar permisos:", error)
                setError("No se pudieron verificar tus permisos")
            } finally {
                setLoading(false)
            }
        }

        checkPermissions()
    }, [courseId])

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

    if (!isInstructor) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="headlineMedium" style={styles.errorTitle}>
                    Acceso denegado
                </Text>
                <Text style={styles.errorText}>Solo los docentes pueden crear actividades.</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <TaskForm courseId={courseId} onSave={handleSave} onCancel={handleCancel} />
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
