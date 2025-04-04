import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import {
  Appbar,
  Button,
  Card,
  Text,
  Avatar,
  Chip,
  Divider,
  List,
  ActivityIndicator,
  Surface,
  useTheme,
} from "react-native-paper"
import { router, useLocalSearchParams } from "expo-router"

// Tipado de usuario
type UserType = "docente" | "alumno"

type User = {
  id: string
  name: string
  profileImage?: string
  bio?: string
  userType: UserType
  specialization?: string
  experience?: string
  grade?: string
  interests?: string[]
  createdAt: string
}

// Perfiles hardcodeados
const users: Record<string, User> = {
  "2": {
    id: "2",
    name: "Ana Martínez",
    userType: "docente",
    specialization: "Matemática",
    experience: "10 años enseñando en secundaria",
    bio: "Apasionada por la enseñanza y las nuevas tecnologías.",
    createdAt: "2022-03-15T10:00:00Z",
    profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  "3": {
    id: "3",
    name: "Usuario Privado",
    userType: "alumno",
    createdAt: "2023-01-01T00:00:00Z",
  },
  "5": {
    id: "5",
    name: "Carlos Pérez",
    userType: "alumno",
    grade: "Universidad - 3er año",
    interests: ["Programación", "Diseño UX", "Inteligencia Artificial"],
    bio: "Estudiante curioso y motivado por aprender cosas nuevas.",
    createdAt: "2021-11-12T08:30:00Z",
    profileImage: "https://randomuser.me/api/portraits/men/47.jpg",
  },
}

export default function UserProfileScreen() {
  const theme = useTheme()
  const params = useLocalSearchParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profileNotFound, setProfileNotFound] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    setProfileNotFound(false)
    setIsPrivate(false)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800)) // Simula carga

      const foundUser = users[userId]
      if (!foundUser) {
        setProfileNotFound(true)
        return
      }

      if (userId === "3") {
        setUser(foundUser)
        setIsPrivate(true)
      } else {
        setUser(foundUser)
      }
    } catch {
      setError("No se pudo cargar la información del perfil. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleContact = () => {
    alert(`Contactando a ${user?.name}`)
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Perfil de Usuario" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Avatar.Icon size={64} icon="alert-circle" style={{ backgroundColor: theme.colors.error }} />
          <Text variant="titleMedium" style={styles.errorText}>
            {error}
          </Text>
          <Button mode="contained" onPress={loadProfile} style={styles.retryButton}>
            Reintentar
          </Button>
        </View>
      </View>
    )
  }

  if (profileNotFound) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Perfil de Usuario" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Avatar.Icon size={64} icon="account-question" style={{ backgroundColor: theme.colors.error }} />
          <Text variant="titleMedium" style={styles.errorText}>
            El perfil que estás buscando no existe o ha sido eliminado.
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.retryButton}>
            Volver
          </Button>
        </View>
      </View>
    )
  }

  if (isPrivate) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Perfil de Usuario" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Avatar.Icon size={64} icon="lock" style={{ backgroundColor: theme.colors.secondary }} />
          <Text variant="titleMedium" style={styles.errorText}>
            Este perfil es privado. El usuario ha decidido no compartir su información públicamente.
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.retryButton}>
            Volver
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Perfil de Usuario" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={loadProfile} colors={[theme.colors.primary]} />}
        >
          {user && (
            <>
              <Surface style={styles.profileHeader} elevation={2}>
                {user.profileImage ? (
                  <Avatar.Image size={80} source={{ uri: user.profileImage }} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  />
                )}
                <View style={styles.profileHeaderInfo}>
                  <Text variant="headlineSmall" style={styles.name}>
                    {user.name}
                  </Text>
                  <Chip
                    icon={user.userType === "docente" ? "school" : "account-school"}
                    style={{
                      backgroundColor: user.userType === "docente" ? theme.colors.primary : theme.colors.secondary,
                    }}
                  >
                    {user.userType === "docente" ? "Docente" : "Alumno"}
                  </Chip>
                </View>
              </Surface>

              <Card style={styles.card}>
                {user.bio && (
                  <>
                    <Card.Title title="Biografía" />
                    <Card.Content>
                      <Text variant="bodyMedium">{user.bio}</Text>
                    </Card.Content>
                    <Divider />
                  </>
                )}

                {user.userType === "docente" && (
                  <>
                    <Card.Title title="Información profesional" />
                    <Card.Content>
                      {user.specialization && (
                        <List.Item
                          title="Especialización"
                          description={user.specialization}
                          left={(props) => <List.Icon {...props} icon="book-open-variant" />}
                        />
                      )}
                      {user.experience && (
                        <List.Item
                          title="Experiencia"
                          description={user.experience}
                          left={(props) => <List.Icon {...props} icon="briefcase" />}
                        />
                      )}
                    </Card.Content>
                  </>
                )}

                {user.userType === "alumno" && (
                  <>
                    <Card.Title title="Información académica" />
                    <Card.Content>
                      {user.grade && (
                        <List.Item
                          title="Nivel"
                          description={user.grade}
                          left={(props) => <List.Icon {...props} icon="school" />}
                        />
                      )}
                      {user.interests && user.interests.length > 0 && (
                        <View>
                          <Text variant="titleSmall" style={styles.interestsLabel}>
                            Intereses:
                          </Text>
                          <View style={styles.interestsContainer}>
                            {user.interests.map((interest, index) => (
                              <Chip key={index} style={styles.interestChip}>
                                {interest}
                              </Chip>
                            ))}
                          </View>
                        </View>
                      )}
                    </Card.Content>
                  </>
                )}

                <Divider />
                <Card.Content style={styles.joinDateContainer}>
                  <Text variant="bodySmall" style={styles.joinDate}>
                    Miembro desde: {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>

              <Button mode="contained" icon="email" onPress={handleContact} style={styles.contactButton}>
                Contactar
              </Button>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  profileHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
  },
  interestsLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestChip: {
    margin: 4,
  },
  joinDateContainer: {
    paddingTop: 8,
  },
  joinDate: {
    fontStyle: "italic",
    opacity: 0.7,
    textAlign: "right",
  },
  contactButton: {
    marginTop: 8,
  },
})
