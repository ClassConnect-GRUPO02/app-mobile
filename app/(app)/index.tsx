import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Title,
  Card,
  ActivityIndicator,
  Divider,
  useTheme,
  Button,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { apiClient, setAuthToken } from "../../api/client";
import { getItemAsync } from "expo-secure-store";

import type { UserInfo } from "../../api/userApi";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/constants/Colors";

// Tipo para almacenar la información del usuario
interface UserData {
  id: string;
  name: string;
  email: string;
  userType: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string>("");
  const theme = useTheme();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await getItemAsync("userToken");
        const storedId = await getItemAsync("userId");

        if (!token || !storedId) {
          throw new Error("Faltan credenciales para autenticar");
        }

        const response = await apiClient.get<{ user: UserInfo }>(
          `/user/${storedId}`
        );

        setUserData(response.user);
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        setError("No pudimos cargar tus datos. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>
            ¡Hola{userData?.name ? `, ${userData.name}` : ""}!
          </Title>
          <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Tu espacio de aprendizaje</Title>
            <Text style={styles.cardText}>
              Explora las diferentes secciones de la aplicación para aprovechar
              al máximo tu experiencia.
            </Text>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Title style={styles.sectionTitle}>Cursos disponibles</Title>

        <Card style={styles.featureCard}>
          <Card.Cover
            source={{
              uri: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2062&auto=format&fit=crop",
            }}
            style={styles.cardCover}
          />
          <Card.Content>
            <View style={styles.featureItem}>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Explora nuestros cursos</Text>
                <Text style={styles.featureDescription}>
                  Descubre todos los cursos disponibles y encuentra el que mejor
                  se adapte a tus necesidades
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => router.push("/(courses)")}
              style={styles.courseButton}
            >
              Ver cursos
            </Button>
          </Card.Actions>
        </Card>

        <Divider style={styles.divider} />

        <Title style={styles.sectionTitle}>Navega por la aplicación</Title>

        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏠</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Inicio</Text>
                <Text style={styles.featureDescription}>
                  Accede rápidamente a las novedades y recursos disponibles
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔍</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Buscar</Text>
                <Text style={styles.featureDescription}>
                  Encuentra perfiles de otros usuarios para conectar
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👤</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Perfil</Text>
                <Text style={styles.featureDescription}>
                  Administra tu información personal y preferencias
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/chat-asistencia")}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  card: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: AppColors.text,
    fontWeight: '600',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textSecondary,
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: AppColors.divider,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
    color: AppColors.text,
    fontWeight: 'bold',
  },
  featureCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: AppColors.text,
  },
  featureDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: AppColors.error,
    marginBottom: 20,
    textAlign: "center",
    fontSize: 14,
  },
  cardCover: {
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  courseButton: {
    marginTop: 10,
    marginBottom: 5,
    marginRight: 10,
    alignSelf: "flex-end",
    backgroundColor: AppColors.primary,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: AppColors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: AppColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
