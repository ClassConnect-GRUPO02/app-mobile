"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Title, Card, Switch, Divider, List, ActivityIndicator, useTheme, Button } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { router } from "expo-router"
import { getItemAsync } from "expo-secure-store"
import { setAuthToken } from "../../api/client"
import { userApi } from "../../api/userApi"
import React from "react"

interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  // Configuraciones específicas para estudiantes (1=solo push, 2=solo email, 3=ambas)
  newAssignment: number
  deadlineReminder: number
  courseEnrollment: number
  favoriteCourseUpdate: number
  teacherFeedback: number
  // Configuraciones específicas para docentes (1=solo push, 2=solo email, 3=ambas)
  assignmentSubmission: number
  studentFeedback: number
}

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>("")
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    // Estudiantes
    newAssignment: 3, // Ambas
    deadlineReminder: 3, // Ambas
    courseEnrollment: 3, // Ambas
    favoriteCourseUpdate: 3, // Solo push
    teacherFeedback: 3, // Ambas
    // Docentes
    assignmentSubmission: 3, // Ambas
    studentFeedback: 3, // Solo push
  })
  const theme = useTheme()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const userId = await getItemAsync("userId")
        const token = await getItemAsync("userToken")

        if (!token || !userId) {
          Alert.alert("Error", "No se pudo recuperar la sesión")
          router.replace("/(auth)/login")
          return
        }

        setAuthToken(token)

        // Obtener datos del usuario
        const response = await userApi.getUserById(userId)
        setUserType(response.user.userType)

        // Aquí se cargarían las configuraciones de notificaciones desde la API
        // Por ahora usamos valores predeterminados

        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setLoading(false)
        Alert.alert("Error", "No se pudieron cargar las configuraciones")
      }
    }

    fetchUserData()
  }, [])

  const handleToggleChange = (key: keyof NotificationSettings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    })
  }

  const handleNotificationTypeChange = (key: keyof NotificationSettings, value: number) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      // Aquí se enviarían las configuraciones a la API
      // await userApi.updateNotificationSettings(settings);

      Alert.alert("Éxito", "Configuraciones de notificaciones guardadas correctamente", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Error al guardar configuraciones:", error)
      Alert.alert("Error", "No se pudieron guardar las configuraciones")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Configuración de Notificaciones</Title>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.legendTitle}>Leyenda:</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <Button mode="contained" disabled={false} style={styles.legendButton}>
                  1
                </Button>
                <Text style={styles.legendText}>Solo notificaciones push</Text>
              </View>
              <View style={styles.legendItem}>
                <Button mode="contained" disabled={false} style={styles.legendButton}>
                  2
                </Button>
                <Text style={styles.legendText}>Solo notificaciones por email</Text>
              </View>
              <View style={styles.legendItem}>
                <Button mode="contained" disabled={false} style={styles.legendButton}>
                  3
                </Button>
                <Text style={styles.legendText}>Ambas notificaciones</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <List.Section>
              <List.Subheader>Configuración General</List.Subheader>
              <List.Item
                title="Notificaciones Push"
                description="Recibir notificaciones en tu dispositivo"
                left={(props) => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <Switch value={settings.pushEnabled} onValueChange={() => handleToggleChange("pushEnabled")} />
                )}
              />
              <Divider />
              <List.Item
                title="Notificaciones por Email"
                description="Recibir notificaciones en tu correo electrónico"
                left={(props) => <List.Icon {...props} icon="email" />}
                right={() => (
                  <Switch value={settings.emailEnabled} onValueChange={() => handleToggleChange("emailEnabled")} />
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {userType === "alumno" ? (
          <Card style={styles.card}>
            <Card.Content>
              <List.Section>
                <List.Subheader>Notificaciones para Estudiantes</List.Subheader>

                <Text style={styles.categoryTitle}>Tareas y Exámenes</Text>
                <List.Item
                  title="Nuevas tareas o exámenes"
                  description={
                    settings.newAssignment === 1
                      ? "Solo notificaciones push"
                      : settings.newAssignment === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="book" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.newAssignment === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("newAssignment", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.newAssignment !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.newAssignment === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("newAssignment", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.newAssignment !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.newAssignment === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("newAssignment", 3)}
                        style={styles.optionButton}
                        disabled={(!settings.pushEnabled || !settings.emailEnabled) && settings.newAssignment !== 3}
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
                <Divider style={styles.divider} />

                <Text style={styles.categoryTitle}>Recordatorios</Text>
                <List.Item
                  title="Fechas límite de tareas"
                  description={
                    settings.deadlineReminder === 1
                      ? "Solo notificaciones push"
                      : settings.deadlineReminder === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="clock-alert" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.deadlineReminder === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("deadlineReminder", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.deadlineReminder !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.deadlineReminder === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("deadlineReminder", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.deadlineReminder !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.deadlineReminder === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("deadlineReminder", 3)}
                        style={styles.optionButton}
                        disabled={(!settings.pushEnabled || !settings.emailEnabled) && settings.deadlineReminder !== 3}
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
                <Divider style={styles.divider} />

                <Text style={styles.categoryTitle}>Cursos</Text>
                <List.Item
                  title="Inscripción a nuevos cursos"
                  description={
                    settings.courseEnrollment === 1
                      ? "Solo notificaciones push"
                      : settings.courseEnrollment === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="school" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.courseEnrollment === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("courseEnrollment", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.courseEnrollment !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.courseEnrollment === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("courseEnrollment", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.courseEnrollment !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.courseEnrollment === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("courseEnrollment", 3)}
                        style={styles.optionButton}
                        disabled={(!settings.pushEnabled || !settings.emailEnabled) && settings.courseEnrollment !== 3}
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
                <List.Item
                  title="Actualizaciones de cursos favoritos"
                  description={
                    settings.favoriteCourseUpdate === 1
                      ? "Solo notificaciones push"
                      : settings.favoriteCourseUpdate === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="star" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.favoriteCourseUpdate === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("favoriteCourseUpdate", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.favoriteCourseUpdate !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.favoriteCourseUpdate === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("favoriteCourseUpdate", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.favoriteCourseUpdate !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.favoriteCourseUpdate === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("favoriteCourseUpdate", 3)}
                        style={styles.optionButton}
                        disabled={
                          (!settings.pushEnabled || !settings.emailEnabled) && settings.favoriteCourseUpdate !== 3
                        }
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
                <Divider style={styles.divider} />

                <Text style={styles.categoryTitle}>Feedback</Text>
                <List.Item
                  title="Feedback de docentes"
                  description={
                    settings.teacherFeedback === 1
                      ? "Solo notificaciones push"
                      : settings.teacherFeedback === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="message-text" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.teacherFeedback === 1 ? "contained" : "outlined"}
                        onPress={() =>
                          handleNotificationTypeChange("teacherFeedback", 1)
                        }
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.teacherFeedback !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.teacherFeedback === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("teacherFeedback", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.teacherFeedback !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.teacherFeedback === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("teacherFeedback", 3)}
                        style={styles.optionButton}
                        disabled={(!settings.pushEnabled || !settings.emailEnabled) && settings.teacherFeedback !== 3}
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
              </List.Section>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <List.Section>
                <List.Subheader>Notificaciones para Docentes</List.Subheader>

                <Text style={styles.categoryTitle}>Entregas</Text>
                <List.Item
                  title="Entregas de tareas o exámenes"
                  description={
                    settings.assignmentSubmission === 1
                      ? "Solo notificaciones push"
                      : settings.assignmentSubmission === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="file-document" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.assignmentSubmission === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("assignmentSubmission", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.assignmentSubmission !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.assignmentSubmission === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("assignmentSubmission", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.assignmentSubmission !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.assignmentSubmission === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("assignmentSubmission", 3)}
                        style={styles.optionButton}
                        disabled={
                          (!settings.pushEnabled || !settings.emailEnabled) && settings.assignmentSubmission !== 3
                        }
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
                <Divider style={styles.divider} />

                <Text style={styles.categoryTitle}>Feedback</Text>
                <List.Item
                  title="Feedback de estudiantes"
                  description={
                    settings.studentFeedback === 1
                      ? "Solo notificaciones push"
                      : settings.studentFeedback === 2
                        ? "Solo notificaciones por email"
                        : "Notificaciones push y email"
                  }
                  left={(props) => <List.Icon {...props} icon="message-reply" />}
                  right={() => (
                    <View style={styles.optionContainer}>
                      <Button
                        mode={settings.studentFeedback === 1 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("studentFeedback", 1)}
                        style={styles.optionButton}
                        disabled={!settings.pushEnabled && settings.studentFeedback !== 1}
                      >
                        1
                      </Button>
                      <Button
                        mode={settings.studentFeedback === 2 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("studentFeedback", 2)}
                        style={styles.optionButton}
                        disabled={!settings.emailEnabled && settings.studentFeedback !== 2}
                      >
                        2
                      </Button>
                      <Button
                        mode={settings.studentFeedback === 3 ? "contained" : "outlined"}
                        onPress={() => handleNotificationTypeChange("studentFeedback", 3)}
                        style={styles.optionButton}
                        disabled={(!settings.pushEnabled || !settings.emailEnabled) && settings.studentFeedback !== 3}
                      >
                        3
                      </Button>
                    </View>
                  )}
                />
              </List.Section>
            </Card.Content>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={handleSaveSettings} style={styles.saveButton}>
            Guardar configuración
          </Button>
          <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
            Cancelar
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    margin: 15,
    marginTop: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
  },
  divider: {
    marginVertical: 10,
  },
  buttonContainer: {
    margin: 15,
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  cancelButton: {
    paddingVertical: 6,
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
  },
  optionButton: {
    width: 40,
    height: 40,
    margin: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  legendContainer: {
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  legendButton: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
  },
})
