import { useState, useEffect } from "react";
import { TextInput, Button, Text, Snackbar } from "react-native-paper";
import { courseClient } from "@/api/coursesClient";
import { userApi } from "@/api/userApi";
import { Alert, View, StyleSheet } from "react-native";
import React from "react";

const FeedbackForm = ({
  studentId,
  courseId,
  onFeedbackSubmitted,
}: {
  studentId: string;
  courseId: string;
  onFeedbackSubmitted: () => void;
}) => {
  const [comment, setComment] = useState("");
  const [punctuation, setPunctuation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmitFeedback = async () => {
    const score = parseInt(punctuation, 10);

    if (!comment || !score || score < 1 || score > 5) {
      setErrorMessage("Comentario y puntuación válida (1-5) son obligatorios.");
      return;
    }

    try {
  setLoading(true);
  const instructorId = await userApi.getUserId();
  if (!instructorId) {
    Alert.alert("Error", "No se pudo obtener el ID del docente");
    return;
  }

  await courseClient.addFeedbackToStudent(
    courseId,
    studentId,
    instructorId,
    comment,
    score
  );

  setSuccessMessage("Feedback enviado exitosamente.");
  onFeedbackSubmitted(); // Callback para actualizar la UI
} catch (err: any) {
  console.log("Error completo:", err);

  if (err.response) {
    console.log("Status:", err.response.status);
    console.log("Data:", err.response.data);

    const detail = err.response.data?.detail;

    if (err.response.status === 400 && detail?.includes("Feedback already exists")) {
      setErrorMessage("Ya has enviado un feedback para este curso.");
    } else if (detail) {
      setErrorMessage(detail);
    } else {
      setErrorMessage("Error inesperado en la respuesta del servidor.");
    }
  } else {
    console.log("No hay response en el error.");
    setErrorMessage("Ocurrió un error al comunicarse con el servidor.");
  }
}

 finally {
  setLoading(false);
}

  };

  return (
    <View style={styles.formContainer}>
      {errorMessage ? (
        <Snackbar
          visible={true}
          onDismiss={() => setErrorMessage("")}
          style={styles.snackbar}
        >
          {errorMessage}
        </Snackbar>
      ) : null}

      {successMessage ? (
        <Snackbar
          visible={true}
          onDismiss={() => setSuccessMessage("")}
          style={styles.snackbar}
        >
          {successMessage}
        </Snackbar>
      ) : null}

      <TextInput
        label="Comentario"
        value={comment}
        onChangeText={setComment}
        style={styles.input}
        multiline
        numberOfLines={4}
      />
      <TextInput
        label="Puntuación (1-5)"
        value={punctuation}
        onChangeText={(text) => setPunctuation(text.replace(/[^0-9]/g, ""))}
        style={styles.input}
        keyboardType="numeric"
      />

      <Button
        mode="contained"
        onPress={handleSubmitFeedback}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Enviar Feedback
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: "relative", // Hacer que el contenedor tenga posición relativa
    minHeight: "100%", // Asegurarnos que ocupe toda la pantalla
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  snackbar: {
    position: "absolute", // Fijar el Snackbar al fondo
    bottom: 0, // Alinearlo en la parte inferior
    width: "100%", // Asegurarnos de que ocupe todo el ancho
  },
});

export default FeedbackForm;
