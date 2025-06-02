import React from "react"
import { View, StyleSheet } from "react-native"
import { Text, Card, Chip, Divider, IconButton } from "react-native-paper"
import { router } from "expo-router"
import type { Task } from "@/types/Task"
import { GestureHandlerRootView, FlatList } from "react-native-gesture-handler"

interface TaskListProps {
    tasks: Task[]
    isTeacher: boolean
    courseId?: string
    onEditTask?: (task: Task) => void
    onDeleteTask?: (taskId: string) => void
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, isTeacher, courseId, onEditTask, onDeleteTask }) => {
    const handleTaskPress = (task: Task) => {
        router.push({
            pathname: "/course/task/[taskId]",
            params: { taskId: task.id, courseId: task.course_id },
        })
    }

    const getTaskStatusColor = (task: Task): string => {
        const now = new Date()
        const dueDate = new Date(task.due_date)

        // If due date is in the past
        if (dueDate < now) {
            return "#f44336" // Red for overdue
        }

        // If due date is within 3 days
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(now.getDate() + 3)
        if (dueDate <= threeDaysFromNow) {
            return "#ff9800" // Orange for soon
        }

        return "#4caf50" // Green for plenty of time
    }

    const renderTaskItem = ({ item }: { item: Task }) => {
        const statusColor = getTaskStatusColor(item)
        const dueDate = new Date(item.due_date)

        return (
            <Card style={styles.card} onPress={() => handleTaskPress(item)}>
                <Card.Content>
                    <View style={styles.headerContainer}>
                        <View style={styles.titleContainer}>
                            <Text variant="titleMedium" style={styles.title}>
                                {item.title}
                            </Text>
                            <Chip
                                style={[styles.typeChip, { backgroundColor: item.type === "tarea" ? "#e3f2fd" : "#fff3e0" }]}
                                textStyle={{ color: item.type === "tarea" ? "#1976d2" : "#e65100" }}
                            >
                                {item.type === "tarea" ? "Tarea" : "Examen"}
                            </Chip>
                        </View>

                        {(onEditTask || onDeleteTask) && (
                            <View style={styles.actionsContainer}>
                                {onEditTask && <IconButton icon="pencil" size={20} onPress={() => onEditTask(item)} />}
                                {onDeleteTask && <IconButton icon="delete" size={20} onPress={() => onDeleteTask(item.id)} />}
                            </View>
                        )}
                    </View>

                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <Divider style={styles.divider} />

                    <View style={styles.detailsContainer}>
                        <View style={styles.dateContainer}>
                            <Text style={styles.label}>Fecha de entrega:</Text>
                            <Text style={[styles.date, { color: statusColor }]}>
                                {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                        </View>

                        <View style={styles.statusContainer}>
                            {item.has_timer && (
                                <Chip icon="timer" style={styles.timerChip}>
                                    {item.time_limit_minutes} min
                                </Chip>
                            )}

                            {item.allow_file_upload && (
                                <Chip icon="file-upload" style={styles.fileChip}>
                                    Archivos
                                </Chip>
                            )}
                        </View>
                    </View>
                </Card.Content>
            </Card>
        )
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    listContent: {
        padding: 16,
        paddingBottom: 80, // Extra padding for FAB
    },
    card: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    titleContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    title: {
        fontWeight: "bold",
        marginRight: 8,
        flex: 1,
    },
    typeChip: {
        height: 24,
        marginLeft: 8,
    },
    actionsContainer: {
        flexDirection: "row",
    },
    description: {
        color: "#666",
        marginBottom: 8,
    },
    divider: {
        marginVertical: 8,
    },
    detailsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
    },
    dateContainer: {
        flexDirection: "column",
    },
    label: {
        fontSize: 12,
        color: "#666",
    },
    date: {
        fontWeight: "bold",
    },
    statusContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    timerChip: {
        marginRight: 8,
        height: 24,
        backgroundColor: "#e8f5e9",
    },
    fileChip: {
        height: 24,
        backgroundColor: "#e8eaf6",
    },
})
