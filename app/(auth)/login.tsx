import React, { useState, useEffect } from "react";
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
  Provider
} from "react-native-paper";
import { Link, useRouter, router } from "expo-router";
import { userApi } from "../../api/userApi";
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as Location from 'expo-location';



export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showUserTypeModal, setShowUserTypeModal] = useState<boolean>(false);
const [googleUserData, setGoogleUserData] = useState<any>(null);


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

  const handleRegisterWithUserType = async (userType: string) => {
    if (!googleUserData) return;
  
    try {
      await fetchWithTimeout(
        userApi.register({
          ...googleUserData,
          userType,
        })
      );
      setShowUserTypeModal(false);
      Alert.alert("Registro exitoso", "Cuenta creada correctamente");
      router.replace("/(app)/home");
    } catch (err) {
      console.error(`Error registrando ${userType}:`, err);
      Alert.alert("Error", "No se pudo completar el registro");
    }
  };
  
  

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      const credentials = { email, password };
      const response = await fetchWithTimeout(userApi.login(credentials));
  
      if (response?.token && response?.id) {
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
      // Configurar Google Sign-In
      GoogleSignin.configure(
        {
          webClientId: "120382293299-ds3j4ogbipqrb553mj4qj8rqt5ihgjo2.apps.googleusercontent.com"
        }
      );
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      if(isSuccessResponse(userInfo)) {
  
      console.log('✅ Usuario de Google:', userInfo);
  
      const email = userInfo.data?.user.email;
      const name = userInfo.data?.user.name;
      //const photo = userInfo.user?.photo;
      
  
      // Consultar a la API si ya está registrado
      const check = await fetchWithTimeout(
        userApi.checkEmailExists(email ?? "")
      );
  
      if (check.exists) {
        Alert.alert("Cuenta ya registrada");
        router.replace("/(app)/home");
      } else {
        const locationPermission = await Location.requestForegroundPermissionsAsync();
        if (locationPermission.status !== 'granted') {
          throw new Error('Permiso de ubicación denegado');
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
  
        // Guardamos los datos para registro
        setGoogleUserData({
          name: name || "Usuario",
          email: email || "",
          password: userInfo.data?.user.id || "", // el id como password (??? depende de tu app)
          latitude,
          longitude,
        });
  
        // Mostrar modal para elegir tipo de usuario
        setShowUserTypeModal(true);
      }
    }else{
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
        Alert.alert('Error de inicio de sesión', 'Ocurrió un error inesperado');
      }
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
            <Text>¿No tienes una cuentaaa? </Text>
            <Link href="/(auth)/register" asChild>
              <Button mode="text" compact>
                Registrarse
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
      <Portal>
      <Modal visible={showUserTypeModal} onDismiss={() => setShowUserTypeModal(false)} contentContainerStyle={styles.modalContainer}>
        <Text style={styles.modalTitle}>¿Qué tipo de usuario sos?</Text>
        <Button mode="contained" onPress={() => handleRegisterWithUserType("alumno")} style={styles.modalButton}>
          Alumno
        </Button>
        <Button mode="contained" onPress={() => handleRegisterWithUserType("docente")} style={styles.modalButton}>
          Docente
        </Button>
      </Modal>
    </Portal>
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    marginVertical: 5,
  },
  
});
