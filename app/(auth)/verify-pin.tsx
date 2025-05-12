import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { userApi } from "../../api/userApi";
import { Button, TextInput } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

export default function VerifyPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

const handleVerifyPin = async () => {
  try {
    console.log("Email:", email);
    console.log("PIN:", pin);
    const response = await userApi.verifyPin(pin, email);
    console.log("Response from verifyPin:", response);
    console.log("PIN:", pin);
    if (response.success) {
      // El PIN es válido, redirigir al usuario o mostrar mensaje de éxito
    } else {
      // Mostrar mensaje de error
      setError(response.message || "El PIN es incorrecto o ha expirado.");
    }
  } catch (error) {
    setError("Hubo un problema al verificar el PIN.");
  }
};

const handleRequestNewPin = async () => {
  try {
    console.log("Email:", email);
    const response = await userApi.requestNewPin(email);
    if (response.success) {
      // El nuevo PIN ha sido enviado, mostrar mensaje de éxito
      Alert.alert("Nuevo PIN enviado", "Te hemos enviado un nuevo PIN a tu correo.");
    } else {
      setError("Hubo un problema al solicitar un nuevo PIN.");
    }
  } catch (error) {
    setError("Hubo un problema al solicitar un nuevo PIN.");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu cuenta</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        label="Ingresa el PIN"
        value={pin}
        onChangeText={setPin}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
      />

      <Button
        mode="contained"
        onPress={handleVerifyPin}
        disabled={loading}
        style={styles.button}
      >
        {loading ? <ActivityIndicator color="#fff" /> : "Verificar PIN"}
      </Button>

      <Button
        mode="outlined"
        onPress={handleRequestNewPin}
        disabled={loading}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          "Solicitar un nuevo PIN"
        )}
      </Button>
    </View>
  );
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  errorText: {
    color: "red",
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
  },
});
