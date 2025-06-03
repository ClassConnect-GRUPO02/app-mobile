import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
import { Text, Card, Button, ActivityIndicator, Chip, FAB, SegmentedButtons } from "react-native-paper"
import { router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"
import React from "react"

export const TasksTab = ({ courseId }: { courseId: string }) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [isInstructor, setIsInstructor] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [activeTab, setActiveTab] = useState<"tareas" | "examenes">("tareas")

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
            params: { courseId, type: activeTab === "tareas" ? "tarea" : "examen" },
        })
    }

    // Filtrar tareas según la pestaña activa
    const filteredTasks = tasks.filter((task) => {
        if (activeTab === "tareas") {
            return task.type === "tarea"
        } else {
            return task.type === "examen"
        }
    })

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
                        {!item.published && (
                            <Chip icon="eye-off" style={styles.draftChip}>
                                Borrador
                            </Chip>
                        )}
                    </View>

                    <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.taskFooter}>
                        <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
                            Fecha límite: {dueDate.toLocaleDateString()}
                        </Text>

                        <View style={styles.taskFeatures}>
                            {item.has_timer && (
                                <Chip icon="timer" style={styles.featureChip}>
                                    {item.time_limit_minutes} min
                                </Chip>
                            )}

                            {item.allow_file_upload && (
                                <Chip icon="file-upload" style={styles.featureChip}>
                                    Archivos
                                </Chip>
                            )}
                        </View>
                    </View>
                </Card.Content>
            </Card>
        )
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando actividades...</Text>
            </View>
        )
    }

    const emptyMessage = isInstructor
        ? `No has creado ${activeTab === "tareas" ? "tareas" : "exámenes"} para este curso.`
        : `No hay ${activeTab === "tareas" ? "tareas" : "exámenes"} disponibles en este curso.`

    return (
        <View style={styles.container}>
            {/* Tabs para separar tareas y exámenes */}
            <SegmentedButtons
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "tareas" | "examenes")}
                buttons={[
                    {
                        value: "tareas",
                        label: `📝 Tareas (${tasks.filter((t) => t.type === "tarea").length})`,
                    },
                    {
                        value: "examenes",
                        label: `📋 Exámenes (${tasks.filter((t) => t.type === "examen").length})`,
                    },
                ]}
                style={styles.segmentedButtons}
            />

            {isInstructor && (
                <Button mode="contained" icon="plus" onPress={handleCreateTask} style={styles.createButton}>
                    Crear {activeTab === "tareas" ? "tarea" : "examen"}
                </Button>
            )}

            {filteredTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium">No hay {activeTab === "tareas" ? "tareas" : "exámenes"} disponibles</Text>
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                    {isInstructor && (
                        <Button mode="contained" icon="plus" onPress={handleCreateTask} style={styles.emptyButton}>
                            Crear {activeTab === "tareas" ? "tarea" : "examen"}
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    showsVerticalScrollIndicator={false}
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
    segmentedButtons: {
        margin: 16,
        marginBottom: 8,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 80,
    },
    taskCard: {
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: "#fff",
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
    draftChip: {
        backgroundColor: "#f5f5f5",
        height: 24,
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
    taskFeatures: {
        flexDirection: "row",
    },
    featureChip: {
        marginLeft: 4,
        height: 24,
        backgroundColor: "#e8f5e9",
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
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: "#6200ee",
    },
})
