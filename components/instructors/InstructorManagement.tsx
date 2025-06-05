import React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import {
  Text,
  Card,
  Button,
  List,
  Switch,
  Divider,
  ActivityIndicator,
  Chip,
  IconButton,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"
import type { InstructorInfo } from "@/types/Instructor"

interface InstructorManagementProps {
  courseId: string
  isCreator: boolean
  onInstructorAdded?: () => void
}

export const InstructorManagement: React.FC<InstructorManagementProps> = ({
                                                                            courseId,
                                                                            isCreator,
                                                                            onInstructorAdded,
                                                                          }) => {
  const [instructors, setInstructors] = useState<InstructorInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [permissions, setPermissions] = useState({
    can_create_content: false,
    can_grade: false,
    can_update_course: false,
  })
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    loadInstructors()
    getCurrentUserId()
  }, [courseId])

  const getCurrentUserId = async () => {
    try {
      const userId = await userApi.getUserId()
      if (userId) {
        setCurrentUserId(userId)
      }
    } catch (error) {
      console.error("Error getting current user ID:", error)
    }
  }

  const loadInstructors = async () => {
    try {
      setLoading(true)
      // Use the specific endpoint for getting instructors
      const instructorsData = await courseClient.getInstructorsByCourseId(courseId)
      const instructorList: InstructorInfo[] = []

      // Process each instructor from the response
      for (const instructorData of instructorsData) {
        try {
          // Get user details for each instructor
          const userInfo = await userApi.getUserById(instructorData.userId)
          if (userInfo?.user) {
            instructorList.push({
              id: userInfo.user.id,
              name: userInfo.user.name,
              email: userInfo.user.email,
              userType: userInfo.user.userType,
              permissions: {
                id: instructorData.id,
                userId: instructorData.userId,
                courseId: instructorData.courseId,
                type: instructorData.type,
                can_create_content: instructorData.can_create_content,
                can_grade: instructorData.can_grade,
                can_update_course: instructorData.can_update_course,
              },
            })
          }
        } catch (error) {
          console.error(`Error loading instructor details for user ${instructorData.userId}:`, error)
        }
      }

      setInstructors(instructorList)
    } catch (error) {
      console.error("Error loading instructors:", error)
      Alert.alert("Error", "No se pudieron cargar los instructores")
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchEmail.trim()) return

    try {
      const { exists, id } = await userApi.checkEmailExists(searchEmail)
      if (exists && id) {
        const userInfo = await userApi.getUserById(id)
        setSearchResults([userInfo.user])
      } else {
        setSearchResults([])
        Alert.alert("Usuario no encontrado", "No se encontró un usuario con ese email")
      }
    } catch (error) {
      console.error("Error searching users:", error)
      Alert.alert("Error", "Error al buscar usuario")
    }
  }

  const handleAddInstructor = async () => {
    if (!selectedUser) return

    try {
      await courseClient.addAuxiliaryInstructor(courseId, selectedUser.id, currentUserId, permissions)

      // Send notification to the new instructor
      await userApi.notifyUser(
          selectedUser.id,
          "Nuevo rol de instructor",
          `Has sido asignado como instructor auxiliar en un curso`,
          "courseEnrollment",
      )

      Alert.alert("Éxito", "Instructor auxiliar agregado correctamente")
      setShowAddDialog(false)
      setSelectedUser(null)
      setSearchEmail("")
      setSearchResults([])
      setPermissions({
        can_create_content: false,
        can_grade: false,
        can_update_course: false,
      })
      loadInstructors()
      onInstructorAdded?.()
    } catch (error) {
      console.error("Error adding instructor:", error)
      Alert.alert("Error", "No se pudo agregar el instructor auxiliar")
    }
  }

  const handleRemoveInstructor = (instructor: InstructorInfo) => {
    if (!instructor.permissions) {
      Alert.alert("Error", "No se pudieron obtener los permisos del instructor")
      return
    }

    Alert.alert(
        "Remover instructor",
        `¿Estás seguro de que deseas remover a ${instructor.name} como instructor auxiliar?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              try {
                await courseClient.removeAuxiliaryInstructor(courseId, instructor.id, currentUserId)

                // Send notification about role revocation
                await userApi.notifyUser(
                    instructor.id,
                    "Rol de instructor removido",
                    `Tu rol como instructor auxiliar ha sido revocado`,
                    "courseEnrollment",
                )

                Alert.alert("Éxito", "Instructor auxiliar removido correctamente")
                loadInstructors()
              } catch (error) {
                console.error("Error removing instructor:", error)
                Alert.alert("Error", "No se pudo remover el instructor auxiliar")
              }
            },
          },
        ],
    )
  }

  const handleUpdatePermissions = async (instructor: InstructorInfo, newPermissions: any) => {
    if (!instructor.permissions) {
      Alert.alert("Error", "No se pudieron obtener los permisos del instructor")
      return
    }

    try {
      await courseClient.updateInstructorPermissions(courseId, instructor.id, currentUserId, newPermissions)

      Alert.alert("Éxito", "Permisos actualizados correctamente")
      loadInstructors()
    } catch (error) {
      console.error("Error updating permissions:", error)
      Alert.alert("Error", "No se pudieron actualizar los permisos")
    }
  }

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Cargando instructores...</Text>
        </View>
    )
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge">Gestión de Instructores</Text>
          {isCreator && (
              <Button mode="contained" icon="plus" onPress={() => setShowAddDialog(true)} style={styles.addButton}>
                Agregar Instructor Auxiliar
              </Button>
          )}
        </View>

        <ScrollView style={styles.instructorsList}>
          {instructors.map((instructor) => (
              <Card key={instructor.id} style={styles.instructorCard}>
                <Card.Content>
                  <View style={styles.instructorHeader}>
                    <View style={styles.instructorInfo}>
                      <Text variant="titleMedium">{instructor.name}</Text>
                      <Text variant="bodyMedium" style={styles.email}>
                        {instructor.email}
                      </Text>
                      <Chip style={styles.typeChip} mode={instructor.permissions?.type === "TITULAR" ? "flat" : "outlined"}>
                        {instructor.permissions?.type === "TITULAR" ? "Titular" : "Auxiliar"}
                      </Chip>
                    </View>
                    {isCreator && instructor.permissions?.type === "AUXILIAR" && (
                        <IconButton icon="delete" iconColor="#f44336" onPress={() => handleRemoveInstructor(instructor)} />
                    )}
                  </View>

                  {instructor.permissions && (
                      <>
                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.permissionsTitle}>
                          Permisos
                        </Text>

                        <List.Item
                            title="Crear contenido"
                            description="Puede crear módulos y recursos"
                            right={() => (
                                <Switch
                                    value={instructor.permissions?.can_create_content || false}
                                    onValueChange={(value) => {
                                      if (isCreator && instructor.permissions?.type === "AUXILIAR" && instructor.permissions) {
                                        handleUpdatePermissions(instructor, {
                                          ...instructor.permissions,
                                          can_create_content: value,
                                        })
                                      }
                                    }}
                                    disabled={!isCreator || instructor.permissions?.type === "TITULAR"}
                                />
                            )}
                        />

                        <List.Item
                            title="Calificar estudiantes"
                            description="Puede dar feedbacks para estudiantes"
                            right={() => (
                                <Switch
                                    value={instructor.permissions?.can_grade || false}
                                    onValueChange={(value) => {
                                      if (isCreator && instructor.permissions?.type === "AUXILIAR" && instructor.permissions) {
                                        handleUpdatePermissions(instructor, {
                                          ...instructor.permissions,
                                          can_grade: value,
                                        })
                                      }
                                    }}
                                    disabled={!isCreator || instructor.permissions?.type === "TITULAR"}
                                />
                            )}
                        />

                        <List.Item
                            title="Actualizar curso"
                            description="Puede modificar información del curso"
                            right={() => (
                                <Switch
                                    value={instructor.permissions?.can_update_course || false}
                                    onValueChange={(value) => {
                                      if (isCreator && instructor.permissions?.type === "AUXILIAR" && instructor.permissions) {
                                        handleUpdatePermissions(instructor, {
                                          ...instructor.permissions,
                                          can_update_course: value,
                                        })
                                      }
                                    }}
                                    disabled={!isCreator || instructor.permissions?.type === "TITULAR"}
                                />
                            )}
                        />
                      </>
                  )}
                </Card.Content>
              </Card>
          ))}
        </ScrollView>

        <Portal>
          <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
            <Dialog.Title>Agregar Instructor Auxiliar</Dialog.Title>
            <Dialog.Content>
              <TextInput
                  label="Email del usuario"
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                  mode="outlined"
                  style={styles.searchInput}
              />
              <Button mode="outlined" onPress={searchUsers} style={styles.searchButton}>
                Buscar Usuario
              </Button>

              {searchResults.map((user) => (
                  <Card
                      key={user.id}
                      style={[styles.userCard, selectedUser?.id === user.id && styles.selectedUserCard]}
                      onPress={() => setSelectedUser(user)}
                  >
                    <Card.Content>
                      <Text variant="titleMedium">{user.name}</Text>
                      <Text variant="bodyMedium">{user.email}</Text>
                    </Card.Content>
                  </Card>
              ))}

              {selectedUser && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="titleSmall" style={styles.permissionsTitle}>
                      Configurar Permisos
                    </Text>

                    <List.Item
                        title="Crear contenido"
                        right={() => (
                            <Switch
                                value={permissions.can_create_content}
                                onValueChange={(value) => setPermissions({ ...permissions, can_create_content: value })}
                            />
                        )}
                    />

                    <List.Item
                        title="Calificar tareas"
                        right={() => (
                            <Switch
                                value={permissions.can_grade}
                                onValueChange={(value) => setPermissions({ ...permissions, can_grade: value })}
                            />
                        )}
                    />

                    <List.Item
                        title="Actualizar curso"
                        right={() => (
                            <Switch
                                value={permissions.can_update_course}
                                onValueChange={(value) => setPermissions({ ...permissions, can_update_course: value })}
                            />
                        )}
                    />
                  </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddInstructor} disabled={!selectedUser}>
                Agregar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  header: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  instructorsList: {
    flex: 1,
  },
  instructorCard: {
    marginBottom: 12,
  },
  instructorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  instructorInfo: {
    flex: 1,
  },
  email: {
    color: "#666",
    marginTop: 4,
  },
  typeChip: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  divider: {
    marginVertical: 12,
  },
  permissionsTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  searchInput: {
    marginBottom: 12,
  },
  searchButton: {
    marginBottom: 16,
  },
  userCard: {
    marginVertical: 4,
  },
  selectedUserCard: {
    backgroundColor: "#e3f2fd",
  },
})
