import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Title, Card, ActivityIndicator, Divider, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { getItemAsync } from 'expo-secure-store';
import { apiClient, setAuthToken } from '../../api/client';

// Tipo para almacenar la información del usuario
interface UserData {
  id: string;
  name: string;
  email: string;
  userType: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string>('');
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Obtener token almacenado
        const token = await getItemAsync('userToken');
        
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }
        
        // Configurar el token en el cliente API
        setAuthToken(token);
        
        // Obtener datos del usuario
        const response = await apiClient.get<{ user: UserData }>('/user/me');
        setUserData(response.user);
        
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setError('No pudimos cargar tus datos. Por favor, inténtalo de nuevo.');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>¡Bienvenido{userData?.name ? `, ${userData.name}` : ''}!</Title>
          <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Tu espacio de aprendizaje</Title>
            <Text style={styles.cardText}>
              Explora las diferentes secciones de la aplicación para aprovechar al máximo tu experiencia.
            </Text>
          </Card.Content>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  featureCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
});