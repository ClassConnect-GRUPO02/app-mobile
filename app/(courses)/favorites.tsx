import React, { useEffect, useState } from "react"
import { View, FlatList, StyleSheet, SafeAreaView, TextInput } from "react-native"
import { Text, ActivityIndicator, Snackbar } from "react-native-paper"
import { getItemAsync } from "expo-secure-store"
import { courseClient } from "@/api/coursesClient"
import { CourseCard } from "@/components/courses/CourseCard"
import type { Course } from "@/types/Course"
import { Button } from "react-native-paper"

export default function FavoriteCoursesScreen() {
    const [loading, setLoading] = useState(true)
    const [favorites, setFavorites] = useState<Course[]>([])
    const [filteredFavorites, setFilteredFavorites] = useState<Course[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [category, setCategory] = useState("")
    const [level, setLevel] = useState("")
    const [modality, setModality] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const [page, setPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    const paginatedCourses = filteredFavorites.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    const fetchFavoriteCourses = async () => {
        try {
            setLoading(true)
            const userId = await getItemAsync("userId")
            if (!userId) throw new Error("No se encontró el usuario")

            const favoriteIds = await courseClient.getFavoriteCourses(userId)

            const courseRequests = favoriteIds.map(id => courseClient.getCourseById(id))
            const favoriteCourses = await Promise.all(courseRequests)

            setFavorites(favoriteCourses)
            setFilteredFavorites(favoriteCourses)
            setError(null)
        } catch (e) {
            console.error(e)
            setError("No se pudieron cargar los cursos favoritos.")
            setSnackbarVisible(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFavoriteCourses()
    }, [])

    useEffect(() => {
        const filtered = favorites.filter(course => {
            const matchesName = course.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = category ? course.category === category : true
            const matchesLevel = level ? course.level === level : true
            const matchesModality = modality ? course.modality === modality : true
            return matchesName && matchesCategory && matchesLevel && matchesModality
        })
        setFilteredFavorites(filtered)
        setPage(1) // Reset page when search query changes
    }, [searchQuery, category, level, modality, favorites])

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" />
                <Text>Cargando cursos favoritos...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Cursos Favoritos</Text>

            <TextInput
                placeholder="Filtrar por nombre"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
            />

            <FlatList
                data={paginatedCourses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CourseCard course={item} isStudent={true} />}
                contentContainerStyle={styles.list}
            />
            {paginatedCourses.length === 0 && (
            <Text style={{ textAlign: "center", marginTop: 20 }}>
                No se encontraron cursos favoritos.
            </Text>
            )}

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {error}
            </Snackbar>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <Button disabled={page === 1} onPress={() => setPage(prev => prev - 1)}>Anterior</Button>
                <Button disabled={page * ITEMS_PER_PAGE >= filteredFavorites.length} onPress={() => setPage(prev => prev + 1)}>Siguiente</Button>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    list: {
        paddingBottom: 100,
    },
    searchInput: {
        marginBottom: 16,
        backgroundColor: "#f0f0f0",
        padding: 12,
        borderRadius: 8,
    },
})
