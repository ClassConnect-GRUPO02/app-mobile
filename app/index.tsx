import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Title, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function RootIndex() {
  return (
    <ThemedView style={styles.container}>
      {/* Logo */}
      <Image source={require('../assets/images/react-logo.png')} style={styles.logo} />
      <ThemedText style={styles.title}>ClassConnect</ThemedText>

      {/* Botones */}
      <ThemedView style={styles.registerContainer}>
        <ThemedText>¿Ya tienes una cuenta? </ThemedText>
        <Link href="/(auth)/login" asChild>
          <Button mode="text" compact>
            Inicia Sesión
          </Button>
        </Link>
      </ThemedView>
      <ThemedView style={styles.registerContainer}>
        <ThemedText>¿No tienes una cuenta? </ThemedText>
        <Link href="/(auth)/register" asChild>
          <Button mode="text" compact>
            Regístrate
          </Button>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
});
