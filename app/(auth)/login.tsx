import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Title,
  ActivityIndicator,
} from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { userApi } from "../../api/userApi";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
//import type { LoginRequest, ApiError } from "../../api/client";

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      const savedRefreshToken = await SecureStore.getItemAsync("refreshToken");

      if (savedRefreshToken) {
        setCanUseBiometric(true);
      } else {
        console.log(
          "No hay un token de actualización guardado. La autenticación biométrica no está disponible.");
        setCanUseBiometric(false);
      }
    };

    checkBiometricAvailability();
  }, []);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [canUseBiometric, setCanUseBiometric] = useState(false);

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return false;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("El correo electrónico no es válido");
      return false;
    }

    setError("");
    return true;
  };

  const fetchWithTimeout = (
    promise: Promise<any>,
    timeout = 5000
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado. Verifica tu conexión."));
      }, timeout);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const credentials = { email, password };
      const response = await fetchWithTimeout(userApi.login(credentials));

      if (response?.token && response?.id && response?.refreshToken) {
        router.replace("/(app)/home");
      } else {
        throw new Error("Token no recibido del servidor.");
      }
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);

      if (error instanceof Error) {
        setError("Credenciales incorrectas.");
      } else {
        setError("Ocurrió un error al conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const savedRefreshToken = await SecureStore.getItemAsync("refreshToken");

    if (!savedRefreshToken) {
      Alert.alert(
        "Sin sesión previa",
        "Por favor inicia sesión manualmente primero."
      );
      return;
    }

    const biometricAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Iniciar sesión con biometría",
      fallbackLabel: "Usar contraseña",
    });

    if (!biometricAuth.success) {
      Alert.alert(
        "Autenticación fallida",
        "No se pudo verificar tu identidad."
      );
      return;
    }

    try {
      setLoading(true);

      await userApi.refreshToken(savedRefreshToken);

      router.replace("/(app)/home");
    } catch (err) {
      Alert.alert(
        "Sesión expirada",
        "Por favor inicia sesión con email y contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Title style={styles.title}>Iniciar Sesión</Title>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : "Iniciar Sesión"}
          </Button>
          {canUseBiometric && (
            <Button
              mode="outlined"
              icon="fingerprint"
              onPress={handleBiometricLogin}
              style={{ marginTop: 10 }}
              disabled={loading}
            >
              Iniciar con biometría
            </Button>
          )}

          <View style={styles.registerContainer}>
            <Text>¿No tienes una cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <Button mode="text" compact>
                Registrarse
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});
