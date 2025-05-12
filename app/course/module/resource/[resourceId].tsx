import { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { Text, Button, Card, ActivityIndicator, IconButton } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { resourceClient } from "@/api/resourceClient"
import type { Resource } from "@/types/Resource"
import { StatusBar } from "expo-status-bar"
import { ResourceViewer } from "@/components/resources/ResourceViewer"
import React from "react"

export default function ResourceDetailScreen() {
    const { resourceId, moduleId } = useLocalSearchParams<{ resourceId: string; moduleId: string }>()
    const [resource, setResource] = useState<Resource | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchResource = async () => {
            try {
                setLoading(true)

                if (!resourceId || !moduleId) {
                    throw new Error("ID de recurso o módulo no proporcionado")
                }

                // Obtener todos los recursos del módulo
                const resources = await resourceClient.getResourcesByModuleId(moduleId)

                // Encontrar el recurso específico
                const foundResource = resources.find((r) => r.id === resourceId)

                if (!foundResource) {
                    throw new Error("Recurso no encontrado")
                }

                setResource(foundResource)
            } catch (err) {
                console.error("Error al cargar el recurso:", err)
                setError("No se pudo cargar la información del recurso")
            } finally {
                setLoading(false)
            }
        }

        fetchResource()
    }, [resourceId, moduleId])

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Cargando recurso...</Text>
            </View>
        )
    }

    if (error || !resource) {
        return (
            <View style={styles.errorContainer}>
                <Text variant="headlineMedium" style={styles.errorTitle}>
                    Recurso no encontrado
                </Text>
                <Text style={styles.errorText}>{error || "No se pudo cargar el recurso solicitado"}</Text>
                <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
                    Volver
                </Button>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={styles.backIcon} />
                    <Text variant="headlineMedium" style={styles.title}>
                        {resource.description}
                    </Text>
                </View>

                <Card style={styles.resourceCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.resourceType}>
                            Tipo: {resource.type}
                        </Text>

                        <View style={styles.viewerContainer}>
                            <ResourceViewer resource={resource} />
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorTitle: {
        marginBottom: 12,
        color: "#d32f2f",
    },
    errorText: {
        textAlign: "center",
        marginBottom: 20,
        color: "#666",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    backIcon: {
        margin: 0,
        marginRight: 8,
    },
    title: {
        flex: 1,
        fontWeight: "bold",
        color: "#6200ee",
    },
    resourceCard: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
    },
    resourceType: {
        marginBottom: 16,
        color: "#666",
    },
    viewerContainer: {
        marginTop: 16,
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 300,
    },
    backButton: {
        marginTop: 16,
    },
})
