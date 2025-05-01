"use client";

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Title,
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { userApi } from "../api/userApi";

interface EditProfileProps {
  profile: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  onProfileUpdated: (updatedProfile: any) => void;
  onCancel?: () => void; // Add this prop
}

export default function EditProfileScreen({
  profile,
  onProfileUpdated,
}: EditProfileProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido");
      return;
    }

    Alert.alert("Confirmar cambios", "¿Deseas guardar los cambios?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Guardar",
        onPress: () => submitUpdate(),
      },
    ]);
  };

  const handleClose = () => {
    if (onProfileUpdated) {
      onProfileUpdated(profile); // Pass the original profile back
    } else {
      router.back(); // Navigate back if no callback is provided
    }
  }

  const submitUpdate = async () => {
    setLoading(true);
    setError("");

    const updateData = {name, email};
    console.log("Update data:", updateData);
    try {
      const response = await userApi.updateUser(profile.id, updateData);
      console.log("Response:", response);
      const { description } = response;
      if (response.description === "User updated successfully") {
        Alert.alert(
          "Perfil actualizado",
          "Tu información ha sido actualizada correctamente",
          [
            {
              text: "OK",
              onPress: () => {
                onProfileUpdated({ ...profile, name, email });

              },
            },
          ]
        );
      } else {
        setError("No se pudo actualizar el perfil. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setError("Ocurrió un error al actualizar. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Editar Perfil</Title>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="Nombre"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              "Guardar"
            )}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formCard: {
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorText: {
    color: "red",
    margin: 15,
    textAlign: "center",
  },
});
