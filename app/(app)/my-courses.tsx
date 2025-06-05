import { useState, useEffect } from "react"
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native"
import { Text, ActivityIndicator, Snackbar, Button, Chip } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { CourseCard } from "@/components/courses/CourseCard"
import type { Course } from "@/types/Course"
import { courseClient } from "@/api/coursesClient"
import { router } from "expo-router"
import { getItemAsync } from "expo-secure-store"
import { userApi } from "@/api/userApi"
import React from "react"

interface CourseWithRole extends Course {
    role?: "creator" | "titular" | "auxiliar"
    instructorType?: string
}

export default function MyCoursesScreen() {
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<CourseWithRole[]>([])
    const [error, setError] = useState<string | null>(null)
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [refreshing, setRefreshing] = useState(false)
    const [userType, setUserType] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    const fetchCourses = async () => {
        try {
            setLoading(true)
            console.log("Cargando cursos del usuario...")

            const currentUserId = await getItemAsync("userId")
            if (!currentUserId) {
                setError("No se pudo identificar al usuario")
                return
            }
            setUserId(currentUserId)

            const userInfo = await userApi.getUserById(currentUserId)
            const userTypeValue = userInfo?.user?.userType || null
            setUserType(userTypeValue)
            console.log("Tipo de usuario:", userTypeValue)

            let userCourses: CourseWithRole[] = []

            if (userTypeValue === "alumno") {
                console.log("Obteniendo cursos inscritos para el estudiante")
                const enrolledCourses = await courseClient.getCoursesByUserId(currentUserId)

                userCourses = enrolledCourses.map((course: any) => ({
                    ...course,
                    isEnrolled: true,
                }))
            } else if (userTypeValue === "docente") {
                console.log("Obteniendo cursos para el docente")

                // Obtener todos los cursos
                const allCourses = await courseClient.getAllCourses()

                // Obtener cursos donde es instructor (titular o auxiliar)
                let instructorCourseIds: string[] = []
                try {
                    const instructorCoursesResponse = await courseClient.getCoursesByInstructorId(currentUserId)
                    // Verificar si la respuesta es un array o tiene una propiedad data
                    if (Array.isArray(instructorCoursesResponse)) {
                        instructorCourseIds = instructorCoursesResponse
                    } else if (instructorCoursesResponse?.data && Array.isArray(instructorCoursesResponse.data)) {
                        instructorCourseIds = instructorCoursesResponse.data
                    } else {
                        console.warn("Formato inesperado en respuesta de instructor courses:", instructorCoursesResponse)
                        instructorCourseIds = []
                    }
                } catch (error) {
                    console.error("Error obteniendo cursos como instructor:", error)
                    instructorCourseIds = []
                }

                console.log("Instructor course IDs:", instructorCourseIds)

                // Separar cursos creados vs cursos como instructor
                const createdCourses = allCourses.filter((course: Course) => course.creatorId === currentUserId)
                const instructorCourses = allCourses.filter(
                    (course: Course) => instructorCourseIds.includes(course.id) && course.creatorId !== currentUserId,
                )

                console.log("Created courses:", createdCourses.length)
                console.log("Instructor courses:", instructorCourses.length)

                // Obtener información de permisos para cursos como instructor
                const instructorCoursesWithPermissions = await Promise.all(
                    instructorCourses.map(async (course: Course) => {
                        try {
                            const permissions = await courseClient.getInstructorPermissions(course.id, currentUserId)
                            return {
                                ...course,
                                role: permissions.type === "TITULAR" ? "titular" : ("auxiliar" as const),
                                instructorType: permissions.type,
                            }
                        } catch (error) {
                            console.error(`Error getting permissions for course ${course.id}:`, error)
                            return {
                                ...course,
                                role: "auxiliar" as const,
                                instructorType: "AUXILIAR",
                            }
                        }
                    }),
                )

                // Combinar todos los cursos
                userCourses = [
                    ...createdCourses.map((course: Course) => ({
                        ...course,
                        role: "creator" as const,
                    })),
                    ...instructorCoursesWithPermissions,
                ]
            }

            console.log(`Se obtuvieron ${userCourses.length} cursos`)
            setCourses(userCourses)
            setError(null)
        } catch (apiError) {
            console.error("Error al cargar cursos:", apiError)
            setError("No se pudieron cargar tus cursos. Verifica tu conexión.")
            setSnackbarMessage("Error al cargar los cursos. Inténtalo de nuevo.")
            setSnackbarVisible(true)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchCourses()
    }

    const renderCourseItem = ({ item }: { item: CourseWithRole }) => (
        <View style={styles.courseItemContainer}>
            <CourseCard course={item} isStudent={userType === "alumno"} />
            {userType === "docente" && item.role && (
                <View style={styles.roleChipContainer}>
                    <Chip
                        style={[
                            styles.roleChip,
                            item.role === "creator" && styles.creatorChip,
                            item.role === "titular" && styles.titularChip,
                            item.role === "auxiliar" && styles.auxiliarChip,
                        ]}
                        textStyle={styles.roleChipText}
                    >
                        {item.role === "creator" && "Creador"}
                        {item.role === "titular" && "Titular"}
                        {item.role === "auxiliar" && "Auxiliar"}
                    </Chip>
                </View>
            )}
        </View>
    )

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando tus cursos...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    Mis Cursos
                </Text>
                <Text variant="titleMedium" style={styles.subtitle}>
                    {userType === "alumno" ? "Cursos en los que estás inscrito" : "Cursos que has creado y donde eres instructor"}
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Botón para navegar a los cursos favoritos */}
                {userType === "alumno" && (
                    <Button
                        mode="outlined"
                        onPress={() => router.push("/(courses)/favorites")}
                        style={styles.goToFavoritesButton}
                    >
                        Ver cursos favoritos
                    </Button>
                )}
            </View>

            {courses.length > 0 ? (
                <FlatList
                    data={courses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCourseItem}
                    contentContainerStyle={styles.coursesList}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            ) : (
                <View style={styles.noResultsContainer}>
                    <Text variant="titleMedium" style={styles.noResultsText}>
                        {error
                            ? "No se pudieron cargar los cursos. Intenta actualizar."
                            : userType === "alumno"
                                ? "No estás inscrito en ningún curso todavía."
                                : "No has creado ningún curso ni eres instructor en ninguno todavía."}
                    </Text>
                    <Button mode="contained" onPress={() => router.push("/(courses)")} style={styles.exploreButton}>
                        {userType === "alumno" ? "Explorar cursos disponibles" : "Crear un curso"}
                    </Button>
                </View>
            )}

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                action={{
                    label: "OK",
                    onPress: () => setSnackbarVisible(false),
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        padding: 12,
        backgroundColor: "#ffebee",
        borderRadius: 8,
        marginTop: 12,
    },
    errorText: {
        color: "#d32f2f",
        fontSize: 14,
    },
    header: {
        marginBottom: 16,
        marginTop: 50,
    },
    title: {
        fontWeight: "bold",
        color: "#6200ee",
    },
    subtitle: {
        color: "#666",
        marginTop: 4,
    },
    coursesList: {
        paddingBottom: 80,
    },
    courseItemContainer: {
        position: "relative",
        marginBottom: 16,
    },
    roleChipContainer: {
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1,
    },
    roleChip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    creatorChip: {
        backgroundColor: "rgba(76, 175, 80, 0.9)",
    },
    titularChip: {
        backgroundColor: "rgba(33, 150, 243, 0.9)",
    },
    auxiliarChip: {
        backgroundColor: "rgba(255, 152, 0, 0.9)",
    },
    roleChipText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 12,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    noResultsText: {
        textAlign: "center",
        color: "#666",
        marginBottom: 24,
    },
    exploreButton: {
        paddingHorizontal: 16,
    },
    goToFavoritesButton: {
        marginTop: 10,
        borderColor: "#6200ee",
        borderWidth: 1,
    },
})
