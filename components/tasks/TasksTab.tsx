import React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert } from "react-native"
import { Text, Button, Card, IconButton, ActivityIndicator, Chip, Divider, FAB } from "react-native-paper"
import { router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {userApi} from "@/api/userApi";

interface TasksTabProps {
    courseId: string
}

export const TasksTab: React.FC<TasksTabProps> = ({ courseId }) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreator, setIsCreator] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchTasksAndCheckPermissions = async () => {
            try {
                setLoading(true)

                // Get current user ID
                const currentUserId = await userApi.getUserId()
                setUserId(currentUserId)

                // Fetch tasks
                console.log(`Fetching tasks for course: ${courseId}`)
                const tasksData = await taskClient.getTasksByCourseId(courseId)
                console.log(`Tasks response:`, tasksData)
                setTasks(tasksData || [])

                // Check if user is the course creator
                try {
                    console.log(`Checking if user ${currentUserId} is creator of course ${courseId}`)
                    const courseResponse = await fetch(`http://35.223.247.76:3000/courses/${courseId}`)
                    const courseData = await courseResponse.json()

                    console.log("Course data:", courseData)

                    // Check if the response has the expected structure
                    if (courseData && courseData.creatorId) {
                        setIsCreator(courseData.creatorId === currentUserId)
                        console.log(`User is creator: ${courseData.creatorId === currentUserId}`)
                    } else {
                        console.error("Invalid course data structure:", courseData)
                    }
                } catch (err) {
                    console.error("Error checking course creator:", err)
                }
            } catch (err) {
                console.error("Error fetching tasks:", err)
                setError("No se pudieron cargar las tareas")
            } finally {
                setLoading(false)
            }
        }

        fetchTasksAndCheckPermissions()
    }, [courseId])

    // Simplemente navegar a la pantalla de creación sin hacer ninguna solicitud
    const handleCreateTask = () => {
        // Usar href para una navegación más directa
        router.push(`/course/task/create?courseId=${courseId}`)
    }

    const handleEditTask = (taskId: string) => {
        router.push({
            pathname: "/course/task/edit",
            params: { taskId, courseId },
        })
    }

    const handleViewTask = (taskId: string) => {
        router.push({
            pathname: "/course/task/[taskId]",
            params: { taskId, courseId },
        })
    }

    const handleDeleteTask = (taskId: string) => {
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
                            await taskClient.deleteTask(courseId, taskId)
                            setTasks(tasks.filter((task) => task.id !== taskId))
                            Alert.alert("Éxito", "La actividad ha sido eliminada correctamente")
                        } catch (error) {
                            console.error("Error al eliminar la actividad:", error)
                            Alert.alert("Error", "No se pudo eliminar la actividad. Inténtalo de nuevo.")
                        }
                    },
                },
            ],
        )
    }

    const renderTaskItem = ({ item }: { item: Task }) => {
        const isTaskCreator = item.created_by === userId
        const canEdit = isCreator || isTaskCreator

        return (
            <Card style={styles.taskCard} mode="outlined">
                <Card.Content>
                    <View style={styles.taskHeader}>
                        <View>
                            <Text variant="titleMedium">{item.title}</Text>
                            <Chip icon={item.type === "tarea" ? "file-document" : "clipboard-text"} style={styles.typeChip}>
                                {item.type === "tarea" ? "Tarea" : "Examen"}
                            </Chip>
                        </View>
                        {canEdit && (
                            <View style={styles.actionButtons}>
                                <IconButton icon="pencil" size={20} onPress={() => handleEditTask(item.id)} />
                                <IconButton icon="delete" size={20} onPress={() => handleDeleteTask(item.id)} />
                            </View>
                        )}
                    </View>

                    <Divider style={styles.divider} />

                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.taskFooter}>
                        <Text variant="bodySmall">Fecha límite: {new Date(item.due_date).toLocaleDateString()}</Text>
                        <Text variant="bodySmall" style={item.published ? styles.published : styles.draft}>
                            {item.published ? "Publicado" : "Borrador"}
                        </Text>
                    </View>
                </Card.Content>
                <Card.Actions>
                    <Button mode="text" onPress={() => handleViewTask(item.id)}>
                        Ver detalles
                    </Button>
                </Card.Actions>
            </Card>
        )
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando tareas...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="titleMedium" style={styles.errorText}>
                    {error}
                </Text>
            </View>
        )
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            {tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium">No hay actividades disponibles</Text>
                    <Text style={styles.emptyText}>
                        {isCreator
                            ? "Crea una nueva actividad para este curso."
                            : "El instructor aún no ha creado actividades para este curso."}
                    </Text>
                    {isCreator && (
                        <Button mode="contained" icon="plus" onPress={handleCreateTask} style={styles.createButton}>
                            Crear Actividad
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {isCreator && tasks.length > 0 && <FAB icon="plus" style={styles.fab} onPress={handleCreateTask} />}
        </GestureHandlerRootView>
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
    },
    createButton: {
        marginTop: 16,
    },
    listContent: {
        padding: 16,
    },
    taskCard: {
        marginBottom: 16,
        borderRadius: 8,
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    typeChip: {
        alignSelf: "flex-start",
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: "row",
    },
    divider: {
        marginVertical: 8,
    },
    description: {
        marginBottom: 8,
        color: "#666",
    },
    taskFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    published: {
        color: "#4caf50",
    },
    draft: {
        color: "#ff9800",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 8,
        color: "#666",
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: "#6200ee",
    },
})
