import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { userApi } from "../../api/userApi";
import { Button, TextInput } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

const handleVerifyPin = async () => {
  try {
    setLoading(true);

    const parsedPin = parseInt(pin, 10);
    if (isNaN(parsedPin)) {
      setError("El PIN debe ser un número válido.");
      return;
    }

    const response = await userApi.verifyPin(parsedPin, email);
    console.log("Responseeee:", response);

    if (response.description.includes("Email verified successfully") ) {
      Alert.alert("Éxito", "Tu email fue verificado correctamente.");
      await AsyncStorage.removeItem("pendingEmailVerification");
      router.push("/(auth)/login");
    } else {
      setError("El PIN es incorrecto o ha expirado.");
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.description ||
      "Hubo un problema al verificar el PIN.";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};



const handleRequestNewPin = async () => {
  try {
    console.log("Email:", email);
    const response = await userApi.requestNewPin(email);
    console.log("Response:", response);
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
