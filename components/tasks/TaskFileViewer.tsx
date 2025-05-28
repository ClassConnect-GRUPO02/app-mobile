import React from "react"
import { useState } from "react"
import { View, StyleSheet, Alert, Linking, Dimensions, ScrollView, Platform } from "react-native"
import { Text, Button, Card, Portal, Modal, ActivityIndicator, IconButton, Surface } from "react-native-paper"
import { WebView } from "react-native-webview"
import * as FileSystem from "expo-file-system"
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

    const handlePreview = () => {
        setShowPreview(true)
    }

    const downloadToDownloadsFolder = async () => {
        try {
            if (Platform.OS === "android") {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()

                if (!permissions.granted) {
                    Alert.alert("Permisos requeridos", "Se necesitan permisos para acceder a la carpeta de descargas")
                    return null
                }

                const tempUri = FileSystem.documentDirectory + fileName
                const downloadResult = await FileSystem.downloadAsync(fileUrl, tempUri)

                if (downloadResult.uri) {
                    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        getFileType(fileName) === "pdf" ? "application/pdf" : "*/*",
                    )

                    const fileContent = await FileSystem.readAsStringAsync(downloadResult.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    })

                    await FileSystem.writeAsStringAsync(fileUri, fileContent, {
                        encoding: FileSystem.EncodingType.Base64,
                    })

                    await FileSystem.deleteAsync(tempUri, { idempotent: true })

                    return fileUri
                }
            } else {
                const localUri = FileSystem.documentDirectory + fileName
                const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri)
                return downloadResult.uri
            }
        } catch (error) {
            console.error("Error downloading to downloads folder:", error)
            return null
        }
    }

    const downloadToAppDirectory = async () => {
        try {
            const downloadsDir = FileSystem.documentDirectory + "downloads/"
            const dirInfo = await FileSystem.getInfoAsync(downloadsDir)

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true })
            }

            const localUri = downloadsDir + fileName
            const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri)

            return downloadResult.uri
        } catch (error) {
            console.error("Error downloading to app directory:", error)
            return null
        }
    }

    const handleDownload = async () => {
        try {
            setDownloading(true)
            setDownloadProgress(0)

            console.log("Starting download from:", fileUrl)

            const downloadsDir = FileSystem.documentDirectory + "downloads/"
            const dirInfo = await FileSystem.getInfoAsync(downloadsDir)

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true })
            }

            const localUri = downloadsDir + fileName

            const downloadResumable = FileSystem.createDownloadResumable(
                fileUrl,
                localUri,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; TaskApp/1.0)",
                    },
                },
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                    const progressPercent = Math.round(progress * 100)
                    setDownloadProgress(progressPercent)
                },
            )

            const result = await downloadResumable.downloadAsync()
            console.log("Download result:", result)

            if (result?.uri) {
                const fileInfo = await FileSystem.getInfoAsync(result.uri)
                console.log("File info:", fileInfo)

                if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
                    let finalUri = result.uri
                    let locationMessage = "en la carpeta de la aplicación"

                    if (Platform.OS === "android") {
                        try {
                            const systemDownloadUri = await downloadToDownloadsFolder()
                            if (systemDownloadUri) {
                                finalUri = systemDownloadUri
                                locationMessage = "en la carpeta de Descargas"
                            }
                        } catch (error) {
                            console.log("Could not save to system downloads, keeping in app folder")
                        }
                    }

                    Alert.alert(
                        "Descarga completada",
                        `El archivo ${fileName} se ha descargado correctamente ${locationMessage}`,
                        [
                            { text: "OK" },
                            {
                                text: "Compartir",
                                onPress: async () => {
                                    try {
                                        if (await Sharing.isAvailableAsync()) {
                                            await Sharing.shareAsync(finalUri, {
                                                mimeType: getFileType(fileName) === "pdf" ? "application/pdf" : undefined,
                                                dialogTitle: `Compartir ${fileName}`,
                                            })
                                        }
                                    } catch (shareError) {
                                        console.error("Error sharing file:", shareError)
                                    }
                                },
                            },
                            {
                                text: "Ver ubicación",
                                onPress: () => {
                                    Alert.alert(
                                        "Ubicación del archivo",
                                        Platform.OS === "android"
                                            ? "El archivo está en la carpeta de Descargas de tu dispositivo"
                                            : "El archivo está en la carpeta de documentos de la aplicación. Puedes acceder a él usando la opción 'Compartir'",
                                        [{ text: "OK" }],
                                    )
                                },
                            },
                        ],
                    )
                } else {
                    throw new Error("El archivo descargado está vacío o corrupto")
                }
            } else {
                throw new Error("No se pudo completar la descarga")
            }
        } catch (error) {
            console.error("Error downloading file:", error)

            let errorMessage = "No se pudo descargar el archivo."
            if (error.message?.includes("Network")) {
                errorMessage = "Error de conexión. Verifica tu internet e inténtalo de nuevo."
            } else if (error.message?.includes("permission")) {
                errorMessage = "Error de permisos. Verifica los permisos de la app."
            } else if (error.message?.includes("space")) {
                errorMessage = "No hay suficiente espacio en el dispositivo."
            }

            Alert.alert("Error de descarga", errorMessage, [
                { text: "OK" },
                {
                    text: "Abrir externamente",
                    onPress: handleExternalOpen,
                },
            ])
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
                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}` }}
                            style={{ flex: 1, borderRadius: 8 }}
                            startInLoadingState={true}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent
                                console.error("WebView error: ", nativeEvent)
                                Alert.alert("Error", "No se pudo cargar el PDF. Intenta descargarlo.")
                            }}
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#6200ee" />
                                    <Text style={styles.loadingText}>Cargando PDF...</Text>
                                </View>
                            )}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                            scalesPageToFit={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
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
