import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { TaskForm } from "@/components/tasks/TaskForm"
import { taskClient } from "@/api/taskClient"
import { StatusBar } from "expo-status-bar"
import { IconButton } from "react-native-paper"
import React from "react"

export default function CreateTaskScreen() {
    const { courseId } = useLocalSearchParams<{ courseId: string }>()
    const [loading, setLoading] = useState(false)

    const handleSaveTask = async (taskData: any) => {
        try {
            setLoading(true)
            console.log("Creando tarea con datos:", taskData)

            const createdTask = await taskClient.createTask(courseId, taskData)

            if (createdTask) {
                Alert.alert("Éxito", "La tarea ha sido creada correctamente", [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ])
            } else {
                throw new Error("No se pudo crear la tarea")
            }
        } catch (error) {
            console.error("Error al crear tarea:", error)
            Alert.alert("Error", "No se pudo crear la tarea. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={styles.backButton} />
            </View>

            <TaskForm courseId={courseId} onSave={handleSaveTask} onCancel={() => router.back()} isCreating={true} />
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
})
