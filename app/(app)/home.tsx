import { View, StyleSheet } from "react-native"
import { Button, Text, Title, Card } from "react-native-paper"
import { Link } from "expo-router"
import React from "react"

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Bienvenido/a</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.userTypeText}>
            Iniciaste sesión como:
          </Text>
          <Text style={styles.infoText}>
            Esta es la pantalla principal de la aplicación.
          </Text>
        </Card.Content>
      </Card>

      <Link href="/(auth)/login" asChild>
        <Button mode="contained" style={styles.button}>
          Cerrar Sesión
        </Button>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    marginBottom: 30,
  },
  userTypeText: {
    fontSize: 16,
    marginBottom: 10,
  },
  userType: {
    fontWeight: "bold",
  },
  infoText: {
    lineHeight: 22,
  },
  button: {
    marginTop: 20,
  },
})

