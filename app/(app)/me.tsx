import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { userApi } from "../../api/userApi";
import React from "react";

export default function MyProfileRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const id = await userApi.getUserId();
        console.log("ID del usuario:", id);

        if (id) {
          router.replace(`/(app)/profile/${id}`);
        } else {
          // Si no hay ID, podés redirigir a login o mostrar error
          console.warn("No se encontró el ID del usuario");
        }
      } catch (error) {
        console.error("Error obteniendo el ID del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Error al cargar el perfil.</Text>
    </View>
  );
}
