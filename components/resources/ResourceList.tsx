import React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { Text, IconButton, ActivityIndicator, Card, Chip } from "react-native-paper"
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist"
import { resourceClient } from "@/api/resourceClient"
import type { Resource, ResourceType } from "@/types/Resource"
import { router } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"

interface ResourceListProps {
  moduleId: string
  isCreator: boolean
  onAddResource?: () => void
  onEditResource?: (resource: Resource) => void
}

export const ResourceList: React.FC<ResourceListProps> = ({ moduleId, isCreator, onAddResource, onEditResource }) => {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResources()
  }, [moduleId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const resourceData = await resourceClient.getResourcesByModuleId(moduleId)
      setResources(resourceData)
      setError(null)
    } catch (err) {
      console.error("Error al cargar recursos:", err)
      setError("No se pudieron cargar los recursos del módulo")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    Alert.alert(
        "Eliminar recurso",
        "¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                const success = await resourceClient.deleteResource(moduleId, resourceId)
                if (success) {
                  setResources(resources.filter((resource) => resource.id !== resourceId))
                } else {
                  Alert.alert("Error", "No se pudo eliminar el recurso")
                }
              } catch (error) {
                console.error("Error al eliminar recurso:", error)
                Alert.alert("Error", "Ocurrió un error al eliminar el recurso")
              }
            },
          },
        ],
    )
  }

  const handleDragEnd = async ({ data }: { data: Resource[] }) => {
    try {
      setReordering(true)
      setResources(data)

      // Actualizar el orden en el backend
      const orderedIds = data.map((resource) => resource.id)
      await resourceClient.updateResourcesOrder(moduleId, orderedIds)
    } catch (error) {
      console.error("Error al reordenar recursos:", error)
      Alert.alert("Error", "No se pudo actualizar el orden de los recursos")
      // Recargar los recursos originales
      fetchResources()
    } finally {
      setReordering(false)
    }
  }

  const getResourceTypeIcon = (type: ResourceType): string => {
    switch (type) {
      case "video":
        return "video"
      case "document":
        return "file-document"
      case "link":
        return "link"
      case "image":
        return "image"
      default:
        return "file"
    }
  }

  const getResourceTypeColor = (type: ResourceType): string => {
    switch (type) {
      case "video":
        return "#f44336"
      case "document":
        return "#2196f3"
      case "link":
        return "#4caf50"
      case "image":
        return "#ff9800"
      default:
        return "#9e9e9e"
    }
  }

  const handleResourcePress = (resource: Resource) => {
    router.push({
      pathname: "/course/module/resource/[resourceId]",
      params: { resourceId: resource.id, moduleId },
    })
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Resource>) => {
    return (
        <Card style={[styles.resourceCard, isActive && styles.draggingCard]} onPress={() => handleResourcePress(item)}>
          <Card.Content style={styles.resourceCardContent}>
            <View style={styles.resourceInfo}>
              <View style={styles.resourceHeader}>
                <IconButton
                    icon={getResourceTypeIcon(item.type as ResourceType)}
                    size={24}
                    style={[styles.resourceTypeIcon, { backgroundColor: getResourceTypeColor(item.type as ResourceType) }]}
                    iconColor="#fff"
                />
                <Text variant="titleMedium" style={styles.resourceName}>
                  {item.description}
                </Text>
              </View>
              <Chip style={styles.resourceTypeChip}>{item.type}</Chip>
            </View>

            {isCreator && (
                <View style={styles.resourceActions}>
                  {/* Botón para editar */}
                  {onEditResource && (
                      <IconButton icon="pencil" size={20} onPress={() => onEditResource(item)} style={styles.editButton} />
                  )}

                  {/* Botón para arrastrar y reordenar */}
                  <IconButton icon="drag" size={20} onLongPress={isCreator ? drag : undefined} style={styles.dragHandle} />

                  {/* Botón para eliminar */}
                  <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteResource(item.id)}
                      style={styles.deleteButton}
                  />
                </View>
            )}
          </Card.Content>
        </Card>
    )
  }

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Cargando recursos...</Text>
        </View>
    )
  }

  return (
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {reordering && (
            <View style={styles.reorderingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text style={styles.reorderingText}>Actualizando orden...</Text>
            </View>
        )}

        {resources.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isCreator
                    ? "Este módulo aún no tiene recursos. Usa el botón 'Agregar recurso' para crear el primero."
                    : "Este módulo aún no tiene recursos disponibles."}
              </Text>
            </View>
        ) : (
            <GestureHandlerRootView style={{ flex: 1 }}>
              <DraggableFlatList
                  data={resources}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                  onDragEnd={handleDragEnd}
                  contentContainerStyle={styles.listContent}
                  scrollEnabled={true}
                  disabled={!isCreator}
              />
            </GestureHandlerRootView>
        )}
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  resourceCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  resourceCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resourceInfo: {
    flex: 1,
    paddingRight: 8,
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resourceName: {
    fontWeight: "bold",
    flex: 1,
  },
  resourceTypeIcon: {
    marginRight: 8,
    borderRadius: 20,
  },
  resourceTypeChip: {
    alignSelf: "flex-start",
  },
  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  dragHandle: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  editButton: {
    margin: 0,
  },
  draggingCard: {
    elevation: 8,
    backgroundColor: "#f0e6ff",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  reorderingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#f0e6ff",
    borderRadius: 8,
    marginBottom: 16,
  },
  reorderingText: {
    marginLeft: 8,
    color: "#6200ee",
  },
})
