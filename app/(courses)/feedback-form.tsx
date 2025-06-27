import React, { useState } from "react";
import {
  TextInput,
  Button,
  Modal,
  Portal,
  PaperProvider,
  Text,
} from "react-native-paper";
import { courseClient } from "@/api/coursesClient";
import { userApi } from "@/api/userApi";
import { Alert, View, StyleSheet } from "react-native";

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
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmitFeedback = async () => {
    const score = parseInt(punctuation, 10);

    if (!comment || !score || score < 1 || score > 5) {
      setErrorMessage("Comentario y puntuación válida (1-5) son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const instructor_id = await userApi.getUserId();
      if (!instructor_id) {
        Alert.alert("Error", "No se pudo obtener el ID del docente");
        return;
      }

      await courseClient.addFeedbackToStudent(
        courseId,
        studentId,
        instructor_id,
        comment,
        score
      );

      setErrorMessage("");
      await userApi.notifyUser(
        studentId,
        "Nuevo feedback",
        `Has recibido un nuevo feedback en el curso ${courseId}.`,
        "studentFeedback"
      );
      setTimeout(() => {
        setModalVisible(true);
        onFeedbackSubmitted();
      }, 500);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setErrorMessage("Ya existe feedback para este estudiante.");
      } else if (err.response) {
        const detail = err.response.data?.detail;
        setErrorMessage(detail || "Error inesperado en la respuesta del servidor.");
      } else {
        setErrorMessage("Ocurrió un error al comunicarse con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.formContainer}>
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

        {/* Mostrar error en el mismo form */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmitFeedback}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Enviar Feedback
        </Button>

        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalContainer}>
              <Button mode="contained" onPress={() => setModalVisible(false)}>
                Cerrar
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
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
    position: "relative",
    flexGrow: 1,
  },
  input: { marginBottom: 12 },
  button: { marginTop: 16 },
  modalContent: {
    padding: 20,
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 8,
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 8,
  },
});

export default FeedbackForm;
