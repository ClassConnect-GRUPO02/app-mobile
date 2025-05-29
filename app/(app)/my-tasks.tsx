import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, ActivityIndicator, Searchbar, Button, Card, Divider, SegmentedButtons } from "react-native-paper"
import { router } from "expo-router"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { userApi } from "@/api/userApi"
import React from "react"

type StatusFilter = "pending" | "overdue" | "completed" | "draft"

export default function MyTasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [userType, setUserType] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<StatusFilter>("pending")
    const [activeTab, setActiveTab] = useState<"tareas" | "examenes">("tareas")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)

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

        // Apply tab filter (tareas vs examenes)
        result = result.filter((task) => {
            if (activeTab === "tareas") {
                return task.type === "tarea"
            } else {
                return task.type === "examen"
            }
        })

        // Apply status filter
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
            // For now, we'll show a placeholder for students
            result = []
        } else if (activeFilter === "draft") {
            // Draft: not published (only for teachers)
            result = result.filter((task) => !task.published)
        }

        setFilteredTasks(result)
    }, [tasks, searchQuery, activeFilter, activeTab])

    useEffect(() => {
        // Reset to first page when filters change
        setCurrentPage(1)
    }, [searchQuery, activeFilter, activeTab])

    // Pagination calculations
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentPageTasks = filteredTasks.slice(startIndex, endIndex)

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const handlePageSelect = (page: number) => {
        setCurrentPage(page)
    }

    const renderPaginationControls = () => {
        if (totalPages <= 1) return null

        const pageNumbers = []
        const maxVisiblePages = 5
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i)
        }

        return (
            <View style={styles.paginationContainer}>
                <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                        Página {currentPage} de {totalPages} • {filteredTasks.length}{" "}
                        {activeTab === "tareas" ? "tareas" : "exámenes"}
                    </Text>
                </View>

                <View style={styles.paginationControls}>
                    <Button
                        mode="outlined"
                        onPress={handlePreviousPage}
                        disabled={currentPage === 1}
                        style={styles.paginationButton}
                        compact
                    >
                        Anterior
                    </Button>

                    <View style={styles.pageNumbers}>
                        {pageNumbers.map((pageNum) => (
                            <Button
                                key={pageNum}
                                mode={currentPage === pageNum ? "contained" : "outlined"}
                                onPress={() => handlePageSelect(pageNum)}
                                style={styles.pageNumberButton}
                                compact
                            >
                                {pageNum}
                            </Button>
                        ))}
                    </View>

                    <Button
                        mode="outlined"
                        onPress={handleNextPage}
                        disabled={currentPage === totalPages}
                        style={styles.paginationButton}
                        compact
                    >
                        Siguiente
                    </Button>
                </View>
            </View>
        )
    }

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
                        <Text variant="titleMedium" style={styles.taskTitle}>
                            {item.title}
                        </Text>
                        {!item.published && <Text style={styles.draftBadge}>Borrador</Text>}
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

    // Get available filters based on user type
    const getStatusFilters = () => {
        if (userType === "docente") {
            return [
                { value: "pending", label: "Pendientes" },
                { value: "overdue", label: "Vencidas" },
                { value: "draft", label: "En borrador" },
            ]
        } else {
            return [
                { value: "pending", label: "Pendientes" },
                { value: "overdue", label: "Vencidas" },
                { value: "completed", label: "Completadas" },
            ]
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando tareas...</Text>
            </View>
        )
    }

    const tareas = tasks.filter((task) => task.type === "tarea")
    const examenes = tasks.filter((task) => task.type === "examen")

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

                {/* Tabs para separar tareas y exámenes */}
                <SegmentedButtons
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as "tareas" | "examenes")}
                    buttons={[
                        {
                            value: "tareas",
                            label: `📝 Tareas (${tareas.length})`,
                        },
                        {
                            value: "examenes",
                            label: `📋 Exámenes (${examenes.length})`,
                        },
                    ]}
                    style={styles.segmentedButtons}
                />

                {/* Filtros por estado */}
                <View style={styles.filterContainer}>
                    <Text variant="labelMedium" style={styles.filterLabel}>
                        Estado:
                    </Text>
                    {getStatusFilters().map((filter) => (
                        <Button
                            key={filter.value}
                            mode={activeFilter === filter.value ? "contained" : "outlined"}
                            onPress={() => setActiveFilter(filter.value as StatusFilter)}
                            style={styles.filterButton}
                            compact
                        >
                            {filter.label}
                        </Button>
                    ))}
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
                            ? `No se encontraron ${activeTab === "tareas" ? "tareas" : "exámenes"} que coincidan con tu búsqueda`
                            : activeFilter === "pending"
                                ? `No hay ${activeTab === "tareas" ? "tareas" : "exámenes"} pendientes`
                                : activeFilter === "overdue"
                                    ? `No hay ${activeTab === "tareas" ? "tareas" : "exámenes"} vencidas`
                                    : activeFilter === "completed"
                                        ? `No hay ${activeTab === "tareas" ? "tareas" : "exámenes"} completadas`
                                        : activeFilter === "draft"
                                            ? `No hay ${activeTab === "tareas" ? "tareas" : "exámenes"} en borrador`
                                            : userType === "docente"
                                                ? `No has creado ${activeTab === "tareas" ? "tareas" : "exámenes"} aún`
                                                : `No tienes ${activeTab === "tareas" ? "tareas" : "exámenes"} asignadas`}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={currentPageTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderPaginationControls}
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
    segmentedButtons: {
        marginBottom: 16,
    },
    filterContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap",
    },
    filterLabel: {
        marginRight: 8,
        color: "#666",
        minWidth: 50,
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
    draftBadge: {
        backgroundColor: "#f5f5f5",
        color: "#666",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
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
    paginationContainer: {
        backgroundColor: "#fff",
        padding: 16,
        marginTop: 16,
        borderRadius: 8,
        elevation: 1,
    },
    paginationInfo: {
        alignItems: "center",
        marginBottom: 12,
    },
    paginationText: {
        fontSize: 14,
        color: "#666",
    },
    paginationControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    paginationButton: {
        minWidth: 80,
    },
    pageNumbers: {
        flexDirection: "row",
        alignItems: "center",
    },
    pageNumberButton: {
        marginHorizontal: 2,
        minWidth: 40,
    },
})
