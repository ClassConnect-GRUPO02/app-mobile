import { useState, useEffect } from "react"
import { StyleSheet, View, Alert } from "react-native"
import { Text, Button, Card, ActivityIndicator, IconButton, Divider, FAB, Modal } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import type { Module } from "@/types/Module"
import { StatusBar } from "expo-status-bar"
import { ResourceList } from "@/components/resources/ResourceList"
import { ResourceForm } from "@/components/resources/ResourceForm"
import React from "react"
import {Resource} from "@/types/Resource";
import { useInstructorPermissions } from "@/hooks/useInstructorPermissions"
import {moduleClient} from "@/api/modulesClient";

export default function ModuleDetailScreen() {
  const { moduleId, courseId } = useLocalSearchParams<{ moduleId: string; courseId: string }>()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  const { permissions, loading: permissionsLoading } = useInstructorPermissions(courseId)

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
  }

  if (loading || permissionsLoading) {
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

        {/* Header section */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} style={styles.backIcon} />
          <Text variant="headlineMedium" style={styles.title}>
            {module.name}
          </Text>
        </View>

        {/* Module info card */}
        <Card style={styles.moduleCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.description}>
              {module.description}
            </Text>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.resourcesContainer}>
          {permissions.can_create_content && (
              <Button mode="contained" icon="plus" onPress={handleAddResource} style={styles.addResourceButton}>
                Agregar recurso
              </Button>
          )}

          <ResourceList
              moduleId={moduleId}
              isCreator={permissions.can_create_content}
              onAddResource={permissions.can_create_content ? handleAddResource : undefined}
              onEditResource={permissions.can_create_content ? handleEditResource : undefined}
          />
        </View>

        {permissions.can_create_content && (
            <View style={styles.fabContainer}>
              <FAB icon="delete" style={[styles.fab, styles.fabDelete]} onPress={handleDeleteModule} color="#fff" small />
              <FAB icon="pencil" style={[styles.fab, styles.fabEdit]} onPress={handleEditModule} color="#fff" small />
            </View>
        )}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  description: {
    marginBottom: 16,
    lineHeight: 24,
  },
  divider: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resourcesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addResourceButton: {
    marginBottom: 16,
    backgroundColor: "#6200ee",
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
})
