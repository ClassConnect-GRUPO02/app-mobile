import React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { TextInput, Button, Text, HelperText, Card, ActivityIndicator } from "react-native-paper"
import type { Module, ModuleCreationData } from "@/types/Module"
import {moduleClient} from "@/api/modulesClient";

interface ModuleFormProps {
  courseId: string
  initialData?: Module
  onSave: (module: Module) => void
  onCancel: () => void
}

export const ModuleForm: React.FC<ModuleFormProps> = ({ courseId, initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [url, setUrl] = useState(initialData?.url || "")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!initialData

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "El nombre del módulo es obligatorio"
    }

    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      let savedModule: Module | null

      if (isEditing && initialData) {
        // Actualizar módulo existente
        savedModule = await moduleClient.updateModule(courseId, initialData.id, {
          name,
          description,
          url,
        })
      } else {
        // Crear nuevo módulo
        const moduleData: ModuleCreationData = {
          name,
          description,
          url,
          courseId,
          order: 9999, // Se asignará al final de la lista
        }

        savedModule = await moduleClient.createModule(courseId, moduleData)
      }

      if (savedModule) {
        Alert.alert(
            isEditing ? "Módulo actualizado" : "Módulo creado",
            isEditing ? "El módulo se ha actualizado correctamente" : "El módulo se ha creado correctamente",
            [{ text: "OK", onPress: () => onSave(savedModule!) }],
        )
      } else {
        setErrors({
          form: isEditing
              ? "No se pudo actualizar el módulo. Inténtalo de nuevo."
              : "No se pudo crear el módulo. Inténtalo de nuevo.",
        })
      }
    } catch (error) {
      console.error("Error al guardar módulo:", error)
      setErrors({
        form: "Ocurrió un error al procesar la solicitud",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {isEditing ? "Editar módulo" : "Crear nuevo módulo"}
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <Card style={styles.card}>
            <Card.Content>
              {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

              <TextInput
                  label="Nombre del módulo *"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  error={!!errors.name}
                  disabled={loading}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}

              <TextInput
                  label="Descripción *"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  error={!!errors.description}
                  disabled={loading}
              />
              {errors.description && <HelperText type="error">{errors.description}</HelperText>}

              <TextInput
                  label="URL (opcional)"
                  value={url}
                  onChangeText={setUrl}
                  style={styles.input}
                  disabled={loading}
                  placeholder="URL opcional para el módulo"
              />

              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={onCancel} style={styles.button} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.button}
                    loading={loading}
                    disabled={loading}
                >
                  {isEditing ? "Actualizar" : "Crear"}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6200ee" />
              <Text style={styles.loadingText}>{isEditing ? "Actualizando módulo..." : "Creando módulo..."}</Text>
            </View>
        )}
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#6200ee",
  },
  scrollContainer: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    minHeight: 100,
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6200ee",
  },
})
