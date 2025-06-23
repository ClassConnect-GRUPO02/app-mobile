import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Title,
  Button,
  Card,
  ActivityIndicator,
  useTheme,
  TextInput,
} from "react-native-paper";
import { getItemAsync } from "expo-secure-store";
import { courseClient } from "../../api/coursesClient"; // Asegúrate de importar el cliente correcto
import { FeedbacksFilter } from "../../components/students/FeedbacksFilter";
import { AppColors } from "@/constants/Colors";

interface Feedback {
  id: string;
  courseName: string;
  feedbackText: string;
  feedbackType: string;
  punctuation: number;
}

export default function MyFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [displayedFeedbacks, setDisplayedFeedbacks] = useState<Feedback[]>([]); // Nueva: feedbacks de la página actual
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  const ITEMS_PER_PAGE = 5; // Ajusta según necesites
  const theme = useTheme();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      const token = await getItemAsync("userToken");
      const studentId = await getItemAsync("userId");

      if (!token || !studentId) {
        setError("No se pudo recuperar la sesión.");
        setLoading(false);
        return;
      }

      try {
        const feedbackData = await courseClient.getFeedbacksByStudentId(
          studentId
        );
        const rawFeedbacks = feedbackData?.data?.data ?? [];

        console.log("Feedbacks obtenidos:", rawFeedbacks);

        // Obtener los nombres de cursos en paralelo
        const transformed = await Promise.all(
          rawFeedbacks.map(async (f: any) => {
            let courseName = f.course_id; // Fallback por si falla la petición
            try {
              const courseRes = await courseClient.getCourseById(f.course_id);
              console.log("Curso obtenido:", courseRes);
              courseName = courseRes?.name ?? f.course_id;
            } catch (err) {
              console.warn(
                "No se pudo obtener el nombre del curso:",
                f.course_id
              );
            }

            return {
              id: f.id,
              courseName,
              feedbackText: f.comment,
              feedbackType: String(f.punctuation),
              punctuation: f.punctuation,
            };
          })
        );

        setFeedbacks(transformed);
        filterFeedbacks(transformed);
      } catch (error) {
        console.error("Error al cargar feedbacks:", error);
        setError("No pudimos cargar tus feedbacks. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []); // Solo se ejecuta una vez al montar el componente

  useEffect(() => {
    // Filtrar los feedbacks cuando cambian los filtros
    if (feedbacks.length > 0) {
      filterFeedbacks(feedbacks);
    }
  }, [searchQuery, selectedCourse, selectedScore, feedbacks]);

  useEffect(() => {
    // Actualizar feedbacks mostrados cuando cambia la página o los filtros
    updateDisplayedFeedbacks();
  }, [filteredFeedbacks, page]);

  const filterFeedbacks = (feedbackData: Feedback[]) => {
    let filtered = [...feedbackData];

    if (selectedCourse) {
      filtered = filtered.filter((feedback) =>
        feedback.courseName.toLowerCase().includes(selectedCourse.toLowerCase())
      );
    }

    if (selectedScore) {
      filtered = filtered.filter(
        (feedback) => parseInt(feedback.feedbackType) === selectedScore
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((feedback) =>
        feedback.feedbackText.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFeedbacks(filtered);
    setPage(1); // Resetear a página 1 cuando se filtran
  };

  const updateDisplayedFeedbacks = () => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);
    setDisplayedFeedbacks(paginatedFeedbacks);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleSummarize = async () => {
    try {
      const studentId = await getItemAsync("userId");
      if (!studentId) {
        throw new Error("Student ID is null or undefined.");
      }
      const res = await courseClient.getFeedbackSummaryByStudentId(studentId); // <-- Ajusta esto a tu API real
      console.log("Resumen generado:", res);
      setSummary(res);
    } catch (err) {
      console.error("Error generando resumen:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const totalPages = getTotalPages();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Mis Feedbacks</Title>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FeedbacksFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCourse={selectedCourse}
          onCourseChange={setSelectedCourse}
          selectedScore={selectedScore}
          onScoreChange={setSelectedScore}
          enrolledCourses={[...new Set(feedbacks.map((f) => f.courseName))]} // Extrae los nombres únicos
          onRefresh={() => {
            setPage(1);
            setSearchQuery("");
            setSelectedCourse(null);
            setSelectedScore(null);
            setFilteredFeedbacks(feedbacks);
          }}
          refreshing={loading}
        />

        {/* Mostrar info de paginación */}
        {filteredFeedbacks.length > 0 && (
          <Text style={styles.paginationInfo}>
            Página {page} de {totalPages} • {filteredFeedbacks.length} feedbacks total
          </Text>
        )}

        {displayedFeedbacks.length === 0 ? (
          <Text style={styles.noFeedbackText}>
            No tienes feedbacks para mostrar.
          </Text>
        ) : (
          displayedFeedbacks.map((feedback) => (
            <Card key={feedback.id} style={styles.feedbackCard}>
              <Card.Content>
                <Title style={styles.feedbackTitle}>
                  {feedback.courseName}
                </Title>
                <Text style={styles.feedbackDate}>{feedback.punctuation}</Text>
                <Text style={styles.feedbackText}>{feedback.feedbackText}</Text>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Solo mostrar paginación si hay más de una página */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <Button
              mode="outlined"
              onPress={handlePrevPage}
              disabled={page === 1}
              style={styles.paginationButton}
            >
              Anterior
            </Button>
            <Button
              mode="outlined"
              onPress={handleNextPage}
              disabled={page >= totalPages}
              style={styles.paginationButton}
            >
              Siguiente
            </Button>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Button
            mode="contained"
            onPress={handleSummarize}
            style={styles.summaryButton}
          >
            Generar resumen por IA
          </Button>

          {summary && (
            <View style={{ marginTop: 10 }}>
              <Button
                onPress={() => setShowSummary(!showSummary)}
                icon={showSummary ? "chevron-down" : "chevron-up"}
                mode="text"
              >
                {showSummary ? "Ocultar resumen" : "Mostrar resumen"}
              </Button>
              {showSummary && (
                <>
                  <Text variant="titleMedium">Resumen generado:</Text>
                  <Text>{summary}</Text>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: AppColors.surface,
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
  },
  feedbackCard: {
    margin: 15,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
  },
  feedbackDate: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 16,
    color: AppColors.text,
    lineHeight: 22,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  paginationButton: {
    width: "45%",
    borderColor: AppColors.primary,
  },
  paginationInfo: {
    textAlign: "center",
    fontSize: 14,
    color: AppColors.textSecondary,
    marginHorizontal: 15,
    marginBottom: 10,
    fontWeight: '500',
  },
  filterInput: {
    margin: 15,
    backgroundColor: AppColors.background,
  },
  noFeedbackText: {
    textAlign: "center",
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 20,
    fontStyle: 'italic',
  },
  errorText: {
    color: AppColors.error,
    textAlign: "center",
    margin: 20,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  summaryContainer: {
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 20,
    flex: 1,
    justifyContent: "flex-end",
  },
  summaryButton: {
    width: "100%",
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
  },
});