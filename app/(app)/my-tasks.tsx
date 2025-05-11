import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, ActivityIndicator, Searchbar, Chip, Button, Card, Divider } from "react-native-paper"
import { router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {userApi} from "@/api/userApi";
import React from "react"

export default function MyTasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [userType, setUserType] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed" | "overdue">("all")

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true)

                // Get user ID and type
                const userId = await userApi.getUserId()
                if (!userId) {
                    throw new Error("No se pudo obtener el ID del usuario")
                }

                const userInfo = await userApi.getUserById(userId)
                const userTypeValue = userInfo?.user?.userType
                setUserType(userTypeValue)

                // Get tasks based on user type
                let tasksData: Task[] = []
                if (userTypeValue === "docente") {
                    // For teachers, get tasks they created
                    const response = await taskClient.getTasksByInstructorId(userId)
                    tasksData = response.data
                } else if (userTypeValue === "alumno") {
                    // For students, get tasks assigned to them
                    tasksData = await taskClient.getTasksByStudentId(userId)
                }

                setTasks(tasksData)
                setFilteredTasks(tasksData)
            } catch (err) {
                console.error("Error al cargar las tareas:", err)
                setError("No se pudieron cargar las tareas")
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
    }, [])

    useEffect(() => {
        // Apply filters and search
        let result = [...tasks]
        const now = new Date()

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
            )
        }

        // Apply status filter
        if (activeFilter !== "all") {
            if (activeFilter === "pending") {
                // Pending: due date is in the future
                result = result.filter((task) => {
                    const dueDate = new Date(task.due_date)
                    return dueDate > now
                })
            } else if (activeFilter === "overdue") {
                // Overdue: due date is in the past
                result = result.filter((task) => {
                    const dueDate = new Date(task.due_date)
                    return dueDate < now
                })
            } else if (activeFilter === "completed") {
                // Completed: has submission (this would need to be implemented with actual submission data)
                // For now, we'll just show a placeholder
                result = []
            }
        }

        setFilteredTasks(result)
    }, [tasks, searchQuery, activeFilter])

    const handleTaskPress = (task: Task) => {
        router.push({
            pathname: "/course/task/[taskId]",
            params: { taskId: task.id, courseId: task.course_id },
        })
    }

    const renderTaskItem = ({ item }: { item: Task }) => {
        const dueDate = new Date(item.due_date)
        const isOverdue = dueDate < new Date()

        return (
            <Card style={styles.taskCard} onPress={() => handleTaskPress(item)}>
                <Card.Content>
                    <View style={styles.taskHeader}>
                        <Text variant="titleMedium">{item.title}</Text>
                        <Chip style={[styles.statusChip, { backgroundColor: item.type === "tarea" ? "#e3f2fd" : "#fff8e1" }]}>
                            {item.type === "tarea" ? "Tarea" : "Examen"}
                        </Chip>
                    </View>

                    <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <Divider style={styles.divider} />

                    <View style={styles.taskFooter}>
                        <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
                            Fecha límite: {dueDate.toLocaleDateString()}
                        </Text>
                        {isOverdue && <Text style={styles.overdue}>Vencido</Text>}
                    </View>
                </Card.Content>
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

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    {userType === "docente" ? "Mis Actividades Creadas" : "Mis Tareas y Exámenes"}
                </Text>

                <Searchbar
                    placeholder="Buscar actividades..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                <View style={styles.filterContainer}>
                    <Button
                        mode={activeFilter === "all" ? "contained" : "outlined"}
                        onPress={() => setActiveFilter("all")}
                        style={styles.filterButton}
                        compact
                    >
                        Todas
                    </Button>
                    <Button
                        mode={activeFilter === "pending" ? "contained" : "outlined"}
                        onPress={() => setActiveFilter("pending")}
                        style={styles.filterButton}
                        compact
                    >
                        Pendientes
                    </Button>
                    <Button
                        mode={activeFilter === "overdue" ? "contained" : "outlined"}
                        onPress={() => setActiveFilter("overdue")}
                        style={styles.filterButton}
                        compact
                    >
                        Vencidas
                    </Button>
                    <Button
                        mode={activeFilter === "completed" ? "contained" : "outlined"}
                        onPress={() => setActiveFilter("completed")}
                        style={styles.filterButton}
                        compact
                    >
                        Completadas
                    </Button>
                </View>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Button mode="contained" onPress={() => setLoading(true)} style={styles.retryButton}>
                        Reintentar
                    </Button>
                </View>
            ) : filteredTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium" style={styles.emptyText}>
                        {searchQuery
                            ? "No se encontraron actividades que coincidan con tu búsqueda"
                            : activeFilter !== "all"
                                ? `No hay actividades ${
                                    activeFilter === "pending" ? "pendientes" : activeFilter === "overdue" ? "vencidas" : "completadas"
                                }`
                                : userType === "docente"
                                    ? "No has creado ninguna actividad aún"
                                    : "No tienes tareas o exámenes asignados"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        padding: 16,
        backgroundColor: "#fff",
    },
    title: {
        fontWeight: "bold",
        marginBottom: 16,
    },
    searchBar: {
        marginBottom: 16,
        elevation: 0,
    },
    filterContainer: {
        flexDirection: "row",
        marginBottom: 8,
    },
    filterButton: {
        marginRight: 8,
        marginBottom: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
    retryButton: {
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    emptyText: {
        textAlign: "center",
        color: "#666",
    },
    listContent: {
        padding: 16,
    },
    taskCard: {
        marginBottom: 16,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    statusChip: {
        height: 28,
    },
    taskDescription: {
        color: "#666",
        marginBottom: 8,
    },
    divider: {
        marginVertical: 8,
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
})
