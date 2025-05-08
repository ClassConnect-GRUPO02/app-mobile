import React from "react"
import { useState } from "react"
import { View, StyleSheet, Dimensions, Linking, Alert } from "react-native"
import { Text, ActivityIndicator, Button } from "react-native-paper"
import WebView from "react-native-webview"
import { ResizeMode, Video } from "expo-av"
import { Image } from "expo-image"
import type { Resource } from "@/types/Resource"

interface ResourceViewerProps {
    resource: Resource
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({ resource }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Función para abrir enlaces o archivos usando Linking
    const openResourceWithLinking = async (url: string) => {
        try {
            // Verificar si el dispositivo puede abrir la URL
            const supported = await Linking.canOpenURL(url)

            if (supported) {
                // Abrir la URL con la aplicación predeterminada del dispositivo
                await Linking.openURL(url)
            } else {
                Alert.alert("Error", "No se puede abrir este tipo de archivo en tu dispositivo", [{ text: "OK" }])
            }
        } catch (error) {
            console.error("Error al abrir el recurso:", error)
            Alert.alert("Error", "Ocurrió un problema al intentar abrir el recurso", [{ text: "OK" }])
        }
    }

    const renderResourceContent = () => {
        switch (resource.type) {
            case "image":
                return (
                    <Image
                        source={{ uri: resource.url }}
                        style={styles.image}
                        contentFit="contain"
                        onLoadStart={() => setLoading(true)}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false)
                            setError("No se pudo cargar la imagen")
                        }}
                    />
                )

            case "video":
                // Para videos de YouTube, extraer el ID y mostrar en un iframe
                if (resource.url.includes("youtube.com") || resource.url.includes("youtu.be")) {
                    const videoId = extractYouTubeId(resource.url)
                    return (
                        <WebView
                            source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
                            style={styles.webview}
                            onLoadStart={() => setLoading(true)}
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false)
                                setError("No se pudo cargar el video")
                            }}
                        />
                    )
                } else {
                    // Para videos directos
                    return (
                        <Video
                            source={{ uri: resource.url }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            style={styles.video}
                            onLoadStart={() => setLoading(true)}
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false)
                                setError("No se pudo cargar el video")
                            }}
                        />
                    )
                }

            case "document":
                // Para documentos PDF, mostrar en un WebView
                if (resource.url.toLowerCase().endsWith(".pdf")) {
                    return (
                        <WebView
                            source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}` }}
                            style={styles.webview}
                            onLoadStart={() => setLoading(true)}
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setLoading(false)
                                setError("No se pudo cargar el documento")
                            }}
                        />
                    )
                } else {
                    // Para otros tipos de documentos, usar Linking en lugar de FileViewer
                    return (
                        <Button mode="contained" icon="file-document" onPress={() => openResourceWithLinking(resource.url)}>
                            Abrir documento
                        </Button>
                    )
                }

            case "link":
                // Opción 1: Mostrar en WebView (como estaba antes)
                return (
                    <WebView
                        source={{ uri: resource.url }}
                        style={styles.webview}
                        onLoadStart={() => setLoading(true)}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false)
                            setError("No se pudo cargar el enlace")
                        }}
                    />
                )

            default:
                return <Text>Este tipo de recurso no tiene visualización previa disponible</Text>
        }
    }

    // Función para extraer el ID de un video de YouTube
    const extractYouTubeId = (url: string): string => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return match && match[2].length === 11 ? match[2] : ""
    }

    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200ee" />
                    <Text style={styles.loadingText}>Cargando recurso...</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {renderResourceContent()}
        </View>
    )
}

const { width, height } = Dimensions.get("window")

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        overflow: "hidden",
    },
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        zIndex: 10,
    },
    loadingText: {
        marginTop: 10,
        color: "#6200ee",
    },
    errorContainer: {
        padding: 16,
        alignItems: "center",
    },
    errorText: {
        color: "#d32f2f",
    },
    image: {
        width: "100%",
        height: 300,
        backgroundColor: "#e0e0e0",
    },
    video: {
        width: "100%",
        height: 300,
    },
    webview: {
        width: "100%",
        height: 500,
    },
})
