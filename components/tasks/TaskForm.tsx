import React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
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
} from "react-native-paper"
import DateTimePicker from "@react-native-community/datetimepicker"
import type { Task, TaskType, LatePolicy, AnswerFormat } from "@/types/Task"

// Import the RichTextEditor component
import { RichTextEditor } from "@/components/tasks/RichTextEditor"

interface TaskFormProps {
    courseId: string
    initialData?: Task
    onSave: (task: any) => void
    onCancel: () => void
    isCreating?: boolean
}

export const TaskForm: React.FC<TaskFormProps> = ({ courseId, initialData, onSave, onCancel, isCreating = false }) => {
    const [title, setTitle] = useState(initialData?.title || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [instructions, setInstructions] = useState(initialData?.instructions || "")
    const [type, setType] = useState<TaskType>(initialData?.type || "tarea")
    const [dueDate, setDueDate] = useState(initialData?.due_date ? new Date(initialData.due_date) : new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [allowLate, setAllowLate] = useState(initialData?.allow_late ?? false)
    const [latePolicy, setLatePolicy] = useState<LatePolicy>(initialData?.late_policy || "ninguna")
    const [hasTimer, setHasTimer] = useState(initialData?.has_timer ?? false)
    const [timeLimit, setTimeLimit] = useState(initialData?.time_limit_minutes?.toString() || "60")
    const [published, setPublished] = useState(initialData?.published ?? false)
    const [allowFileUpload, setAllowFileUpload] = useState(initialData?.allow_file_upload ?? false)
    const [answerFormat, setAnswerFormat] = useState<AnswerFormat>(initialData?.answer_format || "texto")

    // Validation states
    const [titleError, setTitleError] = useState("")
    const [descriptionError, setDescriptionError] = useState("")
    const [instructionsError, setInstructionsError] = useState("")
    const [timeLimitError, setTimeLimitError] = useState("")

    // Add a state for rich text instructions
    const [richInstructions, setRichInstructions] = useState(initialData?.instructions || "")

    const validateForm = () => {
        let isValid = true

        // Validate title
        if (!title.trim()) {
            setTitleError("El título es obligatorio")
            isValid = false
        } else {
            setTitleError("")
        }

        // Validate description
        if (!description.trim()) {
            setDescriptionError("La descripción es obligatoria")
            isValid = false
        } else {
            setDescriptionError("")
        }

        // Validate instructions
        if (!instructions.trim()) {
            setInstructionsError("Las instrucciones son obligatorias")
            isValid = false
        } else {
            setInstructionsError("")
        }

        // Validate time limit if timer is enabled
        if (hasTimer) {
            const timeLimitNum = Number.parseInt(timeLimit, 10)
            if (isNaN(timeLimitNum) || timeLimitNum <= 0) {
                setTimeLimitError("El límite de tiempo debe ser un número positivo")
                isValid = false
            } else {
                setTimeLimitError("")
            }
        }

        return isValid
    }

    // Update the handleSave function to default to file upload for tasks
    const handleSave = async () => {
        if (!validateForm()) {
            return
        }

        try {
            const taskData = {
                // Only include id if we're editing an existing task
                ...(isCreating ? {} : { id: initialData?.id }),
                course_id: courseId,
                created_by: initialData?.created_by || "",
                type,
                title,
                description,
                instructions,
                due_date: dueDate.toISOString(),
                allow_late: allowLate,
                late_policy: latePolicy,
                has_timer: hasTimer,
                time_limit_minutes: hasTimer ? Number.parseInt(timeLimit, 10) : null,
                published,
                visible_from: null, // Not implemented in the form yet
                visible_until: null, // Not implemented in the form yet
                allow_file_upload: true, // Always allow file uploads
                answer_format: "archivo", // Default to file upload format
            }

            onSave(taskData)
        } catch (error) {
            console.error("Error preparing task data:", error)
        }
    }

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false)
        if (selectedDate) {
            setDueDate(selectedDate)
        }
    }

    const formatDate = (date: Date): string => {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="headlineMedium" style={styles.title}>
                    {isCreating ? "Crear" : "Editar"} {type === "tarea" ? "Tarea" : "Examen"}
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

                    {/* Replace the instructions TextInput with RichTextEditor */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Instrucciones
                    </Text>
                    <RichTextEditor
                        initialValue={initialData?.instructions || ""}
                        onValueChange={(value) => {
                            setRichInstructions(value)
                            setInstructions(value) // Keep the original state updated for validation
                        }}
                        placeholder="Escribe las instrucciones detalladas aquí..."
                        height={200}
                    />
                    {!!instructionsError && <HelperText type="error">{instructionsError}</HelperText>}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Fecha de entrega
                    </Text>

                    <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.dateButton} icon="calendar">
                        {formatDate(dueDate)}
                    </Button>

                    {showDatePicker && (
                        <DateTimePicker value={dueDate} mode="datetime" display="default" onChange={onDateChange} />
                    )}

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
                                    <RadioButton value="descontar" />
                                    <Text>Reducción de calificación</Text>
                                </View>
                                <View style={styles.radioOption}>
                                    <RadioButton value="aceptar" />
                                    <Text>Aceptar sin condiciones</Text>
                                </View>
                            </RadioButton.Group>
                        </View>
                    )}
                </View>

                <Divider style={styles.divider} />

                {/* Update the form section for answer format to default to "archivo" and disable other options */}
                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Configuración de respuestas
                    </Text>

                    <View style={styles.radioGroup}>
                        <Text>Formato de respuesta:</Text>
                        <RadioButton.Group onValueChange={(value) => setAnswerFormat(value as AnswerFormat)} value="archivo">
                            <View style={styles.radioOption}>
                                <RadioButton value="archivo" />
                                <Text>Archivo</Text>
                            </View>
                        </RadioButton.Group>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text>Permitir subida de archivos</Text>
                        <Switch value={true} disabled={true} />
                    </View>
                </View>

                {type === "examen" && (
                    <>
                        <Divider style={styles.divider} />

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
                    </>
                )}

                <Divider style={styles.divider} />

                <View style={styles.formSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Publicación
                    </Text>

                    <View style={styles.checkboxContainer}>
                        <Checkbox status={published ? "checked" : "unchecked"} onPress={() => setPublished(!published)} />
                        <Text>Publicar inmediatamente</Text>
                    </View>
                    <Text style={styles.helperText}>
                        Si no está marcado, la actividad se guardará como borrador y los estudiantes no podrán verla.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button mode="outlined" onPress={onCancel} style={styles.button}>
                        Cancelar
                    </Button>
                    <Button mode="contained" onPress={handleSave} style={styles.button}>
                        {isCreating ? "Crear" : "Guardar"}
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
})
