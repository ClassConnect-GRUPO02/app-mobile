import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Button, ActivityIndicator, Divider, Chip, IconButton } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { StatusBar } from "expo-status-bar"
import {userApi} from "@/api/userApi";
import React from "react"
import {TaskSubmissionForm} from "@/components/tasks/TaskSubmissionList";

export default function TaskDetailScreen() {
    const { courseId, taskId } = useLocalSearchParams<{ courseId: string; taskId: string }>()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isInstructor, setIsInstructor] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const [submission, setSubmission] = useState<any>(null)

    useEffect(() => {
        const fetchTaskAndUserStatus = async () => {
            try {
                setLoading(true)

                // Obtener el ID del usuario actual
                const userId = await userApi.getUserId()
                if (!userId) {
                    throw new Error("No se pudo obtener el ID del usuario")
                }

                // Obtener la tarea
                const taskData = await taskClient.getTaskById(courseId, taskId)
                if (!taskData) {
                    throw new Error("No se pudo cargar la tarea")
                }

                setTask(taskData)

                // Verificar si el usuario es el creador de la tarea
                setIsInstructor(taskData.created_by === userId)

                // Verificar si el usuario ya ha enviado una respuesta
                try {
                    const submissionData = await taskClient.getTaskSubmission(taskId, userId)
                    if (submissionData) {
                        setHasSubmitted(true)
                        setSubmission(submissionData)
                    }
                } catch (submissionError) {
                    console.log("No hay envíos previos para esta tarea")
                }
            } catch (err) {
                console.error("Error al cargar la tarea:", err)
                setError("No se pudo cargar la información de la tarea")
            } finally {
                setLoading(false)
            }
        }

        if (courseId && taskId) {
            fetchTaskAndUserStatus()
        }
    }, [courseId, taskId])

    const handleSubmissionComplete = () => {
        setHasSubmitted(true)
        // Recargar la página para mostrar la entrega
        router.replace({
            pathname: "/course/task/[taskId]",
            params: { courseId, taskId },
        })
    }

    const handleEditTask = () => {
        router.push({
            pathname: "/course/task/edit",
            params: { courseId, taskId },
        })
    }

    const handleDeleteTask = () => {
        Alert.alert(
            "Eliminar tarea",
            "¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true)
                            const success = await taskClient.deleteTask(courseId, taskId)
                            if (success) {
                                Alert.alert("Éxito", "La tarea ha sido eliminada correctamente", [
                                    { text: "OK", onPress: () => router.back() },
                                ])
                            } else {
                                throw new Error("No se pudo eliminar la tarea")
                            }
                        } catch (error) {
                            console.error("Error al eliminar la tarea:", error)
                            Alert.alert("Error", "No se pudo eliminar la tarea. Inténtalo de nuevo.")
                            setLoading(false)
                        }
                    },
                },
            ],
        )
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando tarea...</Text>
            </View>
        )
    }

    if (error || !task) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="headlineMedium">Tarea no encontrada</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    const renderSubmissionStatus = () => {
        if (!hasSubmitted) return null

        return (
            <View style={styles.submissionStatus}>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Estado de tu entrega
                </Text>
                <Chip icon="check-circle" style={styles.submittedChip} textStyle={{ color: "#fff" }}>
                    Entregado el {new Date(submission?.submitted_at).toLocaleDateString()}{" "}
                    {new Date(submission?.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Chip>

                {submission?.file_url && (
                    <View style={styles.filePreview}>
                        <Text variant="bodyMedium" style={styles.fileLabel}>
                            Archivo enviado:
                        </Text>
                        <Button
                            mode="outlined"
                            icon="file-document"
                            onPress={() => {
                                // Abrir el archivo en el navegador
                                window.open(submission.file_url, "_blank")
                            }}
                            style={styles.fileButton}
                        >
                            Ver archivo
                        </Button>
                    </View>
                )}

                {submission?.grade !== null && (
                    <View style={styles.gradeContainer}>
                        <Text variant="titleMedium" style={styles.gradeTitle}>
                            Calificación:
                        </Text>
                        <Text variant="headlineMedium" style={styles.grade}>
                            {submission.grade}
                        </Text>
                        {submission?.feedback && (
                            <>
                                <Text variant="titleMedium" style={styles.feedbackTitle}>
                                    Retroalimentación:
                                </Text>
                                <Text style={styles.feedback}>{submission.feedback}</Text>
                            </>
                        )}
                    </View>
                )}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={styles.backButton} />

                {isInstructor && (
                    <View style={styles.actionButtons}>
                        <IconButton icon="pencil" size={24} onPress={handleEditTask} />
                        <IconButton icon="delete" size={24} onPress={handleDeleteTask} />
                    </View>
                )}
            </View>

            {hasSubmitted ? (
                <ScrollView>
                    <View style={styles.taskInfo}>
                        <Text variant="headlineSmall" style={styles.taskTitle}>
                            {task.title}
                        </Text>

                        <Chip
                            style={[styles.typeChip, { backgroundColor: task.type === "tarea" ? "#e3f2fd" : "#fff3e0" }]}
                            textStyle={{ color: task.type === "tarea" ? "#1976d2" : "#e65100" }}
                        >
                            {task.type === "tarea" ? "Tarea" : "Examen"}
                        </Chip>

                        <Text style={styles.dueDate}>
                            Fecha de entrega: {new Date(task.due_date).toLocaleDateString()}{" "}
                            {new Date(task.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>

                        <Divider style={styles.divider} />

                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Descripción
                        </Text>
                        <Text style={styles.description}>{task.description}</Text>

                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Instrucciones
                        </Text>
                        <Text style={styles.instructions}>{task.instructions}</Text>

                        {renderSubmissionStatus()}
                    </View>
                </ScrollView>
            ) : (
                <TaskSubmissionForm task={task} courseId={courseId} onSubmissionComplete={handleSubmissionComplete} />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 8,
        paddingHorizontal: 8,
    },
    actionButtons: {
        flexDirection: "row",
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
    errorText: {
        color: "#d32f2f",
        marginVertical: 16,
    },
    taskInfo: {
        padding: 16,
    },
    taskTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    typeChip: {
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    dueDate: {
        color: "#666",
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    description: {
        marginBottom: 16,
        lineHeight: 22,
    },
    instructions: {
        lineHeight: 22,
    },
    backButton: {
        marginTop: 16,
    },
    submissionStatus: {
        marginTop: 16,
    },
    submittedChip: {
        backgroundColor: "#4caf50",
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    filePreview: {
        marginTop: 8,
    },
    fileLabel: {
        marginBottom: 8,
    },
    fileButton: {
        alignSelf: "flex-start",
    },
    gradeContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
    },
    gradeTitle: {
        fontWeight: "bold",
    },
    grade: {
        color: "#2e7d32",
        fontWeight: "bold",
        marginVertical: 8,
    },
    feedbackTitle: {
        fontWeight: "bold",
        marginTop: 16,
        marginBottom: 8,
    },
    feedback: {
        lineHeight: 22,
    },
})
