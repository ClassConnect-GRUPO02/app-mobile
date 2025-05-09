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

interface Feedback {
  id: string;
  courseName: string;
  feedbackText: string;
  feedbackType: string;
  date: string;
}

export default function MyFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

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
        // Llamar al API para obtener los feedbacks
        const feedbackData = await courseClient.getFeedbacksByStudentId(
          studentId,
          token
        );
        setFeedbacks(feedbackData);

        // Filtrar los feedbacks por los filtros seleccionados
        filterFeedbacks(feedbackData);
      } catch (error) {
        console.error("Error al cargar feedbacks:", error);
        setError("No pudimos cargar tus feedbacks. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [page]); // Se actualiza cada vez que cambia la página

  useEffect(() => {
    // Filtrar los feedbacks cuando cambian los filtros
    if (feedbacks.length > 0) {
      filterFeedbacks(feedbacks);
    }
  }, [searchQuery, selectedCourse, selectedScore, feedbacks]);

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
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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

        {filteredFeedbacks.length === 0 ? (
          <Text style={styles.noFeedbackText}>
            No tienes feedbacks para mostrar.
          </Text>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} style={styles.feedbackCard}>
              <Card.Content>
                <Title style={styles.feedbackTitle}>
                  {feedback.courseName}
                </Title>
                <Text style={styles.feedbackDate}>{feedback.date}</Text>
                <Text style={styles.feedbackText}>{feedback.feedbackText}</Text>
              </Card.Content>
            </Card>
          ))
        )}

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
            style={styles.paginationButton}
          >
            Siguiente
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
  feedbackCard: {
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  feedbackDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 16,
    color: "#333",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  paginationButton: {
    width: "45%",
  },
  filterInput: {
    margin: 15,
  },
  noFeedbackText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    margin: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
