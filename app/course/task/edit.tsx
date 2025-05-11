import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { TaskForm } from "@/components/tasks/TaskForm"
import { taskClient } from "@/api/taskClient"
import { ActivityIndicator, Text } from "react-native-paper"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import type { Task } from "@/types/Task"
import React from "react"

export default function EditTaskScreen() {
    const { taskId, courseId } = useLocalSearchParams<{ taskId: string; courseId: string }>()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true)
                console.log(`Fetching task ${taskId} for course ${courseId}`)

                if (!taskId || !courseId) {
                    throw new Error("ID de tarea o curso no proporcionado")
                }

                const taskData = await taskClient.getTaskById(courseId, taskId)

                if (!taskData) {
                    throw new Error("No se pudo cargar la tarea")
                }

                setTask(taskData)
            } catch (err) {
                console.error("Error al cargar la tarea:", err)
                setError("No se pudo cargar la tarea")
            } finally {
                setLoading(false)
            }
        }

        fetchTask()
    }, [taskId, courseId])

    const handleSave = async (updatedTask: Task) => {
        try {
            setSaving(true)

            if (!taskId || !courseId) {
                throw new Error("ID de tarea o curso no proporcionado")
            }

            console.log("Updating task with data:", JSON.stringify(updatedTask, null, 2))

            const result = await taskClient.updateTask(courseId, taskId, updatedTask)

            if (result) {
                Alert.alert("Éxito", "La actividad ha sido actualizada correctamente", [
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
            } else {
                throw new Error("No se pudo actualizar la tarea")
            }
        } catch (error) {
            console.error("Error al actualizar la tarea:", error)
            Alert.alert("Error", "No se pudo actualizar la tarea. Inténtalo de nuevo.")
        } finally {
            setSaving(false)
        }
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
                <Text variant="titleMedium" style={styles.errorText}>
                    {error || "No se pudo cargar la tarea"}
                </Text>
            </View>
        )
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {saving ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.loadingText}>Guardando cambios...</Text>
                    </View>
                ) : (
                    <TaskForm courseId={courseId} initialData={task} onSave={handleSave} onCancel={() => router.back()} />
                )}
            </ScrollView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        padding: 16,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        minHeight: 300,
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
        minHeight: 300,
    },
    errorText: {
        color: "#d32f2f",
        textAlign: "center",
    },
})
