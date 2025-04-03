import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { TextInput, Button, Text, Title, RadioButton } from "react-native-paper"
import { Link } from "expo-router"
import React from "react"

export default function RegisterScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [userType, setUserType] = useState("alumno")

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Title style={styles.title}>Crear Cuenta</Title>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Nombre completo"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon icon="lock" />}
          />

          <TextInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Text style={styles.radioLabel}>Tipo de usuario:</Text>
          <RadioButton.Group onValueChange={(value) => setUserType(value)} value={userType}>
            <View style={styles.radioContainer}>
              <View style={styles.radioOption}>
                <RadioButton value="alumno" />
                <Text>Alumno</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="docente" />
                <Text>Docente</Text>
              </View>
            </View>
          </RadioButton.Group>

          <Button mode="contained" onPress={() => {}} style={styles.button}>
            Registrarse
          </Button>

          <View style={styles.loginContainer}>
            <Text>¿Ya tienes una cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <Button mode="text" compact>
                Iniciar Sesión
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    marginBottom: 15,
  },
  radioLabel: {
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
})

