"use client"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Title, Card, Switch, Divider, List, ActivityIndicator, useTheme, Button, Chip } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { router } from "expo-router"
import { getItemAsync } from "expo-secure-store"
import { setAuthToken } from "../../api/client"
import { userApi } from "../../api/userApi"
import React from "react"

// Constantes para los tipos de notificación
const PUSH_ONLY = 1
const EMAIL_ONLY = 2
const BOTH = 3
const DISABLED = 0

// Interfaces para los diferentes tipos de configuraciones
interface StudentSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newAssignment: number;
  deadlineReminder: number;
  courseEnrollment: number;
  teacherFeedback: number;
}

interface TeacherSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  assignmentSubmission: number;
  studentFeedback: number;
}

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>("")
  const [settings, setSettings] = useState<any>({
    pushEnabled: true,
    emailEnabled: true,
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

        // Cargar configuraciones desde la API
        const notificationSettings = await userApi.getNotificationSettings(userId)
        if (notificationSettings) {
          console.log("Configuraciones de notificaciones:", notificationSettings.settings)
          setSettings(notificationSettings)
        } else {
          // Usar configuraciones predeterminadas si no hay datos
          const defaultSettings = response.user.userType === "alumno" 
            ? {
                pushEnabled: true,
                emailEnabled: true,
                newAssignment: BOTH,
                deadlineReminder: BOTH,
                courseEnrollment: BOTH,
                teacherFeedback: BOTH,
              } 
            : {
                pushEnabled: true,
                emailEnabled: true,
                assignmentSubmission: BOTH,
                studentFeedback: BOTH,
              };
          
          setSettings(defaultSettings)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setLoading(false)
        Alert.alert("Error", "No se pudieron cargar las configuraciones")
      }
    }

    fetchUserData()
     return () => {
    // Limpiar cualquier estado o suscripción pendiente
    setSettings({
      pushEnabled: true,
      emailEnabled: true,
    })
    setUserType("")
    setLoading(false)
  }
  }, [])

  const handleToggleChange = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    })
  }

  const handleNotificationTypeChange = (key: string, value: number) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const userId = await getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "No se pudo recuperar el ID del usuario")
        setLoading(false)
        return
      }
      
      // Enviamos directamente el objeto settings actual, que ya tiene la estructura correcta
      // según el tipo de usuario, ya que se cargó desde la API o se inicializó correctamente
      await userApi.setNotificationsSettings(userId, settings);
      
      Alert.alert("Éxito", "Configuraciones de notificaciones guardadas correctamente", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Error al guardar configuraciones:", error)
      Alert.alert("Error", "No se pudieron guardar las configuraciones")
      setLoading(false)
    }
  }

  // Renderiza los chips de selección de tipo de notificación
const renderNotificationTypeSelector = (settingKey: string) => {
  const currentValue = settings[settingKey] ?? BOTH;

  return (
    <View style={styles.chipContainer}>
      <Chip
        selected={currentValue === DISABLED}
        onPress={() => handleNotificationTypeChange(settingKey, DISABLED)}
        style={styles.chip}
        mode={currentValue === DISABLED ? "flat" : "outlined"}
        icon="bell-off"
      >
        Ninguna
      </Chip>
      <Chip
        selected={currentValue === PUSH_ONLY}
        onPress={() => handleNotificationTypeChange(settingKey, PUSH_ONLY)}
        style={styles.chip}
        disabled={!settings.pushEnabled && currentValue !== PUSH_ONLY}
        mode={currentValue === PUSH_ONLY ? "flat" : "outlined"}
        icon="bell"
      >
        Push
      </Chip>
      <Chip
        selected={currentValue === EMAIL_ONLY}
        onPress={() => handleNotificationTypeChange(settingKey, EMAIL_ONLY)}
        style={styles.chip}
        disabled={!settings.emailEnabled && currentValue !== EMAIL_ONLY}
        mode={currentValue === EMAIL_ONLY ? "flat" : "outlined"}
        icon="email"
      >
        Email
      </Chip>
      <Chip
        selected={currentValue === BOTH}
        onPress={() => handleNotificationTypeChange(settingKey, BOTH)}
        style={styles.chip}
        disabled={(!settings.pushEnabled || !settings.emailEnabled) && currentValue !== BOTH}
        mode={currentValue === BOTH ? "flat" : "outlined"}
        icon="bell-ring"
      >
        Ambos
      </Chip>
    </View>
  );
};

  // Función para obtener la descripción del tipo de notificación
const getNotificationTypeDescription = (settingKey: string) => {
  const value = settings[settingKey] ?? BOTH;

  switch (value) {
    case DISABLED:
      return "Notificaciones desactivadas";
    case PUSH_ONLY:
      return "Solo notificaciones push";
    case EMAIL_ONLY:
      return "Solo notificaciones por email";
    case BOTH:
      return "Notificaciones push y email";
    default:
      return "";
  }
};


  // Función para verificar si una configuración existe
  const hasSettingOption = (key: string): boolean => {
    return key in settings;
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

                {hasSettingOption("newAssignment") && (
                  <>
                    <Text style={styles.categoryTitle}>Tareas y Exámenes</Text>
                    <List.Item
                      title="Nuevas tareas o exámenes"
                      description={getNotificationTypeDescription("newAssignment")}
                      left={(props) => <List.Icon {...props} icon="book" />}
                    />
                    {renderNotificationTypeSelector("newAssignment")}
                    <Divider style={styles.divider} />
                  </>
                )}

                {hasSettingOption("deadlineReminder") && (
                  <>
                    <Text style={styles.categoryTitle}>Recordatorios</Text>
                    <List.Item
                      title="Fechas límite de tareas"
                      description={getNotificationTypeDescription("deadlineReminder")}
                      left={(props) => <List.Icon {...props} icon="clock-alert" />}
                    />
                    {renderNotificationTypeSelector("deadlineReminder")}
                    <Divider style={styles.divider} />
                  </>
                )}

                {(hasSettingOption("courseEnrollment")) && (
                  <>
                    <Text style={styles.categoryTitle}>Cursos</Text>
                    
                    {hasSettingOption("courseEnrollment") && (
                      <>
                        <List.Item
                          title="Inscripción a nuevos cursos"
                          description={getNotificationTypeDescription("courseEnrollment")}
                          left={(props) => <List.Icon {...props} icon="school" />}
                        />
                        {renderNotificationTypeSelector("courseEnrollment")}
                      </>
                    )}
                    
                    
                    
                    <Divider style={styles.divider} />
                  </>
                )}

                {hasSettingOption("teacherFeedback") && (
                  <>
                    <Text style={styles.categoryTitle}>Feedback</Text>
                    <List.Item
                      title="Feedback de docentes"
                      description={getNotificationTypeDescription("teacherFeedback")}
                      left={(props) => <List.Icon {...props} icon="message-text" />}
                    />
                    {renderNotificationTypeSelector("teacherFeedback")}
                  </>
                )}
              </List.Section>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <List.Section>
                <List.Subheader>Notificaciones para Docentes</List.Subheader>

                {hasSettingOption("assignmentSubmission") && (
                  <>
                    <Text style={styles.categoryTitle}>Entregas</Text>
                    <List.Item
                      title="Entregas de tareas o exámenes"
                      description={getNotificationTypeDescription("assignmentSubmission")}
                      left={(props) => <List.Icon {...props} icon="file-document" />}
                    />
                    {renderNotificationTypeSelector("assignmentSubmission")}
                    <Divider style={styles.divider} />
                  </>
                )}

                {hasSettingOption("studentFeedback") && (
                  <>
                    <Text style={styles.categoryTitle}>Feedback</Text>
                    <List.Item
                      title="Feedback de estudiantes"
                      description={getNotificationTypeDescription("studentFeedback")}
                      left={(props) => <List.Icon {...props} icon="message-reply" />}
                    />
                    {renderNotificationTypeSelector("studentFeedback")}
                  </>
                )}
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
    marginVertical: 15,
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
    marginLeft: 54, // Alineado con el contenido del List.Item
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  }
})