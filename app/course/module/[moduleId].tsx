import { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView, Alert, Linking } from "react-native"
import { Text, Button, Card, ActivityIndicator, IconButton, Divider, FAB, Modal } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { courseClient } from "@/api/coursesClient"
import type { Module } from "@/types/Module"
import { StatusBar } from "expo-status-bar"
import { ResourceList } from "@/components/resources/ResourceList"
import { ResourceForm } from "@/components/resources/ResourceForm"
import React from "react"
import {Resource} from "@/types/Resource";
import {userApi} from "@/api/userApi";
import {moduleClient} from "@/api/modulesClient";

export default function ModuleDetailScreen() {
  const { moduleId, courseId } = useLocalSearchParams<{ moduleId: string; courseId: string }>()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  useEffect(() => {
    const fetchModuleAndPermissions = async () => {
      try {
        setLoading(true)

        if (!moduleId || !courseId) {
          throw new Error("ID de módulo o curso no proporcionado")
        }

        // Obtener el módulo
        const moduleData = await moduleClient.getModuleById(courseId, moduleId)
        if (!moduleData) {
          throw new Error("No se pudo cargar el módulo")
        }

        setModule(moduleData)

        // Verificar si el usuario es el creador del curso
        const userId = await userApi.getUserId()
        if (!userId) {
          throw new Error("No se pudo obtener el ID del usuario")
        }

        const courseData = await courseClient.getCourseById(courseId)
        if (courseData) {
          setIsCreator(courseData.creatorId === userId)
        }
      } catch (err) {
        console.error("Error al cargar el módulo:", err)
        setError("No se pudo cargar la información del módulo")
      } finally {
        setLoading(false)
      }
    }

    fetchModuleAndPermissions()
  }, [moduleId, courseId])

  const handleEditModule = () => {
    router.push({
      pathname: "/course/module/edit",
      params: { moduleId, courseId },
    })
  }

  const handleDeleteModule = () => {
    Alert.alert(
        "Eliminar módulo",
        "¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                if (!courseId || !moduleId) return

                const success = await moduleClient.deleteModule(courseId, moduleId)
                if (success) {
                  Alert.alert("Éxito", "El módulo ha sido eliminado correctamente", [
                    { text: "OK", onPress: () => router.back() },
                  ])
                } else {
                  Alert.alert("Error", "No se pudo eliminar el módulo")
                }
              } catch (error) {
                console.error("Error al eliminar el módulo:", error)
                Alert.alert("Error", "Ocurrió un error al eliminar el módulo")
              }
            },
          },
        ],
    )
  }

  const handleAddResource = () => {
    setSelectedResource(null)
    setShowResourceForm(true)
  }

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource)
    setShowResourceForm(true)
  }

  const handleSaveResource = (resource: Resource) => {
    setShowResourceForm(false)
    // Recargar los recursos para mostrar los cambios
  }

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Cargando módulo...</Text>
        </View>
    )
  }

  if (error || !module) {
    return (
        <View style={styles.errorContainer}>
          <Text variant="headlineMedium" style={styles.errorTitle}>
            Módulo no encontrado
          </Text>
          <Text style={styles.errorText}>{error || "No se pudo cargar el módulo solicitado"}</Text>
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
              {module.name}
            </Text>
          </View>

          <Card style={styles.moduleCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.description}>
                {module.description}
              </Text>

              {module.url && (
                  <Button mode="outlined" icon="link" onPress={() => Linking.openURL(module.url)} style={styles.urlButton}>
                    Abrir enlace del módulo
                  </Button>
              )}
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          <View style={styles.resourcesContainer}>
            {isCreator && (
                <Button mode="contained" icon="plus" onPress={handleAddResource} style={styles.addResourceButton}>
                  Agregar recurso
                </Button>
            )}

            <ResourceList
                moduleId={moduleId}
                isCreator={isCreator}
                onEditResource={isCreator ? handleEditResource : undefined}
            />
          </View>
        </ScrollView>

        {isCreator && (
            <View style={styles.fabContainer}>
              <FAB icon="delete" style={[styles.fab, styles.fabDelete]} onPress={handleDeleteModule} color="#fff" small />
              <FAB icon="pencil" style={[styles.fab, styles.fabEdit]} onPress={handleEditModule} color="#fff" small />
            </View>
        )}

        {/* Modal para crear/editar recurso */}
        <Modal
            visible={showResourceForm}
            onDismiss={() => setShowResourceForm(false)}
            contentContainerStyle={styles.modalContainer}
        >
          <ResourceForm
              moduleId={moduleId}
              courseId={courseId}
              initialData={selectedResource || undefined}
              onSave={handleSaveResource}
              onCancel={() => setShowResourceForm(false)}
          />
        </Modal>
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
  moduleCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  description: {
    marginBottom: 16,
    lineHeight: 24,
  },
  urlButton: {
    alignSelf: "flex-start",
  },
  divider: {
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "center",
  },
  fab: {
    marginBottom: 8,
    elevation: 4,
  },
  fabEdit: {
    backgroundColor: "#6200ee",
  },
  fabDelete: {
    backgroundColor: "#f44336",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 0,
    padding: 0,
    flex: 1,
  },
  resourcesContainer: {
    flex: 1,
  },
  addResourceButton: {
    marginBottom: 16,
    backgroundColor: "#6200ee",
  },
})
