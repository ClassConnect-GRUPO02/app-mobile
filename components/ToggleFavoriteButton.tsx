import React, { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { courseClient } from "../api/coursesClient";
import { userApi } from "@/api/userApi";

interface ToggleFavoriteButtonProps {
  courseId: string;
}

// This component allows users to toggle the favorite status of a course.
// It checks if the course is already a favorite and updates the status accordingly.
const ToggleFavoriteButton: React.FC<ToggleFavoriteButtonProps> = ({ courseId }) => {
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      try {
        const userId = await userApi.getUserId();
        if (!userId) {
          console.error("No se pudo obtener el ID del usuario");
          return;
        }
        const isFav = await courseClient.checkIfFavorite(userId, courseId);
        console.log(`Estado favorito para el curso ${courseId}:`, isFav);
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Error al verificar si es favorito:", error);
        Alert.alert("Error", "No se pudo obtener el estado de favorito.");
      }
    };

    fetchFavoriteStatus();
  }, [ courseId]);

  const handleToggleFavorite = async () => {
    try {
      const userId = await userApi.getUserId();
      if (!userId) {
        console.error("No se pudo obtener el ID del usuario");
        return;
      }
      const isEnrolled = await courseClient.isEnrolledInCourse(courseId, userId);
      if (!isEnrolled) {
        Alert.alert(
          "No inscrito",
          "Debes estar inscrito en el curso para agregarlo a tus favoritos."
        );
        return;
      }
      if (isFavorite) {
        await courseClient.removeFavorite(userId, courseId);
        setIsFavorite(false);
        Alert.alert("Favorito eliminado", "El curso ha sido eliminado de tus favoritos.");
      } else {
        await courseClient.addFavorite(userId, courseId);
        setIsFavorite(true);
        Alert.alert("Favorito agregado", "El curso ha sido agregado a tus favoritos.");
      }
    } catch (error) {
      // console.error("Error al actualizar favorito:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del curso.");
    }
  };

  if (isFavorite === null) return null;

  return (
    <IconButton
      icon={isFavorite ? "heart" : "heart-outline"}
      iconColor={isFavorite ? "red" : "gray"}
      size={24}
      onPress={handleToggleFavorite}
      style={styles.button}
    />
  );
};



const styles = StyleSheet.create({
  button: {
    marginTop: 20,
  },
});

export default ToggleFavoriteButton;
