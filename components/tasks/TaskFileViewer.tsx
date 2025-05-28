import React from "react"
import { useState } from "react"
import { View, StyleSheet, Alert, Linking, Dimensions, ScrollView } from "react-native"
import { Text, Button, Card, Portal, Modal, ActivityIndicator, IconButton, Surface } from "react-native-paper"
import { WebView } from "react-native-webview"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import * as Sharing from "expo-sharing"
import { Image } from "expo-image"

interface TaskFileViewerProps {
    fileUrl: string
    fileName: string
}

export const TaskFileViewer: React.FC<TaskFileViewerProps> = ({ fileUrl, fileName }) => {
    const [showPreview, setShowPreview] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [webViewLoading, setWebViewLoading] = useState(true)

    const getFileExtension = (filename: string): string => {
        return filename.split(".").pop()?.toLowerCase() || ""
    }

    const getFileType = (filename: string): string => {
        const extension = getFileExtension(filename)

        if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
            return "image"
        } else if (extension === "pdf") {
            return "pdf"
        } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)) {
            return "office"
        } else if (["txt", "md", "rtf"].includes(extension)) {
            return "text"
        } else if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
            return "video"
        } else if (["mp3", "wav", "aac", "m4a", "ogg"].includes(extension)) {
            return "audio"
        }
        return "other"
    }

    const getFileIcon = (filename: string): string => {
        const fileType = getFileType(filename)

        switch (fileType) {
            case "image":
                return "image"
            case "pdf":
                return "file-pdf-box"
            case "office":
                return "file-document"
            case "text":
                return "file-document-outline"
            case "video":
                return "video"
            case "audio":
                return "music"
            default:
                return "file"
        }
    }

    const handlePreview = () => {
        setShowPreview(true)
    }

    const handleDownload = async () => {
        try {
            setDownloading(true)
            setDownloadProgress(0)

            const { status } = await MediaLibrary.requestPermissionsAsync()
            if (status !== "granted") {
                Alert.alert("Error", "Se necesitan permisos para descargar archivos")
                return
            }

            const timestamp = Date.now()
            const fileExtension = getFileExtension(fileName)
            const uniqueFileName = `${fileName.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExtension}`

            // Create download with progress
            const downloadResumable = FileSystem.createDownloadResumable(
                fileUrl,
                FileSystem.documentDirectory + uniqueFileName,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                    setDownloadProgress(Math.round(progress * 100))
                },
            )

            const result = await downloadResumable.downloadAsync()

            if (result?.uri) {
                const asset = await MediaLibrary.saveToLibraryAsync(result.uri)

                Alert.alert("Descarga completada", `El archivo ${fileName} se ha descargado correctamente`, [
                    { text: "OK" },
                    {
                        text: "Compartir",
                        onPress: async () => {
                            if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(result.uri)
                            }
                        },
                    },
                ])
            }
        } catch (error) {
            console.error("Error downloading file:", error)
            Alert.alert("Error", "No se pudo descargar el archivo. Inténtalo de nuevo.")
        } finally {
            setDownloading(false)
            setDownloadProgress(0)
        }
    }

    const handleExternalOpen = () => {
        Linking.openURL(fileUrl).catch(() => {
            Alert.alert("Error", "No se pudo abrir el archivo")
        })
    }

    const renderPreviewContent = () => {
        const fileType = getFileType(fileName)
        const { width, height } = Dimensions.get("window")
        const contentWidth = width - 40
        const contentHeight = height * 0.8

        switch (fileType) {
            case "image":
                return (
                    <ScrollView
                        style={{ maxHeight: contentHeight }}
                        contentContainerStyle={styles.imageContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <Image
                            source={{ uri: fileUrl }}
                            style={{
                                width: contentWidth,
                                height: contentHeight * 0.9,
                                borderRadius: 8,
                            }}
                            contentFit="contain"
                            placeholder="Cargando imagen..."
                        />
                    </ScrollView>
                )

            case "pdf":
                return (
                    <View style={{ width: contentWidth, height: contentHeight }}>
                        <WebView
                            source={{ uri: fileUrl }}
                            style={{ flex: 1, borderRadius: 8 }}
                            startInLoadingState={true}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#6200ee" />
                                    <Text style={styles.loadingText}>Cargando PDF...</Text>
                                </View>
                            )}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                        />
                    </View>
                )

            case "office":
                return (
                    <View style={{ width: contentWidth, height: contentHeight }}>
                        <WebView
                            source={{ uri: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}` }}
                            style={{ flex: 1, borderRadius: 8 }}
                            startInLoadingState={true}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#6200ee" />
                                    <Text style={styles.loadingText}>Cargando documento...</Text>
                                </View>
                            )}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        />
                    </View>
                )

            case "text":
                return (
                    <View style={{ width: contentWidth, height: contentHeight }}>
                        <WebView
                            source={{ uri: fileUrl }}
                            style={{ flex: 1, borderRadius: 8 }}
                            startInLoadingState={true}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                        />
                    </View>
                )

            default:
                return (
                    <View style={styles.unsupportedContainer}>
                        <Text variant="titleMedium" style={styles.unsupportedTitle}>
                            Vista previa no disponible
                        </Text>
                        <Text style={styles.unsupportedText}>
                            Este tipo de archivo no se puede previsualizar. Puedes descargarlo para abrirlo con una aplicación
                            externa.
                        </Text>
                        <Button mode="contained" onPress={handleExternalOpen} style={styles.openExternalButton}>
                            Abrir externamente
                        </Button>
                    </View>
                )
        }
    }

    return (
        <View style={styles.container}>
            <Card style={styles.fileCard} elevation={2}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.fileHeader}>
                        <View style={styles.fileInfo}>
                            <Text variant="titleMedium" style={styles.fileName} numberOfLines={2}>
                                {fileName}
                            </Text>
                            <Text variant="bodySmall" style={styles.fileType}>
                                {getFileExtension(fileName).toUpperCase()} • Archivo adjunto
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <Button
                            mode="outlined"
                            icon="eye"
                            onPress={handlePreview}
                            style={styles.actionButton}
                            labelStyle={styles.buttonLabel}
                        >
                            Ver archivo
                        </Button>
                        <Button
                            mode="contained"
                            icon="download"
                            onPress={handleDownload}
                            loading={downloading}
                            disabled={downloading}
                            style={styles.actionButton}
                            labelStyle={styles.buttonLabel}
                        >
                            {downloading ? `${downloadProgress}%` : "Descargar"}
                        </Button>
                    </View>
                </Card.Content>
            </Card>

            {/* Preview Modal */}
            <Portal>
                <Modal
                    visible={showPreview}
                    onDismiss={() => setShowPreview(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Surface style={styles.modalSurface}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text variant="titleMedium" style={styles.modalTitle} numberOfLines={1}>
                                {fileName}
                            </Text>
                            <IconButton
                                icon="close"
                                size={24}
                                onPress={() => setShowPreview(false)}
                                style={styles.closeButton}
                                iconColor="#666"
                            />
                        </View>

                        {/* Content */}
                        <View style={styles.previewContainer}>{renderPreviewContent()}</View>

                        {/* Footer Actions */}
                        <View style={styles.modalFooter}>
                            <Button
                                mode="outlined"
                                icon="download"
                                onPress={handleDownload}
                                loading={downloading}
                                disabled={downloading}
                                style={styles.footerButton}
                            >
                                {downloading ? `${downloadProgress}%` : "Descargar"}
                            </Button>
                            <Button mode="text" icon="open-in-new" onPress={handleExternalOpen} style={styles.footerButton}>
                                Abrir externamente
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    fileCard: {
        backgroundColor: "#fff",
    },
    cardContent: {
        padding: 16,
    },
    fileHeader: {
        marginBottom: 16,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontWeight: "600",
        marginBottom: 4,
        color: "#333",
    },
    fileType: {
        color: "#666",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
    },
    buttonLabel: {
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        margin: 0,
    },
    modalSurface: {
        flex: 1,
        backgroundColor: "#fff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        backgroundColor: "#f8f9fa",
    },
    modalTitle: {
        flex: 1,
        fontWeight: "600",
        color: "#333",
    },
    closeButton: {
        margin: 0,
    },
    previewContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    imageContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
    },
    loadingText: {
        marginTop: 12,
        color: "#666",
    },
    unsupportedContainer: {
        alignItems: "center",
        padding: 40,
        backgroundColor: "#fff",
        borderRadius: 8,
        margin: 20,
    },
    unsupportedTitle: {
        marginBottom: 12,
        textAlign: "center",
        color: "#333",
    },
    unsupportedText: {
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
        color: "#666",
    },
    openExternalButton: {
        marginTop: 8,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        backgroundColor: "#f8f9fa",
    },
    footerButton: {
        minWidth: 120,
    },
})
