import React, { useState } from "react";
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
import { Link, useRouter, router } from "expo-router";
import { userApi } from "../../api/userApi";
import {
  GoogleOneTapSignIn,
  isErrorWithCode,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as Location from 'expo-location';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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

  const fetchWithTimeout = (promise: Promise<any>, timeout = 5000): Promise<any> => {
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

      if (response?.token && response?.id) {
        Alert.alert(
          "Inicio de sesión exitoso",
          "Has iniciado sesión correctamente",
          [{ text: "OK", onPress: () => router.replace("/(app)/home")}]
        );
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

  const handleGoogleLogin = async () => {
    try {
      await GoogleOneTapSignIn.checkPlayServices();
      const response = await GoogleOneTapSignIn.signIn();
  
      if (isSuccessResponse(response)) {
        const user = response.data as { email?: string; name?: string; photo?: string; sub?: string };
        console.log("✅ Usuario de Google:", user);
  
        // Consular a la API si ya está registrado
        const check = await fetchWithTimeout(
          userApi.checkEmailExists({ email: (user as { email?: string }).email || "" })
        );
  
        if (check.exists) {
          // Paso 2: Preguntar si desea sincronizar info
          Alert.alert(
            "Cuenta ya registrada",
            "¿Querés sincronizar los datos de tu cuenta con Google?",
            [
              {
                text: "Cancelar",
                style: "cancel",
              },
              {
                text: "Sí, sincronizar",
                onPress: async () => {
                  try {
                    await fetchWithTimeout(
                      userApi.syncWithFederated({
                        email: user.email,
                        name: user.name,
                        photo: user.photo,
                      })
                    );
                    Alert.alert("Sincronización exitosa", "Tus datos se actualizaron.");
                    router.replace("/(app)/home");
                  } catch (err) {
                    Alert.alert("Error", "No se pudo sincronizar la información.");
                  }
                },
              },
            ]
          );
        } else {
          // Paso 3: Registrar automáticamente al usuario
          const locationPermission = await Location.requestForegroundPermissionsAsync();
          if (locationPermission.status !== 'granted') {
            throw new Error('Permiso de ubicación denegado');
          }
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
  
          await fetchWithTimeout(
            userApi.register({
              name: user.name || "Usuario",
              email: user.email || "",
              password: user.sub || "", // usar el sub como placeholder único
              userType: "user",
              latitude,
              longitude,
            })
          );
  
          Alert.alert("Registro exitoso", "Cuenta creada correctamente");
          router.replace("/(app)/home");
        }
  
      } else if (isNoSavedCredentialFoundResponse(response)) {
        Alert.alert("Google Login", "No se encontró sesión previa en Google");
      }
  
    } catch (error) {
      console.error("❌ Error Google Sign-In:", error);
      const message = isErrorWithCode(error)
        ? `Error (${error.code}): ${error.message}`
        : "Ocurrió un error inesperado";
      Alert.alert("Error de inicio de sesión", message);
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

          <Button
            mode="outlined"
            icon="google"
            onPress={handleGoogleLogin}
            style={{ marginTop: 10 }}
          >
            Iniciar sesión con Google
          </Button>

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
