import React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, Alert, AppState } from "react-native"
import { Text, Button, HelperText, Divider, Chip, Portal, Modal, TextInput } from "react-native-paper"
import * as DocumentPicker from "expo-document-picker"
import { taskClient } from "@/api/taskClient"
import type { Task } from "@/types/Task"
import { supabaseClient } from "@/api/supabaseClient"
import { userApi } from "@/api/userApi"
import { TaskFileViewer } from "@/components/tasks/TaskFileViewer"

interface TaskSubmissionFormProps {
    task: Task
    courseId: string
    onSubmissionComplete: () => void
}

export const TaskSubmissionForm: React.FC<TaskSubmissionFormProps> = ({ task, courseId, onSubmissionComplete }) => {
    const [selectedFile, setSelectedFile] = useState<{
        name: string
        uri: string
        size: number
        type: string
    } | null>(null)
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [examStarted, setExamStarted] = useState(false)
    const [examExpired, setExamExpired] = useState(false)
    const [showTimeWarning, setShowTimeWarning] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [startingExam, setStartingExam] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(true)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const [examCompleted, setExamCompleted] = useState(false)

    const parseTimeToSeconds = (timeString: string): number => {
        const parts = timeString.split(":")
        if (parts.length !== 3) return 0

        const hours = Number.parseInt(parts[0], 10) || 0
        const minutes = Number.parseInt(parts[1], 10) || 0
        const seconds = Number.parseInt(parts[2], 10) || 0

        return hours * 3600 + minutes * 60 + seconds
    }

    useEffect(() => {
        if (task.type === "examen" && task.has_timer && task.time_limit_minutes) {
            checkExamStatus()
        } else {
            setCheckingStatus(false)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [task])

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === "active" && examStarted && !examExpired && !examCompleted) {
                console.log("App became active - syncing timer")
                syncTimerWithServer()
            }
        }

        const subscription = AppState.addEventListener("change", handleAppStateChange)
        return () => subscription?.remove()
    }, [examStarted, examExpired, examCompleted])

    const checkExamStatus = async () => {
        try {
            setCheckingStatus(true)
            console.log("=== CHECKING EXAM STATUS ===")

            const userId = await userApi.getUserId()
            if (!userId) {
                console.log("No user ID found")
                setCheckingStatus(false)
                return
            }

            console.log("User ID:", userId)

            try {
                const submission = await taskClient.getTaskSubmission(task.id, userId)
                console.log("Submission data:", JSON.stringify(submission, null, 2))

                if (submission) {
                    setExamCompleted(true)
                    setCheckingStatus(false)
                    return
                }

                try {
                    const timeString = await taskClient.getTaskTimer(task.id)
                    console.log("Timer from server:", timeString)

                    const remainingSeconds = parseTimeToSeconds(timeString)
                    console.log("Remaining seconds:", remainingSeconds)

                    if (remainingSeconds > 0) {
                        setExamStarted(true)
                        setTimeRemaining(remainingSeconds)
                        startLocalTimer()
                    } else {
                        setExamExpired(true)
                        setTimeRemaining(0)
                    }
                } catch (timerError) {
                    console.log("No timer found - exam not started yet")
                }
            } catch (submissionError) {
                console.log("❌ NO SUBMISSION FOUND (error):", submissionError)
            }
        } catch (error) {
            console.error("Error checking exam status:", error)
        } finally {
            setCheckingStatus(false)
        }
    }

    const syncTimerWithServer = async () => {
        try {
            console.log("Syncing timer with server...")
            const timeString = await taskClient.getTaskTimer(task.id)
            const remainingSeconds = parseTimeToSeconds(timeString)

            console.log(`Server time: ${timeString}, Seconds: ${remainingSeconds}`)

            if (remainingSeconds <= 0) {
                handleTimeUp()
                return
            }

            setTimeRemaining(remainingSeconds)
        } catch (error) {
            console.error("Error syncing timer:", error)
        }
    }

    const startLocalTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    handleTimeUp()
                    return 0
                }

                if (prev === 300) {
                    setShowTimeWarning(true)
                }

                return prev - 1
            })
        }, 1000)
    }

    const handleStartExam = async () => {
        try {
            setStartingExam(true)
            console.log("Starting exam...")

            await taskClient.startExam(courseId, task.id)

            if (task.time_limit_minutes) {
                const initialSeconds = task.time_limit_minutes * 60
                console.log("Setting initial timer to", initialSeconds, "seconds")
                setTimeRemaining(initialSeconds)
                setExamStarted(true)
                startLocalTimer()
            }

            Alert.alert(
                "Examen iniciado",
                `Tienes ${task.time_limit_minutes} minutos para completar este examen. El tiempo comenzará a correr ahora.`,
                [{ text: "Entendido" }],
            )
        } catch (error) {
            console.error("Error starting exam:", error)
            Alert.alert("Error", "No se pudo iniciar el examen. Inténtalo de nuevo.")
        } finally {
            setStartingExam(false)
        }
    }

    const handleTimeUp = () => {
        console.log("Time is up!")
        setExamExpired(true)
        setTimeRemaining(0)
        if (timerRef.current) clearInterval(timerRef.current)

        Alert.alert(
            "Tiempo agotado",
            "El tiempo para completar este examen ha terminado. Ya no puedes enviar respuestas.",
            [{ text: "OK" }],
        )
    }

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${secs}s`
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

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }))
    }

    const validateSubmission = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (task.type === "examen" && examExpired) {
            Alert.alert("Error", "El tiempo del examen ha expirado. No puedes enviar respuestas.")
            return false
        }

        if (task.answer_format === "archivo") {
            if (!selectedFile) {
                newErrors.file = "Debes adjuntar un archivo"
            }
        } else if (task.answer_format === "preguntas_respuestas") {
            if (task.questions) {
                for (const question of task.questions) {
                    if (question.id && !answers[question.id]?.trim()) {
                        newErrors[`question_${question.id}`] = "Esta pregunta es obligatoria"
                    }
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateSubmission()) {
            return
        }

        if (task.type === "examen" && examExpired) {
            Alert.alert("Error", "El tiempo del examen ha expirado.")
            return
        }

        try {
            setSubmitting(true)

            const userId = await userApi.getUserId()
            if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario")
                return
            }

            let fileUrl = ""
            if (selectedFile) {
                try {
                    setUploadProgress(10)
                    console.log("Preparando para subir archivo:", selectedFile)

                    const progressInterval = setInterval(() => {
                        setUploadProgress((prev) => {
                            const newProgress = prev + 10
                            return newProgress >= 90 ? 90 : newProgress
                        })
                    }, 300)

                    fileUrl = await supabaseClient.uploadFile(selectedFile.uri, courseId, selectedFile.name)

                    clearInterval(progressInterval)

                    if (!fileUrl) {
                        throw new Error("No se pudo obtener URL del archivo subido")
                    }

                    setUploadProgress(100)
                    console.log("Archivo subido exitosamente:", fileUrl)
                } catch (uploadError) {
                    console.error("Error al subir archivo:", uploadError)
                    Alert.alert("Error", "No se pudo subir el archivo. Inténtalo de nuevo.")
                    setSubmitting(false)
                    setUploadProgress(0)
                    return
                }
            }

            // Prepare answers for submission
            const submissionAnswers =
                task.questions?.map((question) => ({
                    question_id: question.id || "",
                    answer_text: answers[question.id || ""] || "",
                })) || []

            console.log("Enviando respuesta con:", { submissionAnswers, fileUrl })
            const result = await taskClient.submitTask(courseId, task.id, userId, submissionAnswers, fileUrl)

            if (result) {
                if (timerRef.current) clearInterval(timerRef.current)

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
            setUploadProgress(0)
        }
    }

    const isTaskOverdue = (): boolean => {
        if (task.type === "examen") return examExpired
        const now = new Date()
        const dueDate = new Date(task.due_date)
        return now > dueDate && !task.allow_late
    }

    if (checkingStatus) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Verificando estado del examen...</Text>
            </View>
        )
    }

    if (examCompleted) {
        return (
            <View style={styles.completionContainer}>
                <Text variant="titleLarge" style={styles.completionTitle}>
                    Examen completado
                </Text>
                <Text style={styles.completionText}>
                    Ya has enviado tu respuesta para este examen. No puedes realizar cambios adicionales.
                </Text>
                <Button mode="outlined" onPress={onSubmissionComplete} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    if (task.type === "examen" && task.has_timer && !examStarted && !examExpired) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.taskInfo}>
                    <Text variant="titleLarge" style={styles.taskTitle}>
                        {task.title}
                    </Text>

                    <Chip style={[styles.typeChip, { backgroundColor: "#fff3e0" }]} textStyle={{ color: "#e65100" }}>
                        Examen
                    </Chip>

                    {task.time_limit_minutes && (
                        <Text style={styles.dueDate}>Tiempo límite: {task.time_limit_minutes} minutos</Text>
                    )}

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Descripción
                    </Text>
                    <Text style={styles.description}>{task.description}</Text>

                    {task.file_url && (
                        <View style={styles.attachmentSection}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Archivo adjunto
                            </Text>
                            <TaskFileViewer fileUrl={task.file_url} fileName={task.file_url.split("/").pop() || "archivo_adjunto"} />
                        </View>
                    )}

                    <Divider style={styles.divider} />

                    <View style={styles.examStartSection}>
                        <Text variant="titleMedium" style={styles.examWarningTitle}>
                            ⚠️ Importante
                        </Text>
                        <Text style={styles.examWarningText}>
                            Este es un examen con tiempo límite de {task.time_limit_minutes} minutos. Una vez que inicies el examen,
                            el tiempo comenzará a correr y no se puede pausar.
                        </Text>

                        <Button
                            mode="contained"
                            onPress={handleStartExam}
                            loading={startingExam}
                            disabled={startingExam}
                            style={styles.startExamButton}
                            icon="play"
                        >
                            Iniciar Examen
                        </Button>
                    </View>
                </View>
            </ScrollView>
        )
    }

    return (
        <ScrollView style={styles.container}>
            {task.type === "examen" && task.has_timer && timeRemaining !== null && (
                <View style={styles.timerContainer}>
                    <Text style={[styles.timerText, timeRemaining < 300 ? styles.timerWarning : null]}>
                        Tiempo restante: {formatTime(timeRemaining)}
                    </Text>
                    {examExpired && <Text style={styles.expiredText}>⏰ Tiempo agotado</Text>}
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

                {task.type === "tarea" && (
                    <Text style={styles.dueDate}>
                        Fecha de entrega: {new Date(task.due_date).toLocaleDateString()}{" "}
                        {new Date(task.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                )}

                {task.type === "examen" && task.has_timer && task.time_limit_minutes && (
                    <Text style={styles.dueDate}>Tiempo límite: {task.time_limit_minutes} minutos</Text>
                )}

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Descripción
                </Text>
                <Text style={styles.description}>{task.description}</Text>

                {task.file_url && (
                    <View style={styles.attachmentSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Archivo adjunto
                        </Text>
                        <TaskFileViewer fileUrl={task.file_url} fileName={task.file_url.split("/").pop() || "archivo_adjunto"} />
                    </View>
                )}

                <Divider style={styles.divider} />
            </View>

            <View style={styles.answerSection}>
                {task.answer_format === "preguntas_respuestas" && task.questions ? (
                    <View>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Preguntas
                        </Text>
                        {task.questions.map((question, index) => (
                            <View key={question.id || index} style={styles.questionContainer}>
                                <Text variant="titleSmall" style={styles.questionText}>
                                    {index + 1}. {question.text}
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Escribe tu respuesta aquí..."
                                    value={answers[question.id || ""] || ""}
                                    onChangeText={(text) => handleAnswerChange(question.id || "", text)}
                                    style={styles.answerInput}
                                    error={!!errors[`question_${question.id}`]}
                                    disabled={examExpired}
                                />
                                {errors[`question_${question.id}`] && (
                                    <HelperText type="error">{errors[`question_${question.id}`]}</HelperText>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Subir archivo
                        </Text>
                        <Button
                            mode="outlined"
                            icon="file-upload"
                            onPress={pickDocument}
                            style={styles.uploadButton}
                            disabled={examExpired}
                        >
                            Seleccionar archivo
                        </Button>

                        {selectedFile && (
                            <View style={styles.fileInfo}>
                                <Chip icon="file-document" style={styles.fileChip}>
                                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </Chip>
                                <Button icon="delete" mode="text" compact onPress={() => setSelectedFile(null)} disabled={examExpired}>
                                    Eliminar
                                </Button>
                            </View>
                        )}

                        {errors.file && <HelperText type="error">{errors.file}</HelperText>}
                    </View>
                )}

                {uploadProgress > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                        <Text style={styles.progressText}>{uploadProgress}%</Text>
                    </View>
                )}
            </View>

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
                        {task.type === "examen"
                            ? "El tiempo del examen ha expirado."
                            : "La fecha límite de entrega ha pasado y no se permiten entregas tardías."}
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    completionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    completionTitle: {
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#4caf50",
    },
    completionText: {
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
        color: "#666",
    },
    backButton: {
        paddingHorizontal: 24,
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
    expiredText: {
        color: "#d32f2f",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 4,
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
    attachmentSection: {
        marginBottom: 16,
    },
    examStartSection: {
        padding: 16,
        backgroundColor: "#fff3e0",
        borderRadius: 8,
        marginTop: 16,
    },
    examWarningTitle: {
        fontWeight: "bold",
        color: "#e65100",
        marginBottom: 12,
    },
    examWarningText: {
        marginBottom: 12,
        lineHeight: 20,
        color: "#333",
    },
    startExamButton: {
        marginTop: 8,
        backgroundColor: "#e65100",
    },
    answerSection: {
        padding: 16,
        paddingTop: 0,
    },
    questionContainer: {
        marginBottom: 20,
    },
    questionText: {
        marginBottom: 8,
        fontWeight: "bold",
    },
    answerInput: {
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
    progressContainer: {
        height: 20,
        backgroundColor: "#e0e0e0",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        marginTop: 12,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#6200ee",
    },
    progressText: {
        position: "absolute",
        width: "100%",
        textAlign: "center",
        color: "#fff",
        fontSize: 12,
        lineHeight: 20,
    },
})
