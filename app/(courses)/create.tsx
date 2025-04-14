import { useState } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import {
    TextInput,
    Button,
    Text,
    HelperText,
    Divider,
    ActivityIndicator,
    Card,
    Surface,
    Snackbar,
} from "react-native-paper"
import { router } from "expo-router"
import { courseService } from "@/app/clients/CoursesClient"
import type { Course } from "@/app/data/Course"
import { SelectMenu } from "@/components/courses/SelectMenu"
import { DateRangePicker } from "@/components/courses/DateRangePicker"
import { StatusBar } from "expo-status-bar"
import React from "react"

export default function CreateCourseScreen() {
    const [loading, setLoading] = useState(false)
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [snackbarType, setSnackbarType] = useState<"success" | "error">("success")

    const levels = ["Principiante", "Intermedio", "Avanzado"]
    const modalities = ["Online", "Presencial", "Híbrido"]

    const [course, setCourse] = useState<Omit<Course, "id">>({
        name: "",
        shortDescription: "",
        description: "",
        startDate: "",
        endDate: "",
        instructor: {
            name: "",
            profile: "",
        },
        capacity: 0,
        enrolled: 0,
        category: "",
        level: "Principiante",
        modality: "Online",
        prerequisites: [""],
        imageUrl: "",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!course.name) newErrors.name = "El nombre es obligatorio"
        if (!course.shortDescription) newErrors.shortDescription = "La descripción corta es obligatoria"
        if (!course.description) newErrors.description = "La descripción es obligatoria"
        if (!course.startDate) newErrors.startDate = "La fecha de inicio es obligatoria"
        if (!course.endDate) newErrors.endDate = "La fecha de fin es obligatoria"
        if (!course.instructor.name) newErrors.instructorName = "El nombre del instructor es obligatorio"
        if (!course.instructor.profile) newErrors.instructorProfile = "El perfil del instructor es obligatorio"
        if (course.capacity <= 0) newErrors.capacity = "La capacidad debe ser mayor a 0"
        if (!course.category) newErrors.category = "La categoría es obligatoria"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (field: string, value: string | number) => {
        if (field.includes(".")) {
            const [parent, child] = field.split(".")
            if (parent === "instructor") {
                setCourse({
                    ...course,
                    instructor: {
                        ...course.instructor,
                        [child]: value,
                    },
                })
            }
        } else {
            setCourse({ ...course, [field]: value })
        }
    }

    const handleDatesChange = (startDate: string, endDate: string) => {
        setCourse({
            ...course,
            startDate,
            endDate,
        })
    }

    const incrementValue = (field: "capacity" | "enrolled") => {
        if (field === "enrolled" && course.enrolled >= course.capacity) return
        setCourse({
            ...course,
            [field]: Number(course[field]) + 1,
        })
    }

    const decrementValue = (field: "capacity" | "enrolled") => {
        const minValue = field === "capacity" ? 1 : 0
        if (Number(course[field]) <= minValue) return

        // Si estamos reduciendo la capacidad, asegurarse de que no sea menor que los inscritos
        if (field === "capacity" && Number(course[field]) - 1 < course.enrolled) {
            setCourse({
                ...course,
                capacity: Number(course[field]) - 1,
                enrolled: Number(course[field]) - 1,
            })
        } else {
            setCourse({
                ...course,
                [field]: Number(course[field]) - 1,
            })
        }
    }

    const addPrerequisite = () => {
        setCourse({
            ...course,
            prerequisites: [...course.prerequisites, ""],
        })
    }

    const updatePrerequisite = (index: number, value: string) => {
        const updatedPrerequisites = [...course.prerequisites]
        updatedPrerequisites[index] = value
        setCourse({
            ...course,
            prerequisites: updatedPrerequisites,
        })
    }

    const removePrerequisite = (index: number) => {
        const updatedPrerequisites = [...course.prerequisites]
        updatedPrerequisites.splice(index, 1)
        setCourse({
            ...course,
            prerequisites: updatedPrerequisites,
        })
    }

    const showSnackbar = (message: string, type: "success" | "error") => {
        setSnackbarMessage(message)
        setSnackbarType(type)
        setSnackbarVisible(true)
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            showSnackbar("Por favor completa todos los campos requeridos", "error")
            return
        }

        setLoading(true)
        try {
            // Filtrar prerrequisitos vacíos
            const filteredPrerequisites = course.prerequisites.filter((p) => p.trim() !== "")

            const courseToSubmit = {
                ...course,
                prerequisites: filteredPrerequisites,
                capacity: Number(course.capacity),
                enrolled: Number(course.enrolled),
            }

            await courseService.createCourse(courseToSubmit as Course)
            showSnackbar("¡Curso creado correctamente!", "success")

            // Esperar un momento para que el usuario vea el mensaje antes de redirigir
            setTimeout(() => {
                router.push("/(courses)")
            }, 1500)
        } catch (error) {
            console.error("Error al crear el curso:", error)
            showSnackbar("No se pudo crear el curso. Inténtalo de nuevo.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    Crear Nuevo Curso
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Completa el formulario para crear un nuevo curso
                </Text>
            </View>

            <Card style={styles.formCard}>
                <Card.Content>
                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Información Básica
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Nombre del curso *"
                            value={course.name}
                            onChangeText={(value) => handleChange("name", value)}
                            style={styles.input}
                            error={!!errors.name}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                        <TextInput
                            mode="outlined"
                            label="Descripción corta *"
                            value={course.shortDescription}
                            onChangeText={(value) => handleChange("shortDescription", value)}
                            style={styles.input}
                            error={!!errors.shortDescription}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.shortDescription && <HelperText type="error">{errors.shortDescription}</HelperText>}

                        <TextInput
                            mode="outlined"
                            label="Descripción completa *"
                            value={course.description}
                            onChangeText={(value) => handleChange("description", value)}
                            multiline
                            numberOfLines={4}
                            style={styles.textArea}
                            error={!!errors.description}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.description && <HelperText type="error">{errors.description}</HelperText>}
                    </Surface>

                    <Divider style={styles.divider} />

                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Fechas y Capacidad
                        </Text>

                        <DateRangePicker
                            startDate={course.startDate}
                            endDate={course.endDate}
                            onDatesChange={handleDatesChange}
                            startDateError={errors.startDate}
                            endDateError={errors.endDate}
                        />

                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <Text style={styles.inputLabel}>Capacidad *</Text>
                                <View style={styles.numberInputWrapper}>
                                    <TextInput
                                        mode="outlined"
                                        value={course.capacity.toString()}
                                        onChangeText={(value) => handleChange("capacity", Number.parseInt(value) || 0)}
                                        keyboardType="numeric"
                                        style={styles.numberInput}
                                        error={!!errors.capacity}
                                        outlineStyle={styles.inputOutline}
                                        right={
                                            <TextInput.Icon
                                                icon="chevron-up"
                                                size={16}
                                                onPress={() => incrementValue("capacity")}
                                                style={styles.upIcon}
                                            />
                                        }
                                        left={
                                            <TextInput.Icon
                                                icon="chevron-down"
                                                size={16}
                                                onPress={() => decrementValue("capacity")}
                                                style={styles.downIcon}
                                                disabled={course.capacity <= 1}
                                            />
                                        }
                                    />
                                </View>
                                {errors.capacity && <HelperText type="error">{errors.capacity}</HelperText>}
                            </View>

                            <View style={styles.halfColumn}>
                                <Text style={styles.inputLabel}>Inscritos iniciales</Text>
                                <View style={styles.numberInputWrapper}>
                                    <TextInput
                                        mode="outlined"
                                        value={course.enrolled.toString()}
                                        onChangeText={(value) => handleChange("enrolled", Number.parseInt(value) || 0)}
                                        keyboardType="numeric"
                                        style={styles.numberInput}
                                        outlineStyle={styles.inputOutline}
                                        right={
                                            <TextInput.Icon
                                                icon="chevron-up"
                                                size={16}
                                                onPress={() => incrementValue("enrolled")}
                                                style={styles.upIcon}
                                                disabled={course.enrolled >= course.capacity}
                                            />
                                        }
                                        left={
                                            <TextInput.Icon
                                                icon="chevron-down"
                                                size={16}
                                                onPress={() => decrementValue("enrolled")}
                                                style={styles.downIcon}
                                                disabled={course.enrolled <= 0}
                                            />
                                        }
                                    />
                                </View>
                            </View>
                        </View>
                    </Surface>

                    <Divider style={styles.divider} />

                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Información del Instructor
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Nombre del instructor *"
                            value={course.instructor.name}
                            onChangeText={(value) => handleChange("instructor.name", value)}
                            style={styles.input}
                            error={!!errors.instructorName}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.instructorName && <HelperText type="error">{errors.instructorName}</HelperText>}

                        <TextInput
                            mode="outlined"
                            label="Perfil del instructor *"
                            value={course.instructor.profile}
                            onChangeText={(value) => handleChange("instructor.profile", value)}
                            multiline
                            numberOfLines={3}
                            style={styles.textArea}
                            error={!!errors.instructorProfile}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.instructorProfile && <HelperText type="error">{errors.instructorProfile}</HelperText>}
                    </Surface>

                    <Divider style={styles.divider} />

                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Categorización
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Categoría *"
                            value={course.category}
                            onChangeText={(value) => handleChange("category", value)}
                            style={styles.input}
                            error={!!errors.category}
                            outlineStyle={styles.inputOutline}
                        />
                        {errors.category && <HelperText type="error">{errors.category}</HelperText>}

                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <SelectMenu
                                    label="Nivel *"
                                    value={course.level}
                                    options={levels}
                                    onSelect={(value) => handleChange("level", value)}
                                />
                            </View>

                            <View style={styles.halfColumn}>
                                <SelectMenu
                                    label="Modalidad *"
                                    value={course.modality}
                                    options={modalities}
                                    onSelect={(value) => handleChange("modality", value)}
                                />
                            </View>
                        </View>
                    </Surface>

                    <Divider style={styles.divider} />

                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Prerrequisitos
                        </Text>

                        {course.prerequisites.map((prerequisite, index) => (
                            <View key={index} style={styles.prerequisiteContainer}>
                                <TextInput
                                    mode="outlined"
                                    label={`Prerrequisito ${index + 1}`}
                                    value={prerequisite}
                                    onChangeText={(value) => updatePrerequisite(index, value)}
                                    style={styles.prerequisiteInput}
                                    outlineStyle={styles.inputOutline}
                                />
                                <Button
                                    icon="delete"
                                    mode="contained-tonal"
                                    onPress={() => removePrerequisite(index)}
                                    disabled={course.prerequisites.length <= 1}
                                    style={styles.deleteButton}
                                >
                                    {""}
                                </Button>
                            </View>
                        ))}

                        <Button
                            icon="plus"
                            mode="outlined"
                            onPress={addPrerequisite}
                            style={styles.addButton}
                            labelStyle={styles.buttonLabel}
                        >
                            Agregar prerrequisito
                        </Button>
                    </Surface>

                    <Divider style={styles.divider} />

                    <Surface style={styles.sectionSurface}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Imagen del Curso
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="URL de la imagen"
                            value={course.imageUrl}
                            onChangeText={(value) => handleChange("imageUrl", value)}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                        <Text style={styles.helperText}>Deja la URL por defecto o ingresa una URL de imagen válida</Text>
                    </Surface>
                </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
                ) : (
                    <>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            style={styles.submitButton}
                            labelStyle={styles.buttonLabel}
                            icon="check"
                        >
                            Crear Curso
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => router.back()}
                            style={styles.cancelButton}
                            labelStyle={styles.buttonLabel}
                            icon="arrow-left"
                        >
                            Cancelar
                        </Button>
                    </>
                )}
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={[styles.snackbar, snackbarType === "success" ? styles.successSnackbar : styles.errorSnackbar]}
                action={{
                    label: "OK",
                    onPress: () => setSnackbarVisible(false),
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        padding: 16,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontWeight: "bold",
        color: "#6200ee",
        marginBottom: 8,
    },
    subtitle: {
        color: "#666",
        marginBottom: 8,
    },
    formCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        elevation: 2,
    },
    sectionSurface: {
        borderRadius: 12,
        padding: 8,
        marginVertical: 4,
        backgroundColor: "transparent",
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 16,
        color: "#6200ee",
    },
    input: {
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    textArea: {
        marginBottom: 12,
        backgroundColor: "#fff",
        minHeight: 100,
    },
    inputOutline: {
        borderRadius: 8,
    },
    divider: {
        marginVertical: 16,
        height: 1,
        backgroundColor: "#e0e0e0",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: -6,
    },
    halfColumn: {
        flex: 1,
        paddingHorizontal: 6,
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: "#666",
    },
    numberInputWrapper: {
        position: "relative",
        marginBottom: 12,
    },
    numberInput: {
        backgroundColor: "#fff",
        textAlign: "center",
    },
    upIcon: {
        marginRight: 0,
        backgroundColor: "transparent",
    },
    downIcon: {
        marginLeft: 0,
        backgroundColor: "transparent",
    },
    prerequisiteContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    prerequisiteInput: {
        flex: 1,
        marginRight: 8,
        backgroundColor: "#fff",
    },
    deleteButton: {
        borderRadius: 8,
        marginLeft: 8,
    },
    addButton: {
        marginTop: 8,
        borderRadius: 8,
        borderColor: "#6200ee",
    },
    helperText: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    buttonContainer: {
        padding: 16,
        marginBottom: 24,
    },
    submitButton: {
        marginBottom: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#6200ee",
    },
    cancelButton: {
        paddingVertical: 6,
        borderRadius: 8,
        borderColor: "#6200ee",
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "bold",
        paddingVertical: 4,
    },
    loader: {
        marginVertical: 20,
    },
    snackbar: {
        margin: 16,
        borderRadius: 8,
    },
    successSnackbar: {
        backgroundColor: "#4caf50",
    },
    errorSnackbar: {
        backgroundColor: "#f44336",
    },
})
