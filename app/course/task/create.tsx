import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { TaskForm } from "@/components/tasks/TaskForm"
import { taskClient } from "@/api/taskClient"
import { ActivityIndicator, Text } from "react-native-paper"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {userApi} from "@/api/userApi";
import React from "react"

export default function CreateTaskScreen() {
    const { courseId } = useLocalSearchParams<{ courseId: string }>()
    const [saving, setSaving] = useState(false)

    // Update the handleSave function to set the correct defaults for file upload tasks
    const handleSave = async (taskData: any) => {
        try {
            setSaving(true)

            if (!courseId) {
                Alert.alert("Error", "ID del curso no proporcionado")
                return
            }

            // Get current user ID for created_by field
            const userId = await userApi.getUserId()
            if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario")
                return
            }

            // Prepare task data - NO ID field
            const taskToCreate = {
                course_id: courseId,
                created_by: userId,
                type: taskData.type,
                title: taskData.title,
                description: taskData.description,
                instructions: taskData.instructions,
                due_date: taskData.due_date,
                allow_late: taskData.allow_late,
                late_policy: taskData.late_policy,
                has_timer: taskData.has_timer,
                time_limit_minutes: taskData.time_limit_minutes,
                published: taskData.published,
                visible_from: taskData.visible_from,
                visible_until: taskData.visible_until,
                allow_file_upload: true, // Always allow file uploads
                answer_format: "archivo", // Default to file upload format
            }

            console.log("Creating task with data:", JSON.stringify(taskToCreate, null, 2))

            // Send the data to the API
            const result = await taskClient.createTask(courseId, taskToCreate)
            console.log("Task creation result:", result)

            if (result) {
                Alert.alert("Éxito", "La actividad ha sido creada correctamente", [
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
                throw new Error("No se pudo crear la actividad")
            }
        } catch (error) {
            console.error("Error al crear la actividad:", error)
            Alert.alert("Error", "No se pudo crear la actividad. Inténtalo de nuevo.")
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        router.back()
    }

    // Simplemente mostrar el formulario sin hacer ninguna solicitud
    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {saving ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.loadingText}>Guardando actividad...</Text>
                    </View>
                ) : (
                    <TaskForm courseId={courseId} onSave={handleSave} onCancel={handleCancel} isCreating={true} />
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
})
