import React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Card, ActivityIndicator, List, Chip, Divider } from "react-native-paper"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"
import type { CourseActivityLog } from "@/types/CourseActivityLog"

interface ActivityLogProps {
  courseId: string
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ courseId }) => {
  const [activities, setActivities] = useState<CourseActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadActivityLog()
  }, [courseId])

  const loadActivityLog = async () => {
    try {
      setLoading(true)
      const activityData = await courseClient.getCourseActivityLog(courseId)
      setActivities(activityData)

      // Load user names for each activity
      const userIds = [...new Set(activityData.map((activity: CourseActivityLog) => activity.userId))]
      const names: { [key: string]: string } = {}

      for (const userId of userIds) {
        try {
          const userInfo = await userApi.getUserById(userId)
          names[userId] = userInfo?.user?.name || "Usuario desconocido"
        } catch (error) {
          names[userId] = "Usuario desconocido"
        }
      }

      setUserNames(names)
    } catch (error) {
      console.error("Error loading activity log:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionDescription = (action: string, metadata: any) => {
    switch (action) {
      case "task_created":
        return `Creó la tarea "${metadata?.title || "Sin título"}"`
      case "task_updated":
        return `Actualizó la tarea "${metadata?.title || "Sin título"}"`
      case "task_deleted":
        return `Eliminó una tarea`
      case "module_created":
        return `Creó el módulo "${metadata?.name || "Sin nombre"}"`
      case "module_updated":
        return `Actualizó el módulo "${metadata?.name || "Sin nombre"}"`
      case "module_deleted":
        return `Eliminó un módulo`
      case "resource_created":
        return `Agregó un recurso "${metadata?.description || "Sin descripción"}"`
      case "resource_updated":
        return `Actualizó un recurso`
      case "resource_deleted":
        return `Eliminó un recurso`
      case "feedback_given":
        return `Dio feedback a un estudiante`
      case "course_updated":
        return `Actualizó la información del curso`
      case "instructor_added":
        return `Agregó un instructor auxiliar`
      case "instructor_removed":
        return `Removió un instructor auxiliar`
      case "permissions_updated":
        return `Actualizó permisos de instructor`
      default:
        return action
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("task")) return "clipboard-text"
    if (action.includes("module")) return "book"
    if (action.includes("resource")) return "file"
    if (action.includes("feedback")) return "comment"
    if (action.includes("course")) return "school"
    if (action.includes("instructor")) return "account-group"
    return "information"
  }

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("added")) return "#4caf50"
    if (action.includes("updated")) return "#2196f3"
    if (action.includes("deleted") || action.includes("removed")) return "#f44336"
    return "#9e9e9e"
  }

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Cargando registro de actividades...</Text>
        </View>
    )
  }

  return (
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Registro de Actividades
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Historial de acciones realizadas por instructores en este curso
        </Text>

        <ScrollView style={styles.activitiesList}>
          {activities.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    No hay actividades registradas
                  </Text>
                </Card.Content>
              </Card>
          ) : (
              activities.map((activity) => (
                  <Card key={activity.id} style={styles.activityCard}>
                    <Card.Content>
                      <View style={styles.activityHeader}>
                        <List.Icon icon={getActionIcon(activity.action)} color={getActionColor(activity.action)} />
                        <View style={styles.activityInfo}>
                          <Text variant="titleMedium">{userNames[activity.userId] || "Usuario desconocido"}</Text>
                          <Text variant="bodyMedium" style={styles.actionDescription}>
                            {getActionDescription(activity.action, activity.metadata)}
                          </Text>
                          <Text variant="bodySmall" style={styles.timestamp}>
                            {new Date(activity.createdAt).toLocaleString()}
                          </Text>
                        </View>
                        <Chip
                            style={[styles.actionChip, { backgroundColor: getActionColor(activity.action) }]}
                            textStyle={{ color: "white" }}
                        >
                          {activity.action.replace(/_/g, " ").toUpperCase()}
                        </Chip>
                      </View>

                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <>
                            <Divider style={styles.divider} />
                            <Text variant="bodySmall" style={styles.metadataTitle}>
                              Detalles adicionales:
                            </Text>
                            <Text variant="bodySmall" style={styles.metadata}>
                              {JSON.stringify(activity.metadata, null, 2)}
                            </Text>
                          </>
                      )}
                    </Card.Content>
                  </Card>
              ))
          )}
        </ScrollView>
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 16,
    color: "#666",
  },
  activitiesList: {
    flex: 1,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
  activityCard: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actionDescription: {
    marginTop: 4,
    color: "#333",
  },
  timestamp: {
    marginTop: 4,
    color: "#999",
  },
  actionChip: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  metadataTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  metadata: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    fontFamily: "monospace",
  },
})
