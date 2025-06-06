import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";
import { userApi } from "../../api/userApi";
import { colors, spacing, typography, shape, components, commonStyles } from "../../theme/theme";

const ResetPassword = () => {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword) {
      Alert.alert("Error", "Debes ingresar una nueva contraseña.");
      return;
    }

    setLoading(true);

    try {
      const response = await userApi.resetPassword(newPassword, token!);

      Alert.alert("Éxito", "Tu contraseña ha sido actualizada.");
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Error al resetear contraseña:", error);
      Alert.alert(
        "Error",
        "No se pudo cambiar la contraseña. Intentalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reestablecer Contraseña</Text>
      <TextInput
        label="Nueva contraseña"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        mode="outlined"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : "Actualizar Contraseña"}
      </Button>
    </View>
  );
};

export default ResetPassword;

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
