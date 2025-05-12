import { View, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  Card,
  Title,
} from "react-native-paper";
import { courseClient } from "@/api/coursesClient"; // API actualizada
import React from "react";
import { useTheme } from "react-native-paper";

export default function CourseFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [courseFeedbacks, setCourseFeedbacks] = useState<any[]>([]); // Cambié el nombre a `courseFeedbacks` para ser consistente
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  const theme = useTheme();

  useEffect(() => {
    if (id) {
      loadCourseFeedbacks();
    }
  }, [id, filter, page]);

  // Cargar courseFeedbacks con filtros y paginación
  const loadCourseFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await courseClient.getFeedbacksByCourseId(id); // API ajustada
      const filteredFeedbacks = res.filter((item: any) => {
        if (filter === "positivo") {
          return item.punctuation >= 4;
        } else if (filter === "negativo") {
          return item.punctuation <= 2;
        }
        return true;
      });
      setCourseFeedbacks(filteredFeedbacks);
    } catch (err) {
      console.error("Error al cargar courseFeedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generar el resumen con la API de resumen de courseFeedbacks
  const handleSummarize = async () => {
    try {
      const res = await courseClient.getCourseFeedbackSummary(id); // API ajustada
      console.log("Resumen generado:", res);
      setSummary(res);
    } catch (err) {
      console.error("Error generando resumen:", err);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Title style={styles.title}>Feedbacks</Title>

          {/* Filtros */}
          <View style={styles.filterContainer}>
            <Chip onPress={() => setFilter(null)} selected={!filter}>
              Todos
            </Chip>
            <Chip
              onPress={() => setFilter("positivo")}
              selected={filter === "positivo"}
            >
              Positivos
            </Chip>
            <Chip
              onPress={() => setFilter("negativo")}
              selected={filter === "negativo"}
            >
              Negativos
            </Chip>
          </View>

          <FlatList
            data={courseFeedbacks}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => (
              <Card style={styles.feedbackCard}>
                <Card.Content>
                  <Text style={styles.comment}>{item.comment}</Text>
                  <Text style={styles.rating}>
                    Puntuación: {item.punctuation}/5
                  </Text>
                </Card.Content>
              </Card>
            )}
          />

          {/* Paginación simple */}
          <View style={styles.paginationContainer}>
            <Button disabled={page <= 1} onPress={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button onPress={() => setPage(page + 1)}>Siguiente</Button>
          </View>

          {/* Botón para generar resumen */}
          <Button
            mode="contained"
            style={styles.summarizeButton}
            onPress={handleSummarize}
          >
            Generar resumen por IA
          </Button>

          {/* Resumen generado */}
          {summary && (
            <View style={styles.summaryContainer}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  feedbackCard: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  comment: {
    fontSize: 16,
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: "#666",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  summarizeButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  summaryContainer: {
    marginTop: 16,
  },
});
