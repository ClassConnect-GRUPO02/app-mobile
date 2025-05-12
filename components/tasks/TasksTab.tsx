import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
import { Text, Card, Button, ActivityIndicator, Chip, FAB } from "react-native-paper"
import { router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { courseClient } from "@/api/coursesClient"
import {userApi} from "@/api/userApi";
import React from "react"

export const TasksTab = ({ courseId }: { courseId: string }) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [isInstructor, setIsInstructor] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)

    useEffect(() => {
        loadTasks()
    }, [courseId])

    const loadTasks = async () => {
        try {
            setLoading(true)

            // Obtener el ID del usuario actual
            const userId = await userApi.getUserId()
            if (!userId) {
                throw new Error("No se pudo obtener el ID del usuario")
            }

            // Verificar si el usuario es docente
            try {
                const isTeacher = await userApi.isTeacher()
                const instructorStatus = await courseClient.isInstructorInCourse(courseId, userId)
                setIsInstructor(isTeacher || instructorStatus)
            } catch (error) {
                console.error("Error al verificar si es docente:", error)
                setIsInstructor(false)
            }

            // Si no es instructor, verificar si está inscrito en el curso
            if (!isInstructor) {
                try {
                    const enrollmentStatus = await courseClient.isEnrolledInCourse(courseId, userId)
                    setIsEnrolled(enrollmentStatus)
                } catch (error) {
                    console.error("Error al verificar inscripción:", error)
                    // Por defecto, asumimos que está inscrito para evitar bloqueos incorrectos
                    setIsEnrolled(true)
                }
            }

            // Obtener las tareas del curso
            const tasksData = await taskClient.getTasksByCourseId(courseId)
            setTasks(tasksData)
        } catch (error) {
            console.error("Error al cargar tareas:", error)
            Alert.alert("Error", "No se pudieron cargar las tareas")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadTasks()
    }

    const handleTaskPress = (taskId: string) => {
        router.push({
            pathname: "/course/task/[taskId]",
            params: { courseId, taskId },
        })
    }

    const handleCreateTask = () => {
        router.push({
            pathname: "/course/task/create",
            params: { courseId },
        })
    }

    const renderTaskItem = ({ item }: { item: Task }) => {
        const dueDate = new Date(item.due_date)
        const isOverdue = dueDate < new Date() && !item.allow_late

        return (
            <Card style={styles.taskCard} onPress={() => handleTaskPress(item.id)}>
                <Card.Content>
                    <View style={styles.taskHeader}>
                        <Text variant="titleMedium" style={styles.taskTitle}>
                            {item.title}
                        </Text>
                        <Chip
                            style={[styles.typeChip, { backgroundColor: item.type === "tarea" ? "#e3f2fd" : "#fff3e0" }]}
                            textStyle={{ color: item.type === "tarea" ? "#1976d2" : "#e65100" }}
                        >
                            {item.type === "tarea" ? "Tarea" : "Examen"}
                        </Chip>
                    </View>

                    <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.taskFooter}>
                        <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
                            Fecha límite: {dueDate.toLocaleDateString()}
                        </Text>

                        {!item.published && (
                            <Chip icon="eye-off" style={styles.draftChip}>
                                Borrador
                            </Chip>
                        )}
                    </View>
                </Card.Content>
            </Card>
        )
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando tareas...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {isInstructor && (
                <Button mode="contained" icon="plus" onPress={handleCreateTask} style={styles.createButton}>
                    Crear nueva tarea
                </Button>
            )}

            {tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium">No hay tareas disponibles</Text>
                    <Text style={styles.emptyText}>
                        {isInstructor
                            ? "Crea una nueva tarea para este curso."
                            : "El instructor aún no ha creado tareas para este curso."}
                    </Text>
                    {isInstructor && (
                        <Button mode="contained" icon="plus" onPress={handleCreateTask} style={styles.emptyButton}>
                            Crear tarea
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            )}

            {isInstructor && <FAB icon="plus" style={styles.fab} onPress={handleCreateTask} />}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    taskCard: {
        marginBottom: 16,
        borderRadius: 8,
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    taskTitle: {
        flex: 1,
        marginRight: 8,
    },
    typeChip: {
        height: 28,
    },
    taskDescription: {
        color: "#666",
        marginBottom: 12,
    },
    taskFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dueDate: {
        fontSize: 12,
        color: "#666",
    },
    overdue: {
        color: "#d32f2f",
    },
    draftChip: {
        backgroundColor: "#f5f5f5",
        height: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyText: {
        textAlign: "center",
        color: "#666",
        marginTop: 8,
        marginBottom: 24,
    },
    emptyButton: {
        marginTop: 16,
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: "#6200ee",
    },
    createButton: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: "#6200ee",
    },
})
