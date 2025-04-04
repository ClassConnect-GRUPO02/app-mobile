import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Button, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';



export default function RootIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('../assets/images/react-logo.png')} style={styles.logo} />
      <Title style={styles.title}>ClassConnect</Title>

      {/* Botones */}
      <View style={styles.registerContainer}>
        <Text>¿Ya tienes una cuenta? </Text>
        <Link href="/(auth)/login" asChild>
          <Button mode="text" compact>
            Inicia Sesión
          </Button>
        </Link>
      </View>
      <View style={styles.registerContainer}>
        <Text>¿No tienes una cuenta? </Text>
        <Link href="/(auth)/register" asChild>
          <Button mode="text" compact>
            Regístrate
          </Button>
        </Link>
      </View>
    </View>
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
