import { useState, useEffect } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { TaskForm } from "@/components/tasks/TaskForm"
import { taskClient } from "@/api/taskClient"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, IconButton, Text } from "react-native-paper"
import type { Task } from "@/types/Task"
import React from "react"

export default function EditTaskScreen() {
    const { courseId, taskId } = useLocalSearchParams<{ courseId: string; taskId: string }>()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setLoading(true)
                const taskData = await taskClient.getTaskById(courseId, taskId)
                if (!taskData) {
                    throw new Error("No se pudo cargar la tarea")
                }
                setTask(taskData)
            } catch (err) {
                console.error("Error al cargar la tarea:", err)
                setError("No se pudo cargar la información de la tarea")
            } finally {
                setLoading(false)
            }
        }

        if (courseId && taskId) {
            fetchTask()
        }
    }, [courseId, taskId])

    const handleSaveTask = async (taskData: any) => {
        try {
            setSaving(true)
            console.log("Actualizando tarea con datos:", taskData)

            const updatedTask = await taskClient.updateTask(courseId, taskId, taskData)

            if (updatedTask) {
                Alert.alert("Éxito", "La tarea ha sido actualizada correctamente", [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ])
            } else {
                throw new Error("No se pudo actualizar la tarea")
            }
        } catch (error) {
            console.error("Error al actualizar tarea:", error)
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
                <Text variant="headlineMedium">Tarea no encontrada</Text>
                <Text style={styles.errorText}>{error}</Text>
                <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={styles.backButton} />
            </View>

            <TaskForm
                courseId={courseId}
                initialData={task}
                onSave={handleSaveTask}
                onCancel={() => router.back()}
                isCreating={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        paddingTop: 8,
        paddingHorizontal: 8,
    },
    backButton: {
        margin: 0,
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
})
