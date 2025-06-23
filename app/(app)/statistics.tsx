import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  useTheme,
  Chip,
  Divider,
  Menu,
  Provider,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { getItemAsync } from "expo-secure-store";
import { courseClient } from "@/api/coursesClient";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { statisticsClient } from "@/api/statisticsClient";
import * as Sharing from "expo-sharing";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import { AppColors } from "@/constants/Colors";

const screenWidth = Dimensions.get("window").width;

interface GlobalStats {
  instructorId: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionsRate: number;
  examSubmissionsRate: number;
  trends: TrendData[];
}

interface TrendData {
  date: string;
  averageTaskGrade: number;
  averageExamGrade: number;
  taskSubmissionRate: number;
  examSubmissionRate: number;
}

interface Course {
  id: string;
  name: string;
}
export default function StudentPerformanceStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last_month");
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [courseMenuVisible, setCourseMenuVisible] = useState(false);

  const theme = useTheme();

  const periodOptions = [
    { label: "Último mes", value: "last_month" },
    { label: "Últimos 3 meses", value: "last_3_months" },
    { label: "Último semestre", value: "last_semester" },
    { label: "Todo el tiempo", value: "all_time" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Solo llamar fetchStats cuando cambien curso o periodo
  useEffect(() => {
    if (courses.length > 0) {
      fetchStats();

      const intervalId = setInterval(() => {
        fetchStats();
      }, 30000); // 30000 ms = 30 segundos

      return () => clearInterval(intervalId); // limpiar intervalo al desmontar
    }
  }, [selectedCourse, selectedPeriod, courses]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userId = await getItemAsync("userId");
      if (!userId) {
        setError("No se pudo identificar al usuario");
        return;
      }

      // Obtener cursos del docente
      const allCourses = await courseClient.getAllCourses();
      const instructorCourses = allCourses.filter(
        (course: { creatorId: string }) => course.creatorId === userId
      );
      setCourses(instructorCourses);

      // Inicialmente cargar stats globales
      await fetchGlobalStats(userId);
      setError(null);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("No se pudieron cargar las estadísticas. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStats = async (instructorId: string) => {
    try {
      const data = await statisticsClient.getInstructorStats(instructorId);
      if (data) {
        setStats({
          instructorId: data.instructorId ?? "",
          averageTaskGrade: data.averageTaskGrade ?? 0,
          averageExamGrade: data.averageExamGrade ?? 0,
          taskSubmissionsRate: data.taskSubmissionsRate ?? 0,
          examSubmissionsRate: data.examSubmissionsRate ?? 0,
          trends: data.trends ?? [],
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Error al obtener estadísticas globales:", err);
      setError("No se pudieron cargar las estadísticas globales.");
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const userId = await getItemAsync("userId");
      if (!userId) {
        setError("No se pudo identificar al usuario");
        setLoading(false);
        return;
      }

      if (selectedCourse) {
        const { fromDate, toDate } = getPeriodDates(selectedPeriod);
        // Llamada real a estadísticas de curso
        const data = await statisticsClient.getCourseStats(
          selectedCourse.id,
          fromDate || undefined,
          toDate || undefined
        );
        if (data) {
          setStats({
            instructorId: data.instructorId ?? "",
            averageTaskGrade: data.averageTaskGrade ?? 0,
            averageExamGrade: data.averageExamGrade ?? 0,
            taskSubmissionsRate: data.taskSubmissionsRate ?? 0,
            examSubmissionsRate: data.examSubmissionsRate ?? 0,
            trends: data.trends ?? [],
          });
          setError(null);
        } else {
          setStats(null);
        }
      } else {
        // Estadísticas globales
        await fetchGlobalStats(userId);
      }
    } catch (err) {
      console.error("Error al obtener estadísticas:", err);
      setError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = (period: string) => {
    const now = new Date();
    let fromDate = "";
    let toDate = now.toISOString().split("T")[0];

    switch (period) {
      case "last_month":
        fromDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      case "last_3_months":
        fromDate = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      case "last_semester":
        fromDate = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      case "all_time":
        fromDate = "";
        toDate = "";
        break;
    }

    return { fromDate, toDate };
  };

  const exportReportAsPDF = async () => {
    if (!stats) return;

    const htmlContent = `
    <h1>Informe de Desempeño</h1>
    <p><strong>Curso:</strong> ${
      selectedCourse ? selectedCourse.name : "Todos los cursos"
    }</p>
    <p><strong>Periodo:</strong> ${
      periodOptions.find((p) => p.value === selectedPeriod)?.label
    }</p>

    <h2>Estadísticas generales</h2>
    <ul>
      <li>Promedio de Tareas: ${stats.averageTaskGrade.toFixed(1)} pts</li>
      <li>Promedio de Exámenes: ${stats.averageExamGrade.toFixed(1)} pts</li>
      <li>Tasa de Entrega de Tareas: ${stats.taskSubmissionsRate.toFixed(
        1
      )}%</li>
      <li>Tasa de Entrega de Exámenes: ${stats.examSubmissionsRate.toFixed(
        1
      )}%</li>
    </ul>
  `;

    try {
      const file = await printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      await shareAsync(file.uri);
    } catch (error) {
      console.error("Error al generar o compartir el PDF:", error);
    }
  };

  const renderStatsCard = (
    title: string,
    value: number,
    suffix: string,
    icon: string,
    color: string
  ) => (
    <Card
      style={[styles.statsCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
    >
      <Card.Content style={styles.statsCardContent}>
        <View style={styles.statsHeader}>
          <Ionicons name="stats-chart-outline" size={24} color={color} />
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
        <Text style={[styles.statsValue, { color }]}>
          {value.toFixed(1)}
          {suffix}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderTrendChart = () => {
    if (!stats?.trends || stats.trends.length === 0) return null;

    const chartData = {
      labels: stats.trends.map((trend) => {
        const date = new Date(trend.date);
        return date.toLocaleDateString("es-ES", { month: "short" });
      }),
      datasets: [
        {
          data: stats.trends.map((trend) => trend.averageTaskGrade),
          color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: stats.trends.map((trend) => trend.averageExamGrade),
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Tareas", "Exámenes"],
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Tendencia de Calificaciones</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: AppColors.surface,
              backgroundGradientFrom: AppColors.surface,
              backgroundGradientTo: AppColors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderSubmissionChart = () => {
    if (!stats) return null;

    const chartData = {
      labels: ["Tareas", "Exámenes"],
      datasets: [
        {
          data: [stats.taskSubmissionsRate, stats.examSubmissionsRate],
        },
      ],
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Tasa de Entrega</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: AppColors.surface,
              backgroundGradientFrom: AppColors.surface,
              backgroundGradientTo: AppColors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />

        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Estadísticas de Desempeño
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            {selectedCourse
              ? `Curso: ${selectedCourse.name}`
              : "Vista general de todos tus cursos"}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Menu
            visible={courseMenuVisible}
            onDismiss={() => setCourseMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCourseMenuVisible(true)}
                icon="book"
                style={styles.filterButton}
              >
                {selectedCourse ? selectedCourse.name : "Todos los cursos"}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSelectedCourse(null);
                setCourseMenuVisible(false);
              }}
              title="Todos los cursos"
            />
            {courses.map((course) => (
              <Menu.Item
                key={course.id}
                onPress={() => {
                  setSelectedCourse(course);
                  setCourseMenuVisible(false);
                }}
                title={course.name}
              />
            ))}
          </Menu>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                icon="calendar"
                style={styles.filterButton}
              >
                {periodOptions.find((p) => p.value === selectedPeriod)?.label}
              </Button>
            }
          >
            {periodOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setSelectedPeriod(option.value);
                  setMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {stats && (
            <>
              {/* Estadísticas principales */}
              <View style={styles.statsGrid}>
                {renderStatsCard(
                  "Promedio Tareas",
                  stats.averageTaskGrade,
                  " pts",
                  "clipboard-text",
                  AppColors.primary
                )}
                {renderStatsCard(
                  "Promedio Exámenes",
                  stats.averageExamGrade,
                  " pts",
                  "school",
                  "#ff6384"
                )}
                {renderStatsCard(
                  "Entrega Tareas",
                  stats.taskSubmissionsRate,
                  "%",
                  "check-circle",
                  "#36a2eb"
                )}
                {renderStatsCard(
                  "Entrega Exámenes",
                  stats.examSubmissionsRate,
                  "%",
                  "trophy",
                  "#4bc0c0"
                )}
              </View>

              <Divider style={styles.divider} />

              {/* Gráficos */}
              {renderTrendChart()}
              {renderSubmissionChart()}

              {/* Acciones rápidas */}
              <Card style={styles.actionsCard}>
                <Card.Content>
                  <View style={styles.actionsContainer}>
                    <Button
                      mode="outlined"
                      icon="download"
                      onPress={exportReportAsPDF}
                      style={styles.actionButton}
                    >
                      Exportar informe
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  header: {
    marginBottom: 16,
    marginTop: 50,
  },
  title: {
    fontWeight: "bold",
    color: AppColors.primary,
  },
  subtitle: {
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: `${AppColors.error}15`,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${AppColors.error}30`,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 40,
    paddingHorizontal: 4,
    zIndex: 100,
    elevation: 8,
  },
  filterButton: {
    flex: 1,
    borderColor: AppColors.primary,
    minHeight: 40,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  statsCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: AppColors.surface,
    elevation: 2,
    zIndex: 1,
    borderRadius: 12,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  statsCardContent: {
    padding: 12,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
    color: AppColors.textSecondary,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: AppColors.divider,
  },
  chartCard: {
    backgroundColor: AppColors.surface,
    elevation: 2,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: AppColors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionsCard: {
    backgroundColor: AppColors.surface,
    elevation: 2,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: AppColors.text,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
