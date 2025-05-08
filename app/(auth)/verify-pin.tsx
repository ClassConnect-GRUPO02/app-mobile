import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { userApi } from "../../api/userApi"; 
import { Button, TextInput } from "react-native-paper";

export default function VerifyPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleVerifyPin = async () => {
    setLoading(true);
    try {
      const isValid = await userApi.verifyPin(pin);  // Llamada al backend para verificar el PIN

      if (isValid) {
        Alert.alert("Cuenta activada", "Tu cuenta ha sido activada exitosamente.");
        router.push("/home");  // Redirigir a la página principal
      } else {
        setError("El PIN es incorrecto o ha expirado.");
      }
    } catch (err) {
      setError("Hubo un problema con la verificación.");
    } finally {
      setLoading(false);
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
