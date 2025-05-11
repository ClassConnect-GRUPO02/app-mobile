import { useState, useEffect } from "react"
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native"
import { Text, ActivityIndicator, Snackbar, Button } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { CourseCard } from "@/components/courses/CourseCard"
import type { Course } from "@/types/Course"
import { courseClient } from "@/api/coursesClient"
import { router } from "expo-router"
import { getItemAsync } from "expo-secure-store"
import React from "react"
import {userApi} from "@/api/userApi";

export default function MyCoursesScreen() {
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<Course[]>([])
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

            let userCourses: Course[] = []

            if (userTypeValue === "alumno") {
                console.log("Obteniendo cursos inscritos para el estudiante")
                const enrolledCourses = await courseClient.getCoursesByUserId(currentUserId)

                userCourses = enrolledCourses.map((course) => ({
                    ...course,
                    isEnrolled: true,
                }))
                console.log("Obteniendo lista de cursos favoritos")

            } else if (userTypeValue === "docente") {
                // para docentes obtener cursos que ha creado
                console.log("Obteniendo cursos creados por el docente")
                const allCourses = await courseClient.getAllCourses()
                userCourses = allCourses.filter((course) => course.creatorId === currentUserId)
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
                    {userType === "alumno" ? "Cursos en los que estás inscrito" : "Cursos que has creado"}
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
                    renderItem={({ item }) => <CourseCard course={item} isStudent={userType === "alumno"}/>}
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
                                : "No has creado ningún curso todavía."}
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
