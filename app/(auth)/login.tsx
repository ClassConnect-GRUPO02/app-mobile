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
  Modal,
  Portal,
} from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { userApi } from "../../api/userApi";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
//import type { LoginRequest, ApiError } from "../../api/client";
import {
  GoogleSignin,
  isSuccessResponse,
  SignInSuccessResponse,
  statusCodes,
  type User
} from '@react-native-google-signin/google-signin';
import * as Location from 'expo-location';



interface GoogleUserData {
  name: string;
  email: string;
}

const LoginScreen = (): React.JSX.Element => {
  const router = useRouter();

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      const savedRefreshToken = await SecureStore.getItemAsync("refreshToken");
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (savedRefreshToken && hasHardware && isEnrolled) {
        setCanUseBiometric(true);
      } else {
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
  const [googleUserData, setGoogleUserData] = useState<GoogleUserData | null>(null);

  useEffect(() => {
    // Configurar Google Sign-In
    GoogleSignin.configure({
      webClientId: "120382293299-ds3j4ogbipqrb553mj4qj8rqt5ihgjo2.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

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
    } catch (error: any) {
      console.error("Error durante el inicio de sesión:", error);
  
      if (error?.response?.status === 403) {
        // Usuario bloqueado
        setError("Tu cuenta está bloqueada. Por favor, contactá al soporte.");
      } else if (error instanceof Error) {
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
      // Verificar si Google Play Services está disponible
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      
      console.log('✅ Respuesta de Google:', response);
      
      if(isSuccessResponse(response)) {
        try {
          const googleInfo = response.data
          //const photo = googleInfo.user?.photo;
      
  
      // Consultar a la API si ya está registrado
          const check = await fetchWithTimeout(
            userApi.checkEmailExists(googleInfo.user.email)
          );

          console.log("Respuesta de verificación de correo:", check);
          
          if (check.exists) {
            await userApi.storeToken(check.token);
            await userApi.storeUserId(check.id);
            console.log("Id de usuario:", check.id);
            Alert.alert("Cuenta ya registrada", "Iniciando sesión...");
            router.replace("/(app)/home");
          } else {
            // Guardamos los datos para registro
            setGoogleUserData({
              name: googleInfo.user.givenName + " " +googleInfo.user.familyName || "Usuario",
              email: googleInfo.user.email,
            });
  
            router.push({
              pathname: "/(auth)/register",
              params: {
                googleUserData: JSON.stringify({
                  name: googleInfo.user.givenName + " " +googleInfo.user.familyName || "Usuario",
                  email: googleInfo.user.email,
                  password: googleInfo.user.id,
                }),
              },
            });
          }
        } catch (error) {
          console.error("Error checking email:", error);
          Alert.alert("Error", "No se pudo verificar si el correo existe");
        }
      } else {
        Alert.alert("Error", "No se pudo obtener la información de Google");
      }
    } catch (error: any) {
      console.error('Error Google Sign-In:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelado', 'El inicio de sesión fue cancelado');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('En progreso', 'El inicio de sesión está en curso');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Servicios de Google Play no disponibles');
      } else {
        Alert.alert('Error de inicio de sesión', error.message || 'Ocurrió un error inesperado');
      }
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
    padding: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    marginVertical: 5,
  },
});

export default LoginScreen;
