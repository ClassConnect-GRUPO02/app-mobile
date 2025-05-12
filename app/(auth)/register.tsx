import React, { useState } from "react";
import * as Location from 'expo-location';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, Title, RadioButton, ActivityIndicator } from "react-native-paper";
import { Link, router } from "expo-router";
import { userApi, UserRegisterData } from "../../api/userApi"; // Importa el API de usuarios simplificado

export default function RegisterScreen(): React.JSX.Element {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [userType, setUserType] = useState<string>("alumno");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const validateForm = (): boolean => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
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
  

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      // Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
      }
  
      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
  
      const userData: UserRegisterData = {
        name,
        email,
        password,
        userType,
        latitude,
        longitude
      };
  
      await fetchWithTimeout(userApi.register(userData));
  
      // Redirigir a la pantalla de verificación de PIN
      router.push(`/(auth)/verify-pin?email=${email}`);

      Alert.alert("Registro exitoso", "Verifica tu cuenta ingresando el PIN enviado al correo electrónico.", [{ text: "OK" }]);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Ocurrió un error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Title style={styles.title}>Crear Cuenta</Title>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
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

          <Button 
            mode="contained" 
            onPress={handleRegister} 
            style={styles.button}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : "Registrarse"}
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
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  }
});