import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
  TextInput,
  Chip,
  IconButton,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { taskClient } from "@/api/taskClient";
import type { Task } from "@/types/Task";
import { StatusBar } from "expo-status-bar";
import { userApi } from "@/api/userApi";
import React from "react";
import { courseClient } from "@/api/coursesClient";

interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  submitted_at: string;
  status: "submitted" | "late";
  answers: string[];
  grade: number | null;
  feedback: string | null;
  file_url: string | null;
  time_spent: number | null;
  created_at: string;
  updated_at: string;
  student_name?: string; // Añadido para mostrar el nombre del estudiante
}

export default function TaskSubmissionsScreen() {
  const { courseId, taskId } = useLocalSearchParams<{
    courseId: string;
    taskId: string;
  }>();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAIFeedback] = useState<string | null>(null);
  const [loadingAIFeedback, setLoadingAIFeedback] = useState(false);

  useEffect(() => {
    const fetchTaskAndSubmissions = async () => {
      try {
        setLoading(true);

        // Obtener el ID del usuario actual
        const currentUserId = await userApi.getUserId();
        setUserId(currentUserId);

        if (!currentUserId) {
          throw new Error("No se pudo obtener el ID del usuario");
        }

        // Verificar si el usuario es instructor del curso
        const instructorStatus = await courseClient.isInstructorInCourse(
          courseId,
          currentUserId
        );
        setIsInstructor(instructorStatus);

        if (!instructorStatus) {
          throw new Error(
            "No tienes permisos para ver las entregas de esta tarea"
          );
        }

        // Obtener la tarea
        const taskData = await taskClient.getTaskById(courseId, taskId);
        if (!taskData) {
          throw new Error("No se pudo cargar la tarea");
        }
        setTask(taskData);

        // Obtener las entregas de la tarea
        const submissionsData = await taskClient.getTaskSubmissions(
          courseId,
          currentUserId,
          taskId
        );

        // Obtener nombres de estudiantes para cada entrega
        const submissionsWithNames = await Promise.all(
          submissionsData.map(async (submission: Submission) => {
            try {
              const studentInfo = await userApi.getUserById(
                submission.student_id
              );
              return {
                ...submission,
                student_name:
                  studentInfo?.user?.name || "Estudiante desconocido",
              };
            } catch (error) {
              console.error(
                "Error al obtener información del estudiante:",
                error
              );
              return {
                ...submission,
                student_name: "Estudiante desconocido",
              };
            }
          })
        );

        setSubmissions(submissionsWithNames);
      } catch (err) {
        console.error("Error al cargar las entregas:", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Error desconocido"
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId && taskId) {
      fetchTaskAndSubmissions();
    }
  }, [courseId, taskId]);

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade !== null ? submission.grade.toString() : "");
    setFeedback(submission.feedback || "");
  };

  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);

      // Validar que la calificación sea un número entre 0 y 10
      const numericGrade = Number.parseFloat(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 10) {
        Alert.alert("Error", "La calificación debe ser un número entre 0 y 10");
        return;
      }

      // Guardar la retroalimentación
      await taskClient.addFeedbackToTask(
        selectedSubmission.task_id,
        selectedSubmission.student_id,
        numericGrade,
        feedback
      );

      // Actualizar la lista de entregas
      const updatedSubmissions = submissions.map((sub) => {
        if (sub.id === selectedSubmission.id) {
          return {
            ...sub,
            grade: numericGrade,
            feedback: feedback,
          };
        }
        return sub;
      });

      setSubmissions(updatedSubmissions);
      setSelectedSubmission(null);
      Alert.alert("Éxito", "La retroalimentación se ha guardado correctamente");
    } catch (error) {
      console.error("Error al guardar la retroalimentación:", error);
      Alert.alert(
        "Error",
        "No se pudo guardar la retroalimentación. Inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFile = (fileUrl: string) => {
    if (fileUrl) {
      Linking.openURL(fileUrl).catch((err) => {
        console.error("Error al abrir el archivo:", err);
        Alert.alert("Error", "No se pudo abrir el archivo. Verifica la URL.");
      });
    }
  };

  const handleFetchAIFeedback = async () => {
    if (!selectedSubmission) return;

    try {
      setLoadingAIFeedback(true);
      const aiResponse = await taskClient.getAIFeedback(selectedSubmission.id);
      console.log("AI Response:", aiResponse);
      if (aiResponse) {
        setAIFeedback(aiResponse);
        setFeedback(
          (prev) =>
            `${prev.trim()}\n\n🧠 Retroalimentación generada por IA:\n${aiResponse}`
        );
      } else {
        Alert.alert(
          "Sin respuesta",
          "No se obtuvo una retroalimentación generada por IA."
        );
      }
    } catch (error) {
      console.error("Error al obtener feedback IA:", error);
      Alert.alert("Error", "No se pudo obtener el resumen por IA.");
    } finally {
      setLoadingAIFeedback(false);
    }
  };

  

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Cargando entregas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineMedium" style={styles.errorTitle}>
          Error
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={handleBack} style={styles.backButton}>
          Volver
        </Button>
      </View>
    );
  }

  if (!isInstructor) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineMedium" style={styles.errorTitle}>
          Acceso denegado
        </Text>
        <Text style={styles.errorText}>
          No tienes permisos para ver las entregas de esta tarea.
        </Text>
        <Button mode="contained" onPress={handleBack} style={styles.backButton}>
          Volver
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={handleBack} />
        <Text variant="headlineSmall" style={styles.title}>
          Entregas de la tarea
        </Text>
      </View>

      {task && (
        <View style={styles.taskInfo}>
          <Text variant="titleMedium">{task.title}</Text>
          <Chip
            style={[
              styles.typeChip,
              {
                backgroundColor: task.type === "tarea" ? "#e3f2fd" : "#fff3e0",
              },
            ]}
            textStyle={{ color: task.type === "tarea" ? "#1976d2" : "#e65100" }}
          >
            {task.type === "tarea" ? "Tarea" : "Examen"}
          </Chip>
          <Text style={styles.dueDate}>
            Fecha de entrega: {new Date(task.due_date).toLocaleDateString()}
          </Text>
        </View>
      )}

      <Divider style={styles.divider} />

      <View style={styles.content}>
        {submissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium">No hay entregas para esta tarea</Text>
            <Text style={styles.emptyText}>
              Aún no se han recibido entregas de los estudiantes.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.submissionsList}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Entregas recibidas ({submissions.length})
            </Text>

            {submissions.map((submission) => (
              <Card
                key={submission.id}
                style={[
                  styles.submissionCard,
                  selectedSubmission?.id === submission.id &&
                    styles.selectedCard,
                ]}
                onPress={() => handleSelectSubmission(submission)}
              >
                <Card.Content>
                  <View style={styles.submissionHeader}>
                    <Text variant="titleMedium">{submission.student_name}</Text>
                    <Chip
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            submission.status === "late"
                              ? "#ffebee"
                              : "#e8f5e9",
                        },
                      ]}
                      textStyle={{
                        color:
                          submission.status === "late" ? "#c62828" : "#2e7d32",
                      }}
                    >
                      {submission.status === "late"
                        ? "Entrega tardía"
                        : "Entregado a tiempo"}
                    </Chip>
                  </View>

                  <Text style={styles.submissionDate}>
                    Entregado el:{" "}
                    {new Date(submission.submitted_at).toLocaleDateString()}{" "}
                    {new Date(submission.submitted_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>

                  {submission.file_url && (
                    <Button
                      mode="outlined"
                      icon="file-document"
                      onPress={() => handleOpenFile(submission.file_url!)}
                      style={styles.fileButton}
                    >
                      Ver archivo adjunto
                    </Button>
                  )}

                  <View style={styles.gradeContainer}>
                    <Text style={styles.gradeLabel}>Calificación:</Text>
                    <Text
                      style={[
                        styles.gradeValue,
                        submission.grade !== null && {
                          color: submission.grade >= 6 ? "#2e7d32" : "#c62828",
                        },
                      ]}
                    >
                      {submission.grade !== null
                        ? submission.grade.toFixed(1)
                        : "Sin calificar"}
                    </Text>
                  </View>

                  {submission.feedback && (
                    <View style={styles.feedbackContainer}>
                      <Text style={styles.feedbackLabel}>
                        Retroalimentación:
                      </Text>
                      <Text style={styles.feedbackText}>
                        {submission.feedback}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}

        {selectedSubmission && (
          <View style={styles.feedbackForm}>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Calificar entrega de {selectedSubmission.student_name}
            </Text>

            <TextInput
              mode="outlined"
              label="Calificación (0-10)"
              value={grade}
              onChangeText={setGrade}
              keyboardType="numeric"
              style={styles.gradeInput}
            />

            <TextInput
              mode="outlined"
              label="Retroalimentación"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              style={styles.feedbackInput}
            />

            <Text
              onPress={handleFetchAIFeedback}
              style={[
                styles.aiFeedbackLink,
                loadingAIFeedback && { opacity: 0.5 },
              ]}
            >
              {loadingAIFeedback
                ? "CARGANDO RESUMEN CON IA..."
                : "OBTENER RESUMEN CON IA"}
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSaveFeedback}
                loading={submitting}
                disabled={submitting}
                style={styles.saveButton}
              >
                Guardar calificación
              </Button>
              <Button
                mode="outlined"
                onPress={() => setSelectedSubmission(null)}
                disabled={submitting}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
            </View>
            
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  aiFeedbackLink: {
    color: "#6200ee",
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorTitle: {
    color: "#d32f2f",
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  backButton: {
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontWeight: "bold",
  },
  taskInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  typeChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 8,
  },
  dueDate: {
    color: "#666",
  },
  divider: {
    marginVertical: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 8,
    color: "#666",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    color: "#6200ee",
  },
  submissionsList: {
    flex: 1,
  },
  submissionCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  selectedCard: {
    borderColor: "#6200ee",
    borderWidth: 2,
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  submissionDate: {
    color: "#666",
    marginBottom: 12,
  },
  fileButton: {
    marginVertical: 8,
    alignSelf: "flex-start",
  },
  gradeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  gradeLabel: {
    fontWeight: "bold",
    marginRight: 8,
  },
  gradeValue: {
    fontWeight: "bold",
  },
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackLabel: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  feedbackText: {
    color: "#666",
  },
  feedbackForm: {
    marginTop: 16,
    paddingBottom: 24,
  },
  gradeInput: {
    marginBottom: 16,
  },
  feedbackInput: {
    marginBottom: 16,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});
