import React from "react"
import { StyleSheet, View, TouchableOpacity } from "react-native"
import { Card, Text, Chip, Badge } from "react-native-paper"
import { router } from "expo-router"
import {Course} from "@/app/data/Course";

interface CourseCardProps {
    course: Course
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const availableSpots = course.capacity - course.enrolled
    const isFullyBooked = availableSpots === 0
    const hasLimitedSpots = availableSpots <= 5 && !isFullyBooked

    const handlePress = () => {
        router.push({
            pathname: "/course/[id]",
            params: { id: course.id },
        })
    }

    return (
        <TouchableOpacity onPress={handlePress} style={styles.cardContainer}>
            <Card style={styles.card}>
                <Card.Cover source={{ uri: course.imageUrl }} style={styles.cardImage} />
                {course.isEnrolled && <Badge style={styles.enrolledBadge}>Inscripto</Badge>}
                <Card.Content style={styles.cardContent}>
                    <Text variant="titleMedium" style={styles.title}>
                        {course.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                        {course.shortDescription}
                    </Text>

                    <View style={styles.detailsContainer}>
                        <View style={styles.chipContainer}>
                            <Chip style={styles.chip} textStyle={styles.chipText}>
                                {course.level}
                            </Chip>
                            <Chip style={styles.chip} textStyle={styles.chipText}>
                                {course.modality}
                            </Chip>
                        </View>

                        <View style={styles.dateContainer}>
                            <Text variant="bodySmall" style={styles.dates}>
                                {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statusContainer}>
                        {isFullyBooked ? (
                            <Text variant="bodySmall" style={styles.fullyBooked}>
                                Sin cupos disponibles
                            </Text>
                        ) : hasLimitedSpots ? (
                            <Text variant="bodySmall" style={styles.limitedSpots}>
                                ¡Últimos {availableSpots} cupos!
                            </Text>
                        ) : (
                            <Text variant="bodySmall" style={styles.availableSpots}>
                                {availableSpots} cupos disponibles
                            </Text>
                        )}
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        width: "100%",
        marginBottom: 16,
    },
    card: {
        borderRadius: 12,
        overflow: "hidden",
    },
    cardImage: {
        height: 150,
    },
    cardContent: {
        padding: 12,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    description: {
        marginBottom: 12,
        color: "#555",
    },
    detailsContainer: {
        marginTop: 8,
    },
    chipContainer: {
        flexDirection: "row",
        marginBottom: 8,
    },
    chip: {
        marginRight: 8,
        backgroundColor: "#f0f0f0",
    },
    chipText: {
        fontSize: 12,
    },
    dateContainer: {
        marginBottom: 8,
    },
    dates: {
        color: "#666",
    },
    statusContainer: {
        marginTop: 8,
    },
    availableSpots: {
        color: "#2e7d32",
    },
    limitedSpots: {
        color: "#ed6c02",
        fontWeight: "bold",
    },
    fullyBooked: {
        color: "#d32f2f",
        fontWeight: "bold",
    },
    enrolledBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "#4caf50",
        color: "white",
    },
})

