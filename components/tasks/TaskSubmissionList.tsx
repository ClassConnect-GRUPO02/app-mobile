import React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Button, TextInput, HelperText, Divider, Chip, Portal, Modal } from "react-native-paper"
import * as DocumentPicker from "expo-document-picker"
import {userApi} from "@/api/userApi";
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"

interface TaskSubmissionFormProps {
    task: Task
    courseId: string
    onSubmissionComplete: () => void
}

export const TaskSubmissionForm: React.FC<TaskSubmissionFormProps> = ({ task, courseId, onSubmissionComplete }) => {
    const [answers, setAnswers] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<{
        name: string
        uri: string
        size: number
        type: string
    } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [timeRemaining, setTimeRemaining] = useState<number | null>(
        task.has_timer && task.time_limit_minutes ? task.time_limit_minutes * 60 : null,
    )
    const [showTimeWarning, setShowTimeWarning] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize answers array based on task type
    useEffect(() => {
        if (task.answer_format === "texto" || task.answer_format === "mixto") {
            setAnswers([""])
        } else if (task.answer_format === "opcion_multiple") {
            setAnswers([])
        }
    }, [task])

    // Timer logic for exams
    useEffect(() => {
        if (task.has_timer && task.time_limit_minutes && timeRemaining !== null) {
            timerRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 0) {
                        if (timerRef.current) clearInterval(timerRef.current)
                        handleTimeUp()
                        return 0
                    }

                    // Show warning when 5 minutes remaining
                    if (prev === 300) {
                        setShowTimeWarning(true)
                    }

                    return prev - 1
                })
            }, 1000)

            return () => {
                if (timerRef.current) clearInterval(timerRef.current)
            }
        }
    }, [task])

    const handleTimeUp = () => {
        Alert.alert(
            "Tiempo agotado",
            "El tiempo para completar este examen ha terminado. Tu respuesta será enviada automáticamente.",
            [{ text: "OK", onPress: () => handleSubmit() }],
        )
    }

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${secs}s`
    }

    const handleTextAnswerChange = (text: string, index: number) => {
        const newAnswers = [...answers]
        newAnswers[index] = text
        setAnswers(newAnswers)
    }

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            })

            if (result.canceled) {
                console.log("Document picking was canceled")
                return
            }

            const fileInfo = result.assets[0]

            // Check file size (limit to 10MB)
            const fileSize = fileInfo.size || 0
            if (fileSize > 10 * 1024 * 1024) {
                Alert.alert("Error", "El archivo es demasiado grande. El tamaño máximo permitido es 10MB.")
                return
            }

            setSelectedFile({
                name: fileInfo.name,
                uri: fileInfo.uri,
                size: fileInfo.size || 0,
                type: fileInfo.mimeType || "application/octet-stream",
            })

            console.log("Selected file:", fileInfo)
        } catch (error) {
            console.error("Error picking document:", error)
            Alert.alert("Error", "No se pudo seleccionar el archivo. Inténtalo de nuevo.")
        }
    }

    const validateSubmission = (): boolean => {
        const newErrors: Record<string, string> = {}

        // Validate text answers if required
        if (
            (task.answer_format === "texto" || task.answer_format === "mixto") &&
            (!answers[0] || answers[0].trim() === "")
        ) {
            newErrors.answer = "Debes proporcionar una respuesta"
        }

        // Validate file upload if required
        if (task.answer_format === "archivo" || (task.answer_format === "mixto" && task.allow_file_upload)) {
            if (!selectedFile && task.allow_file_upload) {
                newErrors.file = "Debes adjuntar un archivo"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateSubmission()) {
            return
        }

        try {
            setSubmitting(true)

            const userId = await userApi.getUserId()
            if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario")
                return
            }

            // Handle file upload if needed
            let fileUrl = ""
            if (selectedFile) {
                // In a real app, you would upload the file to your server or storage service
                // For now, we'll just use the local URI
                fileUrl = selectedFile.uri

                // Example of how you might upload a file:
                // const formData = new FormData()
                // formData.append('file', {
                //   uri: selectedFile.uri,
                //   name: selectedFile.name,
                //   type: selectedFile.type
                // })
                // const uploadResponse = await fetch('your-upload-url', {
                //   method: 'POST',
                //   body: formData
                // })
                // const uploadResult = await uploadResponse.json()
                // fileUrl = uploadResult.fileUrl
            }

            // Submit the task
            const result = await taskClient.submitTask(courseId, task.id, userId, answers, fileUrl)

            if (result) {
                Alert.alert("Éxito", "Tu respuesta ha sido enviada correctamente", [
                    { text: "OK", onPress: onSubmissionComplete },
                ])
            } else {
                throw new Error("No se pudo enviar la respuesta")
            }
        } catch (error) {
            console.error("Error submitting task:", error)
            Alert.alert("Error", "No se pudo enviar tu respuesta. Inténtalo de nuevo.")
        } finally {
            setSubmitting(false)
        }
    }

    const isTaskOverdue = (): boolean => {
        const now = new Date()
        const dueDate = new Date(task.due_date)
        return now > dueDate && !task.allow_late
    }

    const renderAnswerSection = () => {
        switch (task.answer_format) {
            case "texto":
                return (
                    <View style={styles.answerSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Tu respuesta
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={8}
                            mode="outlined"
                            value={answers[0] || ""}
                            onChangeText={(text) => handleTextAnswerChange(text, 0)}
                            placeholder="Escribe tu respuesta aquí..."
                            style={styles.textAnswer}
                            error={!!errors.answer}
                        />
                        {errors.answer && <HelperText type="error">{errors.answer}</HelperText>}
                    </View>
                )

            case "archivo":
                return (
                    <View style={styles.answerSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Subir archivo
                        </Text>
                        <Button mode="outlined" icon="file-upload" onPress={pickDocument} style={styles.uploadButton}>
                            Seleccionar archivo
                        </Button>

                        {selectedFile && (
                            <View style={styles.fileInfo}>
                                <Chip icon="file-document" style={styles.fileChip}>
                                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </Chip>
                                <Button icon="delete" mode="text" compact onPress={() => setSelectedFile(null)}>
                                    Eliminar
                                </Button>
                            </View>
                        )}

                        {errors.file && <HelperText type="error">{errors.file}</HelperText>}
                    </View>
                )

            case "mixto":
                return (
                    <View style={styles.answerSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Tu respuesta
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={6}
                            mode="outlined"
                            value={answers[0] || ""}
                            onChangeText={(text) => handleTextAnswerChange(text, 0)}
                            placeholder="Escribe tu respuesta aquí..."
                            style={styles.textAnswer}
                            error={!!errors.answer}
                        />
                        {errors.answer && <HelperText type="error">{errors.answer}</HelperText>}

                        {task.allow_file_upload && (
                            <>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Adjuntar archivo (opcional)
                                </Text>
                                <Button mode="outlined" icon="file-upload" onPress={pickDocument} style={styles.uploadButton}>
                                    Seleccionar archivo
                                </Button>

                                {selectedFile && (
                                    <View style={styles.fileInfo}>
                                        <Chip icon="file-document" style={styles.fileChip}>
                                            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                        </Chip>
                                        <Button icon="delete" mode="text" compact onPress={() => setSelectedFile(null)}>
                                            Eliminar
                                        </Button>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <ScrollView style={styles.container}>
            {/* Timer for exams */}
            {task.has_timer && timeRemaining !== null && (
                <View style={styles.timerContainer}>
                    <Text style={[styles.timerText, timeRemaining < 300 ? styles.timerWarning : null]}>
                        Tiempo restante: {formatTime(timeRemaining)}
                    </Text>
                </View>
            )}

            <View style={styles.taskInfo}>
                <Text variant="titleLarge" style={styles.taskTitle}>
                    {task.title}
                </Text>

                <Chip
                    style={[styles.typeChip, { backgroundColor: task.type === "tarea" ? "#e3f2fd" : "#fff3e0" }]}
                    textStyle={{ color: task.type === "tarea" ? "#1976d2" : "#e65100" }}
                >
                    {task.type === "tarea" ? "Tarea" : "Examen"}
                </Chip>

                <Text style={styles.dueDate}>
                    Fecha de entrega: {new Date(task.due_date).toLocaleDateString()}{" "}
                    {new Date(task.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Descripción
                </Text>
                <Text style={styles.description}>{task.description}</Text>

                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Instrucciones
                </Text>
                <Text style={styles.instructions}>{task.instructions}</Text>

                <Divider style={styles.divider} />
            </View>

            {renderAnswerSection()}

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting || isTaskOverdue()}
                    style={styles.submitButton}
                >
                    Enviar respuesta
                </Button>

                {isTaskOverdue() && (
                    <Text style={styles.overdueWarning}>
                        La fecha límite de entrega ha pasado y no se permiten entregas tardías.
                    </Text>
                )}
            </View>

            {/* Time warning modal */}
            <Portal>
                <Modal
                    visible={showTimeWarning}
                    onDismiss={() => setShowTimeWarning(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text variant="titleLarge" style={styles.warningTitle}>
                            ¡Atención!
                        </Text>
                        <Text style={styles.warningText}>
                            Te quedan menos de 5 minutos para completar este examen. Asegúrate de enviar tu respuesta antes de que se
                            acabe el tiempo.
                        </Text>
                        <Button mode="contained" onPress={() => setShowTimeWarning(false)}>
                            Entendido
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    timerContainer: {
        backgroundColor: "#f5f5f5",
        padding: 12,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    timerText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    timerWarning: {
        color: "#d32f2f",
    },
    taskInfo: {
        padding: 16,
    },
    taskTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    typeChip: {
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    dueDate: {
        color: "#666",
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    description: {
        marginBottom: 16,
        lineHeight: 22,
    },
    instructions: {
        lineHeight: 22,
    },
    answerSection: {
        padding: 16,
        paddingTop: 0,
    },
    textAnswer: {
        marginBottom: 8,
    },
    uploadButton: {
        marginVertical: 8,
    },
    fileInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    fileChip: {
        flex: 1,
        marginRight: 8,
    },
    buttonContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    submitButton: {
        paddingVertical: 8,
    },
    overdueWarning: {
        color: "#d32f2f",
        marginTop: 8,
        textAlign: "center",
    },
    modalContainer: {
        backgroundColor: "white",
        margin: 20,
        borderRadius: 8,
        padding: 20,
    },
    modalContent: {
        alignItems: "center",
    },
    warningTitle: {
        color: "#d32f2f",
        marginBottom: 16,
    },
    warningText: {
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 22,
    },
})
