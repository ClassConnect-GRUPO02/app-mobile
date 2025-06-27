import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { userApi } from "../../api/userApi";
import { Button, TextInput } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { deleteItemAsync } from "expo-secure-store";

export default function VerifyPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  // Debug: mostrar email al cargar la pantalla
  React.useEffect(() => {
    console.log("📱 VerifyPinScreen cargada con email:", email);
  }, [email]);

const handleVerifyPin = async () => {
  try {
    setLoading(true);
    setError(""); // Limpiar errores previos

    const parsedPin = parseInt(pin, 10);
    if (isNaN(parsedPin)) {
      setError("El PIN debe ser un número válido.");
      return;
    }

    if (!email) {
      setError("Email no encontrado. Por favor regístrate de nuevo.");
      return;
    }

    console.log("Verificando PIN para email:", email);
    const response = await userApi.verifyPin(parsedPin, email);
    console.log("Respuesta de verificación:", response);

    if (response.description.includes("Email verified successfully")) {
      console.log("✅ Verificación exitosa, limpiando estado pendiente...");
      // Limpiar el estado de verificación pendiente del Secure Store
      await deleteItemAsync("pendingEmailVerification");
      console.log("🗑️ Estado de verificación eliminado del Secure Store");
      
      Alert.alert(
        "¡Verificación exitosa!", 
        "Tu email ha sido verificado correctamente. Ahora puedes iniciar sesión.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("🔄 Navegando a login después de verificación exitosa...");
              // Usar replace para evitar que pueda volver a verify-pin
              router.replace("/(auth)/login");
            }
          }
        ]
      );
    } else {
      setError("El PIN es incorrecto o ha expirado. Intenta de nuevo.");
    }
  } catch (error: any) {
    console.error("Error al verificar PIN:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.description ||
      error?.message ||
      "Hubo un problema al verificar el PIN. Intenta de nuevo.";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};



const handleRequestNewPin = async () => {
  try {
    setLoading(true);
    setError(""); // Limpiar errores previos

    if (!email) {
      setError("Email no encontrado. Por favor regístrate de nuevo.");
      return;
    }

    console.log("Solicitando nuevo PIN para email:", email);
    const response = await userApi.requestNewPin(email);
    console.log("Respuesta de nuevo PIN:", response);
    
    if (response.success) {
      // Limpiar el PIN actual para que el usuario ingrese el nuevo
      setPin("");
      Alert.alert(
        "Nuevo PIN enviado", 
        "Te hemos enviado un nuevo PIN a tu correo. Revisa tu bandeja de entrada."
      );
    } else {
      setError("Hubo un problema al solicitar un nuevo PIN. Intenta de nuevo.");
    }
  } catch (error: any) {
    console.error("Error al solicitar nuevo PIN:", error);
    const errorMessage = 
      error?.response?.data?.message ||
      error?.response?.data?.description ||
      error?.message ||
      "Hubo un problema al solicitar un nuevo PIN. Intenta de nuevo.";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu cuenta</Text>
      
      {email && (
        <Text style={styles.emailText}>
          Hemos enviado un PIN de verificación a: {email}
        </Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        label="Ingresa el PIN de 6 dígitos"
        value={pin}
        onChangeText={setPin}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        placeholder="123456"
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
  emailText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
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
