import { StyleSheet, View, ScrollView, Image, Alert } from "react-native"
import { Text, Button, Chip, Divider, List, ActivityIndicator, FAB } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { courseClient } from "@/api/coursesClient"
import { useState, useEffect } from "react"
import type { Course } from "@/types/Course"
import { StatusBar } from "expo-status-bar"
import React from "react"
import {userApi} from "@/api/userApi";

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [enrolling, setEnrolling] = useState(false)
    const [instructorName, setInstructorName] = useState<string>("No especificado")

    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isInstructor, setIsInstructor] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [userType, setUserType] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourseAndUserStatus = async () => {
            try {
                setLoading(true)

                // Obtener el ID del usuario actual
                const userId = await userApi.getUserId()
                if (!userId) {
                    throw new Error("No se pudo obtener el ID del usuario")
                }
                console.log("el usuario es id", userId)

                // Obtener información del usuario
                const userInfo = await userApi.getUserById(userId)
                setUserType(userInfo?.user?.userType)

                const courseData = await courseClient.getCourseById(id)
                if (!courseData) {
                    throw new Error("No se pudo cargar el curso")
                }

                // Obtener el nombre del creador desde la API de usuarios
                if (courseData.creatorId) {
                    try {
                        const creatorInfo = await userApi.getUserById(courseData.creatorId)
                        if (creatorInfo?.user?.name) {
                            setInstructorName(creatorInfo.user.name)
                        }
                    } catch (error) {
                        console.error("Error al obtener información del creador:", error)
                    }
                }

                setCourse(courseData)

                // Verificar si el usuario es el creador del curso
                setIsCreator(courseData.creatorId === userId)

                const instructorStatus = await courseClient.isInstructorInCourse(id, userId)
                setIsInstructor(instructorStatus.isInstructor)

                const enrollmentStatus = await courseClient.isEnrolledInCourse(id, userId)
                setIsEnrolled(enrollmentStatus.isEnrolled)
            } catch (err) {
                console.error("Error al cargar el curso:", err)
                setError("No se pudo cargar la información del curso")
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchCourseAndUserStatus()
        }
    }, [id])

    useEffect(() => {
        console.log("EL USUARIO ES", userType)
    }, [userType])

    const handleDelete = () => {
        Alert.alert(
            "Eliminar curso",
            "¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true)
                            await courseClient.deleteCourse(id)
                            Alert.alert("Éxito", "El curso ha sido eliminado correctamente", [
                                { text: "OK", onPress: () => router.replace("/(courses)") },
                            ])
                        } catch (error) {
                            console.error("Error al eliminar el curso:", error)
                            Alert.alert("Error", "No se pudo eliminar el curso. Inténtalo de nuevo.")
                            setDeleting(false)
                        }
                    },
                },
            ],
        )
    }

    const handleEdit = () => {
        router.push({
            pathname: "/(courses)/edit",
            params: { id: id },
        })
    }

    const handleEnroll = async () => {
        try {
            setEnrolling(true)
            const userId = await userApi.getUserId()

            if (!userId) {
                Alert.alert("Error", "Debes iniciar sesión para inscribirte en un curso")
                return
            }

            await courseClient.enrollStudentInCourse(id, userId)
            setIsEnrolled(true)

            // Actualizar el contador de inscritos en el curso
            if (course) {
                setCourse({
                    ...course,
                    enrolled: course.enrolled + 1,
                })
            }

            Alert.alert("Éxito", "Te has inscrito correctamente en el curso")
        } catch (error) {
            console.error("Error al inscribirse en el curso:", error)
            Alert.alert("Error", "No se pudo completar la inscripción. Inténtalo de nuevo.")
        } finally {
            setEnrolling(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando curso...</Text>
            </View>
        )
    }

    if (error || !course) {
        return (
            <View style={styles.notFoundContainer}>
                <Text variant="headlineMedium">Curso no encontrado</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    // Asegurarse de que course.instructor existe
    if (!course.instructor) {
        course.instructor = {
            name: "No especificado",
        }
    }

    const availableSpots = course.capacity - course.enrolled
    const isFullyBooked = availableSpots === 0
    const isStudent = userType === "alumno"
    const isTeacher = userType === "docente"
    console.log({
        userType,      // ► debería ser "alumno"
        isStudent,     // ► true?
        isInstructor,  // ► false?
        isEnrolled,    // ► false?
        isFullyBooked, // ► false?
    });


    return (
        <View style={styles.container}>
            <ScrollView>
                <StatusBar style="light" />

                <Image
                    source={{
                        uri:
                            course.imageUrl ||
                            "https://www.svgrepo.com/show/441689/page-not-found.svg",
                    }}
                    style={styles.courseImage}
                />

                <View style={styles.contentContainer}>
                    <Text variant="headlineSmall" style={styles.title}>
                        {course.name}
                    </Text>

                    <View style={styles.chipContainer}>
                        <Chip style={styles.chip}>{course.category}</Chip>
                        <Chip style={styles.chip}>{course.level}</Chip>
                        <Chip style={styles.chip}>{course.modality}</Chip>
                    </View>

                    <View style={styles.section}>
                        <Text variant="bodyLarge" style={styles.description}>
                            {course.description}
                        </Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Detalles del curso
                        </Text>

                        <List.Item
                            title="Fechas"
                            description={`${new Date(course.startDate).toLocaleDateString()} - ${new Date(course.endDate).toLocaleDateString()}`}
                            left={(props) => <List.Icon {...props} icon="calendar" />}
                        />

                        <List.Item
                            title="Docente"
                            description={instructorName}
                            left={(props) => <List.Icon {...props} icon="account" />}
                        />

                        <List.Item
                            title="Capacidad"
                            description={`${course.enrolled} / ${course.capacity} estudiantes`}
                            left={(props) => <List.Icon {...props} icon="account-group" />}
                        />
                    </View>

                    {course.prerequisites.length > 0 && (
                        <>
                            <Divider style={styles.divider} />

                            <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Requisitos previos
                                </Text>
                                {course.prerequisites.map((prerequisite, index) => (
                                    <List.Item
                                        key={index}
                                        title={prerequisite}
                                        left={(props) => <List.Icon {...props} icon="check-circle" />}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    <View style={styles.actionContainer}>
                        {isStudent &&
                            !isInstructor &&
                            (isEnrolled ? (
                                <Button mode="contained" style={[styles.button, styles.enrolledButton]} disabled>
                                    Ya estás inscrito
                                </Button>
                            ) : isFullyBooked ? (
                                <Button mode="contained" style={[styles.button, styles.fullyBookedButton]} disabled>
                                    Sin cupos disponibles
                                </Button>
                            ) : (
                                <Button
                                    mode="contained"
                                    style={styles.button}
                                    onPress={handleEnroll}
                                    loading={enrolling}
                                    disabled={enrolling}
                                >
                                    Inscribirse
                                </Button>
                            ))}

                        <Button mode="outlined" style={styles.button} onPress={() => router.back()}>
                            Volver
                        </Button>
                    </View>
                </View>
            </ScrollView>

            {isCreator && (
                <View style={styles.fabContainer}>
                    <FAB
                        icon="delete"
                        style={[styles.fab, styles.fabDelete]}
                        onPress={handleDelete}
                        color="#fff"
                        small
                        loading={deleting}
                        disabled={deleting}
                    />
                    <FAB icon="pencil" style={[styles.fab, styles.fabEdit]} onPress={handleEdit} color="#fff" small />
                </View>
            )}
        </View>
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
        padding: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    notFoundContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    courseImage: {
        width: "100%",
        height: 250,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 16,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    section: {
        marginVertical: 8,
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    description: {
        lineHeight: 24,
    },
    divider: {
        marginVertical: 16,
    },
    actionContainer: {
        marginTop: 24,
        marginBottom: 16,
    },
    button: {
        marginBottom: 12,
        paddingVertical: 6,
    },
    enrolledButton: {
        backgroundColor: "#4caf50",
    },
    fullyBookedButton: {
        backgroundColor: "#9e9e9e",
    },
    backButton: {
        marginTop: 16,
    },
    fabContainer: {
        position: "absolute",
        right: 16,
        bottom: 16,
        alignItems: "center",
    },
    fab: {
        marginBottom: 8,
        elevation: 4,
    },
    fabEdit: {
        backgroundColor: "#6200ee",
    },
    fabDelete: {
        backgroundColor: "#f44336",
    },
})
