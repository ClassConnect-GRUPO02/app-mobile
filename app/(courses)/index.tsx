import { useState, useEffect } from "react"
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native"
import { Text, ActivityIndicator, Button, Snackbar, FAB } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import {CourseCard} from "@/components/courses/CourseCard";
import {CourseFilters} from "@/components/courses/CourseFilters";
import React from "react";
import {Course} from "@/types/Course";
import {courseClient} from "@/api/coursesClient";
import { router } from "expo-router"

export default function CoursesScreen() {
    const [loading, setLoading] = useState(true)
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [allCourses, setAllCourses] = useState<Course[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
    const [selectedModality, setSelectedModality] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const fetchCourses = async () => {
        try {
            setLoading(true)
            console.log("Cargando cursos desde la API...")

            const coursesData = await courseClient.getAllCourses()
            console.log(`Se obtuvieron ${coursesData.length} cursos`)

            setAllCourses(coursesData)
            setFilteredCourses(coursesData)
            setError(null)

            if (error) {
                setSnackbarMessage("Conexión con la API restablecida")
                setSnackbarVisible(true)
            }
        } catch (apiError) {
            console.error("Error al cargar cursos:", apiError)
            setSnackbarMessage("No se pudieron cargar los cursos. Verifica la conexión.")
            setSnackbarVisible(true)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [])

    const categories = Array.from(new Set(allCourses.map((course) => course.category)));
    const levels = Array.from(new Set(allCourses.map((course) => course.level)));
    const modalities = Array.from(new Set(allCourses.map((course) => course.modality)));

    // Filtrar cursos cuando cambian los filtros
    useEffect(() => {
        if (loading) return

        let result = [...allCourses]

        // Filtrar por búsqueda
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (course) => course.name.toLowerCase().includes(query) || course.description.toLowerCase().includes(query),
            )
        }

        // Filtrar por categoría
        if (selectedCategory) {
            result = result.filter((course) => course.category === selectedCategory)
        }

        // Filtrar por nivel
        if (selectedLevel) {
            result = result.filter((course) => course.level === selectedLevel)
        }

        // Filtrar por modalidad
        if (selectedModality) {
            result = result.filter((course) => course.modality === selectedModality)
        }

        setFilteredCourses(result)
    }, [searchQuery, selectedCategory, selectedLevel, selectedModality, allCourses])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchCourses()
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando cursos...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    ClassConnect
                </Text>
                <Text variant="titleMedium" style={styles.subtitle}>
                    Explora los cursos disponibles
                </Text>

                <Button
                    mode="outlined"
                    onPress={handleRefresh}
                    style={styles.refreshButton}
                    icon="refresh"
                    loading={refreshing}
                    disabled={refreshing}
                >
                    Actualizar cursos
                </Button>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            <CourseFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                selectedModality={selectedModality}
                onModalityChange={setSelectedModality}
                categories={categories}
                levels={levels}
                modalities={modalities}
            />

            {filteredCourses.length > 0 ? (
                <FlatList
                    data={filteredCourses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <CourseCard course={item} />}
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
                            : "No se encontraron cursos que coincidan con los filtros seleccionados."}
                    </Text>
                    {error && (
                        <Button mode="contained" onPress={handleRefresh} style={styles.retryButton} icon="refresh">
                            Reintentar
                        </Button>
                    )}
                </View>
            )}

            <FAB icon="plus" style={styles.fab} onPress={() => router.push("/(courses)/create")} color="#fff" />

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
        color: "red",
        textAlign: "center",
        fontSize: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontWeight: "bold",
        color: "#6200ee",
    },
    subtitle: {
        color: "#666",
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
        marginBottom: 16,
    },
    refreshButton: {
        marginTop: 8,
        alignSelf: "flex-start",
    },
    retryButton: {
        marginTop: 16,
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: "#6200ee",
    },
})

