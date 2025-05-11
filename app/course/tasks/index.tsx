import { useState, useEffect } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { Text, ActivityIndicator, FAB, Searchbar, Button, SegmentedButtons } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { TaskList } from "@/components/tasks/TaskList"
import { StatusBar } from "expo-status-bar"
import {userApi} from "@/api/userApi";
import React from "react"

export default function TasksScreen() {
    const { courseId } = useLocalSearchParams<{ courseId: string }>()
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userType, setUserType] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<"all" | "tarea" | "examen">("all")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "overdue" | "upcoming">("all")

    useEffect(() => {
        const fetchTasksAndUserType = async () => {
            try {
                setLoading(true)

                const userId = await userApi.getUserId()
                if (!userId) {
                    throw new Error("No se pudo obtener el ID del usuario")
                }

                const userInfo = await userApi.getUserById(userId)
                const userTypeValue = userInfo?.user?.userType || null
                setUserType(userTypeValue)

                let taskData: Task[] = []
                if (courseId) {
                    taskData = await taskClient.getTasksByCourseId(courseId)
                } else if (userTypeValue === "docente") {
                    const response = await taskClient.getTasksByInstructorId(userId)
                    taskData = response.data
                } else if (userTypeValue === "alumno") {
                    taskData = await taskClient.getTasksByStudentId(userId)
                }

                setTasks(taskData)
                setFilteredTasks(taskData)
            } catch (err) {
                console.error("Error al cargar las tareas:", err)
                setError("No se pudieron cargar las tareas")
            } finally {
                setLoading(false)
            }
        }

        fetchTasksAndUserType()
    }, [courseId])

    useEffect(() => {
        let result = [...tasks]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
            )
        }

        if (filterType !== "all") {
            result = result.filter((task) => task.type === filterType)
        }

        if (filterStatus !== "all") {
            const now = new Date()

            if (filterStatus === "active") {
                result = result.filter((task) => {
                    const dueDate = new Date(task.due_date)
                    return task.published && dueDate >= now
                })
            } else if (filterStatus === "overdue") {
                result = result.filter((task) => {
                    const dueDate = new Date(task.due_date)
                    return task.published && dueDate < now
                })
            } else if (filterStatus === "upcoming") {
                result = result.filter((task) => {
                    const dueDate = new Date(task.due_date)
                    const diffTime = dueDate.getTime() - now.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return task.published && diffDays > 7
                })
            }
        }

        setFilteredTasks(result)
    }, [tasks, searchQuery, filterType, filterStatus])

    const handleAddTask = () => {
        if (courseId) {
            router.push({
                pathname: "/course/task/edit",
                params: { courseId },
            })
        } else {
            Alert.alert("Error", "Debes seleccionar un curso para crear una tarea")
        }
    }

    const handleEditTask = (task: Task) => {
        router.push({
            pathname: "/course/task/edit",
            params: { taskId: task.id, courseId: task.course_id },
        })
    }

    const handleDeleteTask = (taskId: string) => {
        Alert.alert(
            "Eliminar actividad",
            "¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const taskToDelete = tasks.find((t) => t.id === taskId)
                            if (!taskToDelete) return

                            const success = await taskClient.deleteTask(taskToDelete.course_id, taskId)
                            if (success) {
                                // Update the tasks list
                                setTasks(tasks.filter((t) => t.id !== taskId))
                                Alert.alert("Éxito", "La actividad ha sido eliminada correctamente")
                            } else {
                                throw new Error("No se pudo eliminar la actividad")
                            }
                        } catch (error) {
                            console.error("Error al eliminar la actividad:", error)
                            Alert.alert("Error", "No se pudo eliminar la actividad. Inténtalo de nuevo.")
                        }
                    },
                },
            ],
        )
    }

    const clearFilters = () => {
        setSearchQuery("")
        setFilterType("all")
        setFilterStatus("all")
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando actividades...</Text>
            </View>
        )
    }

    const isTeacher = userType === "docente"

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    {courseId ? "Actividades del curso" : isTeacher ? "Mis actividades" : "Mis tareas y exámenes"}
                </Text>

                <Searchbar
                    placeholder="Buscar actividades..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Tipo:</Text>
                    <SegmentedButtons
                        value={filterType}
                        onValueChange={(value) => setFilterType(value as "all" | "tarea" | "examen")}
                        buttons={[
                            { value: "all", label: "Todos" },
                            { value: "tarea", label: "Tareas" },
                            { value: "examen", label: "Exámenes" },
                        ]}
                        style={styles.segmentedButtons}
                    />
                </View>

                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Estado:</Text>
                    <SegmentedButtons
                        value={filterStatus}
                        onValueChange={(value) => setFilterStatus(value as "all" | "active" | "overdue" | "upcoming")}
                        buttons={[
                            { value: "all", label: "Todos" },
                            { value: "active", label: "Activos" },
                            { value: "overdue", label: "Vencidos" },
                            { value: "upcoming", label: "Próximos" },
                        ]}
                        style={styles.segmentedButtons}
                    />
                </View>

                {(searchQuery || filterType !== "all" || filterStatus !== "all") && (
                    <Button mode="text" onPress={clearFilters} style={styles.clearButton}>
                        Limpiar filtros
                    </Button>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            <TaskList
                tasks={filteredTasks}
                isTeacher={isTeacher}
                courseId={courseId}
                onEditTask={isTeacher ? handleEditTask : undefined}
                onDeleteTask={isTeacher ? handleDeleteTask : undefined}
            />

            {isTeacher && courseId && <FAB icon="plus" style={styles.fab} onPress={handleAddTask} />}
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
        fontSize: 16,
    },
    header: {
        padding: 16,
        paddingTop: 24,
    },
    title: {
        fontWeight: "bold",
        color: "#6200ee",
        marginBottom: 16,
    },
    searchBar: {
        marginBottom: 16,
        elevation: 0,
        backgroundColor: "#fff",
    },
    filterContainer: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        marginBottom: 4,
        color: "#666",
    },
    segmentedButtons: {
        marginBottom: 8,
    },
    clearButton: {
        alignSelf: "flex-end",
        marginBottom: 8,
    },
    errorContainer: {
        backgroundColor: "#ffebee",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: "#d32f2f",
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: "#6200ee",
    },
})
