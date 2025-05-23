import React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native"
import { TextInput, Button, Text, HelperText, Card, RadioButton } from "react-native-paper"
import * as DocumentPicker from "expo-document-picker"
import * as ImagePicker from "expo-image-picker"
import { resourceClient } from "@/api/resourceClient"
import { supabaseClient } from "@/api/supabaseClient"
import type { Resource, ResourceType, ResourceCreationData } from "@/types/Resource"

// Add router import
import { router } from "expo-router"

interface ResourceFormProps {
  moduleId: string
  courseId: string
  initialData?: Resource
  onSave: (resource: Resource) => void
  onCancel: () => void
}

export const ResourceForm: React.FC<ResourceFormProps> = ({ moduleId, courseId, initialData, onSave, onCancel }) => {
  const [description, setDescription] = useState(initialData?.description || "")
  const [type, setType] = useState<ResourceType>((initialData?.type as ResourceType) || "link")
  const [url, setUrl] = useState(initialData?.url || "")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null)

  const isEditing = !!initialData

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    }

    if (!url.trim() && type !== "document" && type !== "image" && !selectedFile) {
      newErrors.url = "La URL es obligatoria"
    }

    if ((type === "document" || type === "image") && !selectedFile && !url.trim()) {
      newErrors.file = "Debes seleccionar un archivo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return
      }

      const file = result.assets[0]
      console.log("Documento seleccionado:", file)

      setSelectedFile({
        uri: file.uri,
        name: file.name || "documento",
      })
    } catch (error) {
      console.error("Error al seleccionar documento:", error)
      Alert.alert("Error", "No se pudo seleccionar el documento")
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la galería para seleccionar imágenes")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets[0]
      console.log("Imagen seleccionada:", asset)

      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || "imagen.jpg",
      })
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const handleSelectFile = async () => {
    if (type === "document") {
      await pickDocument()
    } else if (type === "image") {
      await pickImage()
    }
  }

  const uploadFile = async (uri: string, fileName: string): Promise<string | null> => {
    try {
      setUploadProgress(0)
      console.log("Intentando subir archivo:", { uri, fileName })

      // Verificar que el archivo existe
      if (Platform.OS === "web") {
        // En web, no podemos verificar la existencia del archivo de la misma manera
        console.log("Subiendo archivo en web")
      } else {
        console.log("Verificando existencia del archivo en dispositivo")
      }

      // Simulamos progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 300)

      // Subir archivo a Supabase
      const fileUrl = await supabaseClient.uploadFile(uri, courseId, fileName)

      clearInterval(progressInterval)

      if (fileUrl) {
        console.log("Archivo subido exitosamente:", fileUrl)
        setUploadProgress(100)
        return fileUrl
      } else {
        console.error("Error: No se pudo obtener URL del archivo subido")
        setUploadProgress(0)
        return null
      }
    } catch (error) {
      console.error("Error al subir archivo:", error)
      setUploadProgress(0)
      return null
    }
  }

  // Update the handleSubmit function to navigate to the resource detail screen
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      let resourceUrl = url

      // Si es un documento o imagen y hay un archivo seleccionado, subir primero
      if ((type === "document" || type === "image") && selectedFile) {
        console.log("Preparando para subir archivo:", selectedFile)
        const uploadedUrl = await uploadFile(selectedFile.uri, selectedFile.name)

        if (!uploadedUrl) {
          setErrors({
            form: "No se pudo subir el archivo. Inténtalo de nuevo.",
          })
          setLoading(false)
          return
        }

        resourceUrl = uploadedUrl
      }

      let savedResource: Resource | null

      if (isEditing && initialData) {
        // Actualizar recurso existente
        savedResource = await resourceClient.updateResource(moduleId, initialData.id, {
          description,
          type,
          url: resourceUrl,
        })
      } else {
        // Crear nuevo recurso
        const resourceData: ResourceCreationData = {
          description,
          type,
          url: resourceUrl,
          moduleId,
          order: 9999, // Se asignará al final de la lista
        }

        savedResource = await resourceClient.createResource(moduleId, resourceData)
      }

      if (savedResource) {
        onSave(savedResource)

        // Navigate to the resource detail screen if it's a new resource
        if (!isEditing && savedResource) {
          router.push({
            pathname: "/course/module/resource/[resourceId]",
            params: { resourceId: savedResource.id, moduleId },
          })
        }
      } else {
        setErrors({
          form: isEditing
              ? "No se pudo actualizar el recurso. Inténtalo de nuevo."
              : "No se pudo crear el recurso. Inténtalo de nuevo.",
        })
      }
    } catch (error) {
      console.error("Error al guardar recurso:", error)
      setErrors({
        form: "Ocurrió un error al procesar la solicitud",
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              {isEditing ? "Editar recurso" : "Crear nuevo recurso"}
            </Text>

            {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

            <TextInput
                label="Descripción del recurso *"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                error={!!errors.description}
                disabled={loading}
            />
            {errors.description && <HelperText type="error">{errors.description}</HelperText>}

            <Text style={styles.sectionTitle}>Tipo de recurso *</Text>
            <RadioButton.Group onValueChange={(value) => setType(value as ResourceType)} value={type}>
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton value="link" disabled={loading} />
                  <Text>Enlace</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="video" disabled={loading} />
                  <Text>Video</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="document" disabled={loading} />
                  <Text>Documento</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="image" disabled={loading} />
                  <Text>Imagen</Text>
                </View>
              </View>
            </RadioButton.Group>

            {(type === "link" || type === "video") && (
                <>
                  <TextInput
                      label="URL *"
                      value={url}
                      onChangeText={setUrl}
                      style={styles.input}
                      error={!!errors.url}
                      disabled={loading}
                      placeholder={type === "video" ? "https://www.youtube.com/watch?v=..." : "https://..."}
                  />
                  {errors.url && <HelperText type="error">{errors.url}</HelperText>}
                </>
            )}

            {(type === "document" || type === "image") && (
                <View style={styles.fileSection}>
                  <Button
                      mode="outlined"
                      icon={type === "document" ? "file-document" : "image"}
                      onPress={handleSelectFile}
                      style={styles.fileButton}
                      disabled={loading}
                  >
                    {type === "document" ? "Seleccionar documento" : "Seleccionar imagen"}
                  </Button>

                  {selectedFile && <Text style={styles.fileName}>Archivo seleccionado: {selectedFile.name}</Text>}

                  {errors.file && <HelperText type="error">{errors.file}</HelperText>}

                  {uploadProgress > 0 && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                        <Text style={styles.progressText}>{uploadProgress}%</Text>
                      </View>
                  )}
                </View>
            )}

            <View style={styles.buttonContainer}>
              <Button mode="outlined" onPress={onCancel} style={styles.button} disabled={loading}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSubmit} style={styles.button} loading={loading} disabled={loading}>
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
    color: "#6200ee",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 8,
  },
  fileSection: {
    marginBottom: 16,
  },
  fileButton: {
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  progressContainer: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6200ee",
  },
  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  formError: {
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
})
