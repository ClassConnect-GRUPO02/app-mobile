import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { Text, Button, Card, Divider, ActivityIndicator, Chip } from "react-native-paper"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { GestureHandlerRootView } from "react-native-gesture-handler"
// Update the task detail screen to render HTML content for instructions
import { WebView } from "react-native-webview"
import {userApi} from "@/api/userApi";
import React from "react"

export default function TaskDetailScreen() {
    const { taskId, courseId } = useLocalSearchParams<{ taskId: string; courseId: string }>()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreator, setIsCreator] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchTaskAndCheckPermissions = async () => {
            try {
                setLoading(true)

                if (!taskId || !courseId) {
                    setError("Parámetros de ruta incompletos")
                    return
                }

                // Get current user ID
                const currentUserId = await userApi.getUserId()
                setUserId(currentUserId)

                // Fetch task details
                const taskData = await taskClient.getTaskById(courseId, taskId)
                if (!taskData) {
                    setError("No se pudo cargar la tarea")
                    return
                }

                setTask(taskData)
                setIsCreator(taskData.created_by === currentUserId)
            } catch (err) {
                console.error("Error al cargar la tarea:", err)
                setError("No se pudo cargar la tarea")
            } finally {
                setLoading(false)
            }
        }

        fetchTaskAndCheckPermissions()
    }, [taskId, courseId])

    const handleEdit = () => {
        router.push({
            pathname: "/course/task/edit",
            params: { taskId, courseId },
        })
    }

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Actividad",
            "¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (!courseId || !taskId) return

                            await taskClient.deleteTask(courseId, taskId)
                            Alert.alert("Éxito", "La actividad ha sido eliminada correctamente", [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        router.push({
                                            pathname: "/course/[id]",
                                            params: { id: courseId },
                                        })
                                    },
                                },
                            ])
                        } catch (error) {
                            console.error("Error al eliminar la actividad:", error)
                            Alert.alert("Error", "No se pudo eliminar la actividad. Inténtalo de nuevo.")
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
                <Text style={styles.loadingText}>Cargando actividad...</Text>
            </View>
        )
    }

    if (error || !task) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="titleMedium" style={styles.errorText}>
                    {error || "No se pudo cargar la actividad"}
                </Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.header}>
                            <Text variant="headlineSmall" style={styles.title}>
                                {task.title}
                            </Text>
                            <Chip icon={task.type === "tarea" ? "file-document" : "clipboard-text"} style={styles.typeChip}>
                                {task.type === "tarea" ? "Tarea" : "Examen"}
                            </Chip>
                        </View>

                        <Divider style={styles.divider} />

                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Descripción
                        </Text>
                        <Text style={styles.description}>{task.description}</Text>

                        {/* Replace the instructions Text component with a WebView to render HTML */}
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Instrucciones
                        </Text>
                        <View style={styles.instructionsContainer}>
                            <WebView
                                originWhitelist={["*"]}
                                source={{
                                    html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <style>
                        body {
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          margin: 0;
                          padding: 8px;
                          color: #333;
                          font-size: 16px;
                          line-height: 1.5;
                        }
                      </style>
                    </head>
                    <body>
                      ${task.instructions}
                    </body>
                    </html>
                  `,
                                }}
                                style={styles.instructionsWebView}
                                scrollEnabled={true}
                            />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Detalles
                            </Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Fecha de entrega:</Text>
                                <Text style={styles.detailValue}>{new Date(task.due_date).toLocaleDateString()}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Entregas tardías:</Text>
                                <Text style={styles.detailValue}>{task.allow_late ? "Permitidas" : "No permitidas"}</Text>
                            </View>

                            {task.allow_late && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Política de entregas tardías:</Text>
                                    <Text style={styles.detailValue}>
                                        {task.late_policy === "ninguna"
                                            ? "Sin penalización"
                                            : task.late_policy === "descontar"
                                                ? "Reducción de calificación"
                                                : "Aceptar sin condiciones"}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Formato de respuesta:</Text>
                                <Text style={styles.detailValue}>
                                    {task.answer_format === "texto"
                                        ? "Texto"
                                        : task.answer_format === "opcion_multiple"
                                            ? "Opciones múltiples"
                                            : task.answer_format === "archivo"
                                                ? "Archivo"
                                                : "Mixto"}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Subida de archivos:</Text>
                                <Text style={styles.detailValue}>{task.allow_file_upload ? "Permitida" : "No permitida"}</Text>
                            </View>

                            {task.type === "examen" && task.has_timer && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Tiempo límite:</Text>
                                    <Text style={styles.detailValue}>{task.time_limit_minutes} minutos</Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Estado:</Text>
                                <Text style={task.published ? styles.published : styles.draft}>
                                    {task.published ? "Publicado" : "Borrador"}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>

                    {isCreator && (
                        <Card.Actions style={styles.actions}>
                            <Button mode="outlined" onPress={handleEdit} style={styles.actionButton}>
                                Editar
                            </Button>
                            <Button mode="outlined" onPress={handleDelete} style={[styles.actionButton, styles.deleteButton]}>
                                Eliminar
                            </Button>
                        </Card.Actions>
                    )}
                </Card>
            </ScrollView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 8,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    typeChip: {
        alignSelf: "flex-start",
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
    },
    instructionsContainer: {
        height: 200,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        overflow: "hidden",
    },
    instructionsWebView: {
        backgroundColor: "#f9f9f9",
    },
    instructions: {
        marginBottom: 16,
    },
    detailsContainer: {
        marginTop: 8,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailLabel: {
        fontWeight: "bold",
    },
    detailValue: {},
    published: {
        color: "#4caf50",
    },
    draft: {
        color: "#ff9800",
    },
    actions: {
        justifyContent: "flex-end",
        paddingTop: 8,
    },
    actionButton: {
        marginLeft: 8,
    },
    deleteButton: {
        borderColor: "#d32f2f",
        color: "#d32f2f",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    errorText: {
        color: "#d32f2f",
        marginBottom: 16,
        textAlign: "center",
    },
    backButton: {
        marginTop: 16,
    },
})
