import { useState, useEffect } from "react"
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native"
import { Text, ActivityIndicator } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import {CourseCard} from "@/components/courses/CourseCard";
import {CourseFilters} from "@/components/courses/CourseFilters";
import React from "react";
import {Course} from "@/app/data/Course";
import {courseService} from "@/app/clients/CoursesClient";

export default function HomeScreen() {
    const [loading, setLoading] = useState(true)
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [allCourses, setAllCourses] = useState<Course[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
    const [selectedModality, setSelectedModality] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // simula la carga de datos
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                const coursesData = await courseService.getAllCourses()
                setAllCourses(coursesData)
                setFilteredCourses(coursesData)
                setError(null)
            } catch (err) {
                console.error("Error fetching courses:", err)
                setError("No se pudieron cargar los cursos")
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [])

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

    if (loading) {
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
            />

            {filteredCourses.length > 0 ? (
                <FlatList
                    data={filteredCourses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <CourseCard course={item} />}
                    contentContainerStyle={styles.coursesList}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.noResultsContainer}>
                    <Text variant="titleMedium" style={styles.noResultsText}>
                        No se encontraron cursos que coincidan con los filtros seleccionados.
                    </Text>
                </View>
            )}
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
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
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
        paddingBottom: 24,
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
    },
})

