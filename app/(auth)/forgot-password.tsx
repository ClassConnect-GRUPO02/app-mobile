import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";
import { userApi } from "../../api/userApi";
import { useRouter } from "expo-router";
import { colors, spacing, typography, shape, components, commonStyles } from "../../theme/theme";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await userApi.forgotPassword(email);
      Alert.alert("Éxito", "Revisa tu correo para continuar con el reseteo.");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <TextInput
        label="Correo electrónico"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button mode="contained" onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : "Enviar Instrucciones"}
      </Button>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    backgroundColor: colors.background.default,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    marginBottom: spacing.xl,
    textAlign: "center",
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: shape.borderRadius.md,
  },
});
