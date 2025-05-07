import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Modal } from "react-native";
import {
  Text,
  Title,
  Avatar,
  Card,
  Button,
  Divider,
  List,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { getItemAsync, deleteItemAsync } from "expo-secure-store";
import { router, useLocalSearchParams } from "expo-router";
import { setAuthToken } from "../../api/client";
import { userApi } from "../../api/userApi";
import EditProfileScreen from "@/components/EditProfileScreen";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  userType: string;
  lat?: number;
  lng?: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const { id } = useLocalSearchParams(); // ID del perfil a ver, si se pasa

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const storedId = await getItemAsync("userId");
      const token = await getItemAsync("userToken");

      if (!token || !storedId) {
        setError("No se pudo recuperar la sesión.");
        setLoading(false);
        return;
      }

      setAuthToken(token);

      try {
        // Try with a longer timeout
        const response = await fetchWithTimeout(
          userApi.getUserById(storedId),
          10000 // Increased to 10 seconds
        );

        const fetchedUser = response.user;
        setProfile(fetchedUser);
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        setError("No pudimos cargar el perfil. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array so it only runs once

  const fetchWithTimeout = (
    promise: Promise<any>,
    timeout = 5000
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado. Verifica tu conexión."));
      }, timeout);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sí, salir",
        onPress: async () => {
          try {
            await deleteItemAsync("userToken");
            await deleteItemAsync("userId");
            await deleteItemAsync("refreshToken");
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Alert.alert(
              "Error",
              "No se pudo cerrar sesión. Inténtalo de nuevo."
            );
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    console.log("Opening edit profile modal"); // Add this debug log
    setShowEditModal(true);
  };

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setShowEditModal(false);
    console.log("Modal closed after update"); // Add this debug log
  };

  const handleCancelEdit = () => {
    console.log("Cancelling edit"); // Add this debug log
    setShowEditModal(false);
  };

  const navigateToMyCourses = () => {
    router.push("./(app)/my-courses")
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Title style={styles.title}>{"Mi Perfil"}</Title>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Modal
              visible={showEditModal}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => {
                console.log("Modal closed via onRequestClose")
                setShowEditModal(false)
              }}
          >
            {profile && (
                <EditProfileScreen
                    profile={profile}
                    onProfileUpdated={handleProfileUpdated}
                    onCancel={() => {
                      console.log("Cancel button pressed")
                      setShowEditModal(false)
                    }}
                />
            )}
          </Modal>
          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                  size={80}
                  label={profile?.name.substring(0, 2).toUpperCase() || "U"}
                  style={{ backgroundColor: theme.colors.primary }}
              />
            </View>
            <Card.Content style={styles.profileInfo}>
              <Title style={styles.profileName}>{profile?.name}</Title>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.profileTypeContainer}>
                <Text style={styles.profileTypeLabel}>
                  {profile?.userType === "alumno" ? "👨‍🎓 Alumno" : "👨‍🏫 Docente"}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <List.Section>
                <List.Subheader>Información personal</List.Subheader>
                <List.Item
                    title="Correo electrónico"
                    description={profile?.email}
                    left={(props) => <List.Icon {...props} icon="email" />}
                />
                <List.Item
                    title="Tipo de cuenta"
                    description={profile?.userType === "alumno" ? "Alumno" : "Docente"}
                    left={(props) => <List.Icon {...props} icon="account" />}
                />
              </List.Section>
            </Card.Content>
          </Card>
          <List.Item
              title="Ubicación actual"
              description={
                profile && profile.lat !== undefined && profile.lng !== undefined
                    ? `Lat: ${profile.lat.toFixed(5)}, Lng: ${profile.lng.toFixed(5)}`
                    : "Ubicación no disponible"
              }
              left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <Card style={styles.actionsCard}>
            <Card.Content>
              <List.Section>
                <List.Subheader>Acciones</List.Subheader>
                <List.Item
                    title="Mis Cursos"
                    description={
                      profile?.userType === "alumno" ? "Cursos en los que estás inscrito" : "Cursos que has creado"
                    }
                    left={(props) => <List.Icon {...props} icon="book-open-variant" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={navigateToMyCourses}
                />
                <Divider />
                <List.Item
                    title="Editar perfil"
                    left={(props) => <List.Icon {...props} icon="account-edit" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={handleEditProfile}
                />
                <Divider />
                <List.Item
                    title="Cambiar contraseña"
                    left={(props) => <List.Icon {...props} icon="lock-reset" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => Alert.alert("Información", "Funcionalidad en desarrollo")}
                />
                <Divider />
                <List.Item
                    title="Ajustes"
                    left={(props) => <List.Icon {...props} icon="cog" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => Alert.alert("Información", "Funcionalidad en desarrollo")}
                />
              </List.Section>
            </Card.Content>
          </Card>
          <Button mode="contained" icon="logout" style={styles.logoutButton} onPress={handleLogout}>
            Cerrar sesión
          </Button>
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
  profileCard: {
    margin: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileInfo: {
    alignItems: "center",
    paddingBottom: 20,
  },
  profileName: {
    fontSize: 22,
    marginTop: 10,
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    marginBottom: 10,
  },
  profileTypeContainer: {
    marginTop: 5,
  },
  profileTypeLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoCard: {
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    elevation: 2,
  },
  actionsCard: {
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    elevation: 2,
  },
  logoutButton: {
    margin: 15,
    paddingVertical: 6,
  },
  errorText: {
    color: "red",
    margin: 15,
    textAlign: "center",
  },
});
