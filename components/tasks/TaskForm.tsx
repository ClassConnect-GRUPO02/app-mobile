import React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native"
import {
    Text,
    TextInput,
    Button,
    Switch,
    Divider,
    HelperText,
    RadioButton,
    Checkbox,
    SegmentedButtons,
    IconButton,
} from "react-native-paper"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as DocumentPicker from "expo-document-picker"
import type { Task, TaskType, LatePolicy, AnswerFormat, TaskQuestion } from "@/types/Task"
import { taskClient } from "@/api/taskClient"
import { userApi } from "@/api/userApi"

interface TaskFormProps {
    courseId: string
    taskId?: string
    onSave: () => void
    onCancel: () => void
}

export const TaskForm: React.FC<TaskFormProps> = ({ courseId, taskId, onSave, onCancel }) => {
    const [initialData, setInitialData] = useState<Task | null>(null)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<TaskType>("tarea")
    const [dueDate, setDueDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [allowLate, setAllowLate] = useState(false)
    const [latePolicy, setLatePolicy] = useState<LatePolicy>("ninguna")
    const [hasTimer, setHasTimer] = useState(false)
    const [timeLimit, setTimeLimit] = useState("60")
    const [published, setPublished] = useState(false)
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>("archivo")
    const [questions, setQuestions] = useState<TaskQuestion[]>([{ text: "" }])
    const [attachmentFile, setAttachmentFile] = useState<{
        name: string
        uri: string
        size: number
        type: string
    } | null>(null)

    // Validation states
    const [titleError, setTitleError] = useState("")
    const [descriptionError, setDescriptionError] = useState("")
    const [timeLimitError, setTimeLimitError] = useState("")
    const [questionsError, setQuestionsError] = useState("")

    React.useEffect(() => {
        const loadTaskData = async () => {
            if (taskId) {
                try {
                    setLoading(true)
                    const task = await taskClient.getTaskById(courseId, taskId)
                    if (task) {
                        setInitialData(task)
                        setTitle(task.title)
                        setDescription(task.description)
                        setType(task.type)
                        setDueDate(new Date(task.due_date))
                        setAllowLate(task.allow_late)
                        setLatePolicy(task.late_policy)
                        setHasTimer(task.has_timer)
                        setTimeLimit(task.time_limit_minutes?.toString() || "60")
                        setPublished(task.published)
                        setAnswerFormat(task.answer_format)
                        if (task.questions && task.questions.length > 0) {
                            setQuestions(task.questions)
                        }
                    }
                } catch (error) {
                    console.error("Error loading task:", error)
                    Alert.alert("Error", "No se pudo cargar la tarea")
                } finally {
                    setLoading(false)
                }
            }
        }

        loadTaskData()
    }, [taskId, courseId])

    const validateForm = () => {
        let isValid = true

        if (!title.trim()) {
            setTitleError("El título es obligatorio")
            isValid = false
        } else {
            setTitleError("")
        }

        if (!description.trim()) {
            setDescriptionError("La descripción es obligatoria")
            isValid = false
        } else {
            setDescriptionError("")
        }

        if (hasTimer) {
            const timeLimitNum = Number.parseInt(timeLimit, 10)
            if (isNaN(timeLimitNum) || timeLimitNum <= 0) {
                setTimeLimitError("El límite de tiempo debe ser un número positivo")
                isValid = false
            } else {
                setTimeLimitError("")
            }
        }

        if (answerFormat === "preguntas_respuestas") {
            const validQuestions = questions.filter((q) => q.text.trim())
            if (validQuestions.length === 0) {
                setQuestionsError("Debe agregar al menos una pregunta")
                isValid = false
            } else {
                setQuestionsError("")
            }
        }

        return isValid
    }

    const handleSave = async () => {
        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)

            const userId = await userApi.getUserId()
            if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario")
                return
            }

            // Prepare questions for preguntas_respuestas format
            const taskQuestions =
                answerFormat === "preguntas_respuestas"
                    ? questions.filter((q) => q.text.trim()).map((q) => ({ text: q.text.trim() }))
                    : []

            const taskData = {
                ...(taskId ? { id: taskId } : {}),
                course_id: courseId,
                created_by: userId,
                type,
                title,
                description,
                due_date: dueDate.toISOString(),
                allow_late: type === "tarea" ? allowLate : false, // Only tasks can allow late submissions
                late_policy: type === "tarea" ? latePolicy : "ninguna",
                has_timer: type === "examen" ? hasTimer : false, // Only exams use timers
                time_limit_minutes: type === "examen" && hasTimer ? Number.parseInt(timeLimit, 10) : null,
                published,
                visible_from: null,
                visible_until: null,
                allow_file_upload: true,
                answer_format: answerFormat,
                questions: taskQuestions,
            }

            let result
            if (taskId) {
                result = await taskClient.updateTask(courseId, taskId, taskData)
            } else {
                result = await taskClient.createTask(courseId, taskData)
            }

            if (result) {
                Alert.alert(
                    "Éxito",
                    `${type === "tarea" ? "Tarea" : "Examen"} ${taskId ? "actualizada" : "creada"} correctamente`,
                    [{ text: "OK", onPress: onSave }],
                )
            }
        } catch (error) {
            console.error("Error saving task:", error)
            Alert.alert("Error", "No se pudo guardar la actividad. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    const addQuestion = () => {
        setQuestions([...questions, { text: "" }])
    }

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index))
        }
    }

    const updateQuestion = (index: number, text: string) => {
        const updatedQuestions = [...questions]
        updatedQuestions[index] = { ...updatedQuestions[index], text }
        setQuestions(updatedQuestions)
    }

    const pickAttachment = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            })

            if (!result.canceled) {
                const fileInfo = result.assets[0]
                setAttachmentFile({
                    name: fileInfo.name,
                    uri: fileInfo.uri,
                    size: fileInfo.size || 0,
                    type: fileInfo.mimeType || "application/octet-stream",
                })
            }
        } catch (error) {
            console.error("Error picking attachment:", error)
            Alert.alert("Error", "No se pudo seleccionar el archivo")
        }
    }

    const onDateChange = (event: any, selectedDate?: Date) => {
        const { type } = event
        if (type === "dismissed") {
            setShowDatePicker(false)
            setShowTimePicker(false)
            return
        }

        if (selectedDate) {
            if (showDatePicker) {
                const newDate = new Date(dueDate)
                newDate.setFullYear(selectedDate.getFullYear())
                newDate.setMonth(selectedDate.getMonth())
                newDate.setDate(selectedDate.getDate())
                setDueDate(newDate)
                setShowDatePicker(false)
            } else if (showTimePicker) {
                const newDate = new Date(dueDate)
                newDate.setHours(selectedDate.getHours())
                newDate.setMinutes(selectedDate.getMinutes())
                setDueDate(newDate)
                setShowTimePicker(false)
            }
        } else {
            setShowDatePicker(false)
            setShowTimePicker(false)
        }
    }

    const formatDate = (date: Date): string => {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando...</Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="headlineMedium" style={styles.title}>
                    {taskId ? "Editar" : "Crear"} {type === "tarea" ? "Tarea" : "Examen"}
                </Text>

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Información básica
                    </Text>

                    <SegmentedButtons
                        value={type}
                        onValueChange={(value) => setType(value as TaskType)}
                        buttons={[
                            { value: "tarea", label: "Tarea" },
                            { value: "examen", label: "Examen" },
                        ]}
                        style={styles.segmentedButtons}
                    />

                    <TextInput
                        label="Título"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        error={!!titleError}
                    />
                    {!!titleError && <HelperText type="error">{titleError}</HelperText>}

                    <TextInput
                        label="Descripción"
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        error={!!descriptionError}
                    />
                    {!!descriptionError && <HelperText type="error">{descriptionError}</HelperText>}
                </View>

                <Divider style={styles.divider} />

                {(type === "tarea" || type === "examen") && (
                    <View style={styles.formSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Fecha de entrega
                        </Text>

                        <View style={styles.dateTimeContainer}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowDatePicker(true)}
                                style={[styles.dateButton, styles.dateButtonHalf]}
                                icon="calendar"
                            >
                                {dueDate.toLocaleDateString()}
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={() => setShowTimePicker(true)}
                                style={[styles.dateButton, styles.dateButtonHalf]}
                                icon="clock"
                            >
                                {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Button>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dueDate}
                                mode="date"
                                display={Platform.OS === "ios" ? "default" : "default"}
                                onChange={onDateChange}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={dueDate}
                                mode="time"
                                display={Platform.OS === "ios" ? "default" : "default"}
                                onChange={onDateChange}
                            />
                        )}

                        {type === "tarea" && (
                            <>
                                <View style={styles.switchContainer}>
                                    <Text>Permitir entregas tardías</Text>
                                    <Switch value={allowLate} onValueChange={setAllowLate} />
                                </View>

                                {allowLate && (
                                    <View style={styles.radioGroup}>
                                        <Text>Política de entregas tardías:</Text>
                                        <RadioButton.Group onValueChange={(value) => setLatePolicy(value as LatePolicy)} value={latePolicy}>
                                            <View style={styles.radioOption}>
                                                <RadioButton value="ninguna" />
                                                <Text>Sin penalización</Text>
                                            </View>
                                            <View style={styles.radioOption}>
                                                <RadioButton value="aceptar_con_descuento" />
                                                <Text>Reducción de calificación</Text>
                                            </View>
                                            <View style={styles.radioOption}>
                                                <RadioButton value="aceptar" />
                                                <Text>Aceptar sin condiciones</Text>
                                            </View>
                                        </RadioButton.Group>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                <Divider style={styles.divider} />

                {type === "examen" && (
                    <>
                        <View style={styles.formSection}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Configuración de tiempo
                            </Text>

                            <View style={styles.switchContainer}>
                                <Text>Habilitar temporizador</Text>
                                <Switch value={hasTimer} onValueChange={setHasTimer} />
                            </View>

                            {hasTimer && (
                                <>
                                    <TextInput
                                        label="Límite de tiempo (minutos)"
                                        value={timeLimit}
                                        onChangeText={setTimeLimit}
                                        keyboardType="numeric"
                                        mode="outlined"
                                        style={styles.input}
                                        error={!!timeLimitError}
                                    />
                                    {!!timeLimitError && <HelperText type="error">{timeLimitError}</HelperText>}
                                </>
                            )}
                        </View>

                        <Divider style={styles.divider} />
                    </>
                )}

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Formato de respuesta
                    </Text>

                    <SegmentedButtons
                        value={answerFormat}
                        onValueChange={(value) => setAnswerFormat(value as AnswerFormat)}
                        buttons={[
                            { value: "archivo", label: "Archivo" },
                            { value: "preguntas_respuestas", label: "Preguntas" },
                        ]}
                        style={styles.segmentedButtons}
                    />

                    {answerFormat === "preguntas_respuestas" && (
                        <View style={styles.questionsSection}>
                            <Text variant="titleSmall" style={styles.questionsTitle}>
                                Preguntas del {type}
                            </Text>

                            {questions.map((question, index) => (
                                <View key={index} style={styles.questionContainer}>
                                    <TextInput
                                        label={`Pregunta ${index + 1}`}
                                        value={question.text}
                                        onChangeText={(text) => updateQuestion(index, text)}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={2}
                                        style={styles.questionInput}
                                    />
                                    {questions.length > 1 && (
                                        <IconButton
                                            icon="delete"
                                            size={20}
                                            onPress={() => removeQuestion(index)}
                                            style={styles.deleteButton}
                                        />
                                    )}
                                </View>
                            ))}

                            <Button mode="outlined" icon="plus" onPress={addQuestion} style={styles.addQuestionButton}>
                                Agregar pregunta
                            </Button>

                            {!!questionsError && <HelperText type="error">{questionsError}</HelperText>}
                        </View>
                    )}

                    {answerFormat === "archivo" && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>Los estudiantes deberán subir un archivo como respuesta.</Text>
                        </View>
                    )}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Archivo adjunto (opcional)
                    </Text>
                    <Text style={styles.helperText}>Puedes adjuntar un archivo que los estudiantes podrán descargar</Text>

                    <Button mode="outlined" icon="attachment" onPress={pickAttachment} style={styles.attachmentButton}>
                        {attachmentFile ? "Cambiar archivo" : "Adjuntar archivo"}
                    </Button>

                    {attachmentFile && (
                        <View style={styles.fileInfo}>
                            <Text style={styles.fileName}>{attachmentFile.name}</Text>
                            <Text style={styles.fileSize}>({(attachmentFile.size / 1024).toFixed(1)} KB)</Text>
                        </View>
                    )}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Publicación
                    </Text>

                    <View style={styles.checkboxContainer}>
                        <Checkbox status={published ? "checked" : "unchecked"} onPress={() => setPublished(!published)} />
                        <Text>Publicar inmediatamente</Text>
                    </View>
                    <Text style={styles.helperText}>Si no está marcado, la actividad se guardará como borrador</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button mode="outlined" onPress={onCancel} style={styles.button} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button mode="contained" onPress={handleSave} style={styles.button} loading={loading} disabled={loading}>
                        {taskId ? "Guardar" : "Crear"}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    title: {
        marginBottom: 16,
        fontWeight: "bold",
    },
    formSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: "bold",
    },
    input: {
        marginBottom: 12,
    },
    divider: {
        marginVertical: 16,
    },
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 8,
    },
    radioGroup: {
        marginVertical: 8,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    helperText: {
        fontSize: 12,
        color: "#666",
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    button: {
        flex: 1,
        marginHorizontal: 8,
    },
    dateButton: {
        marginVertical: 8,
    },
    segmentedButtons: {
        marginBottom: 16,
    },
    infoBox: {
        backgroundColor: "#e3f2fd",
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    infoText: {
        color: "#0d47a1",
    },
    questionsSection: {
        marginTop: 16,
    },
    questionsTitle: {
        marginBottom: 12,
        fontWeight: "bold",
    },
    questionContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    questionInput: {
        flex: 1,
        marginRight: 8,
    },
    deleteButton: {
        marginTop: 8,
    },
    addQuestionButton: {
        marginTop: 8,
        alignSelf: "flex-start",
    },
    attachmentButton: {
        marginVertical: 8,
    },
    fileInfo: {
        marginTop: 8,
        padding: 8,
        backgroundColor: "#f5f5f5",
        borderRadius: 4,
    },
    fileName: {
        fontWeight: "bold",
    },
    fileSize: {
        color: "#666",
        fontSize: 12,
    },
    dateTimeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    dateButtonHalf: {
        flex: 0.48,
    },
})
