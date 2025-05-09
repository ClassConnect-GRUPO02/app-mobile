import React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { Text, IconButton, ActivityIndicator, Card } from "react-native-paper"
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist"
import type { Module } from "@/types/Module"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import {moduleClient} from "@/api/modulesClient";

interface ModuleListProps {
  courseId: string
  modules: Module[]
  isCreator: boolean
  onModulePress: (moduleId: string) => void
  onEditModule?: (module: Module) => void
  onDeleteModule?: (moduleId: string) => void
}

export const ModuleList: React.FC<ModuleListProps> = ({
                                                        courseId,
                                                        modules,
                                                        isCreator,
                                                        onModulePress,
                                                        onEditModule,
                                                        onDeleteModule,
                                                      }) => {
  const [reordering, setReordering] = useState(false)
  const [localModules, setLocalModules] = useState<Module[]>(modules)

  // Update local modules when props change
  useEffect(() => {
    setLocalModules(modules)
  }, [modules])

  const handleDeleteModule = async (moduleId: string) => {
    Alert.alert(
        "Eliminar módulo",
        "¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              if (onDeleteModule) {
                onDeleteModule(moduleId)
              }
            },
          },
        ],
    )
  }

  const handleDragEnd = async ({ data }: { data: Module[] }) => {
    try {
      setReordering(true)
      setLocalModules(data)

      // Actualizar el orden en el backend
      const orderedIds = data.map((module) => module.id)
      console.log("Updating module order with IDs:", orderedIds)
      await moduleClient.updateModulesOrder(courseId, orderedIds)
    } catch (error) {
      console.error("Error al reordenar módulos:", error)
      Alert.alert("Error", "No se pudo actualizar el orden de los módulos")
      // Revert to original order
      setLocalModules(modules)
    } finally {
      setReordering(false)
    }
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Module>) => {
    return (
        <Card style={[styles.moduleCard, isActive && styles.draggingCard]} onPress={() => onModulePress(item.id)}>
          <Card.Content style={styles.moduleCardContent}>
            <View style={styles.moduleInfo}>
              <Text variant="titleMedium" style={styles.moduleName}>
                {item.name}
              </Text>
              <Text variant="bodySmall" numberOfLines={2} style={styles.moduleDescription}>
                {item.description}
              </Text>
            </View>

            {isCreator && (
                <View style={styles.moduleActions}>
                  {/* Botón para editar */}
                  {onEditModule && (
                      <IconButton icon="pencil" size={20} onPress={() => onEditModule(item)} style={styles.actionButton} />
                  )}

                  {/* Botón para arrastrar y reordenar */}
                  <IconButton icon="drag" size={20} onLongPress={drag} style={styles.actionButton} />

                  {/* Botón para eliminar */}
                  <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteModule(item.id)}
                      style={styles.actionButton}
                  />
                </View>
            )}
          </Card.Content>
        </Card>
    )
  }

  return (
      <View style={styles.container}>
        {reordering && (
            <View style={styles.reorderingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text style={styles.reorderingText}>Actualizando orden...</Text>
            </View>
        )}

        {localModules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isCreator
                    ? "Este curso aún no tiene módulos. Usa el botón 'Agregar módulo' para crear el primero."
                    : "Este curso aún no tiene módulos disponibles."}
              </Text>
            </View>
        ) : (
            <GestureHandlerRootView style={{ flex: 1 }}>
              <DraggableFlatList
                  data={localModules}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                  onDragEnd={handleDragEnd}
                  contentContainerStyle={styles.listContent}
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
  moduleCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  moduleCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  moduleName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  moduleDescription: {
    color: "#666",
  },
  moduleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
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
