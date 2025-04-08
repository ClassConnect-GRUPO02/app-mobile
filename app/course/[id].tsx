import { StyleSheet, View, ScrollView, Image } from "react-native"
import { Text, Button, Chip, Divider, List } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { courses } from "../data/courses"
import { StatusBar } from "expo-status-bar"
import React from "react"

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const course = courses.find((c) => c.id === id)

    if (!course) {
        return (
            <View style={styles.notFoundContainer}>
                <Text variant="headlineMedium">Curso no encontrado</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    const availableSpots = course.capacity - course.enrolled
    const isFullyBooked = availableSpots === 0

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="light" />

            <Image source={{ uri: course.imageUrl }} style={styles.courseImage} />

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
                        title="Instructor"
                        description={course.instructor.name}
                        left={(props) => <List.Icon {...props} icon="account" />}
                    />

                    <List.Item
                        title="Capacidad"
                        description={`${course.enrolled} / ${course.capacity} estudiantes`}
                        left={(props) => <List.Icon {...props} icon="account-group" />}
                    />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Perfil del instructor
                    </Text>
                    <Text variant="bodyMedium">{course.instructor.profile}</Text>
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
                    {course.isEnrolled ? (
                        <Button mode="contained" style={[styles.button, styles.enrolledButton]} disabled>
                            Ya estás inscrito
                        </Button>
                    ) : isFullyBooked ? (
                        <Button mode="contained" style={[styles.button, styles.fullyBookedButton]} disabled>
                            Sin cupos disponibles
                        </Button>
                    ) : (
                        <Button mode="contained" style={styles.button} onPress={() => console.log("Inscribirse")}>
                            Inscribirse
                        </Button>
                    )}

                    <Button mode="outlined" style={styles.button} onPress={() => router.back()}>
                        Volver
                    </Button>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
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
        marginBottom: 32,
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
})

