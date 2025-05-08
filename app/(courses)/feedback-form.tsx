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
  const [punctuation, setPunctuation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmitFeedback = async () => {
    if (!comment || punctuation === 0) {
      setErrorMessage("Comentario y puntuación son obligatorios.");
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
        punctuation
      );
      setSuccessMessage("Feedback enviado exitosamente.");
      onFeedbackSubmitted(); // Callback para actualizar la UI
    } catch (error) {
      setErrorMessage("Ocurrió un error al enviar el feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {errorMessage ? (
        <Snackbar visible={true} onDismiss={() => setErrorMessage("")}>
          {errorMessage}
        </Snackbar>
      ) : null}

      {successMessage ? (
        <Snackbar visible={true} onDismiss={() => setSuccessMessage("")}>
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
        value={punctuation.toString()}
        onChangeText={(text) => setPunctuation(parseInt(text))}
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
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
});

export default FeedbackForm;
