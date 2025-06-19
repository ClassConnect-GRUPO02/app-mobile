import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Text, ActivityIndicator, List, Button } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { LineChart, BarChart } from "react-native-chart-kit";
import { courseClient } from "@/api/coursesClient";
import { userApi } from "@/api/userApi";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(126, 87, 194, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#7E57C2" },
};

export default function StudentStatsScreen() {
  const { courseId, studentId } = useLocalSearchParams<{
    courseId: string;
    studentId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userName, setUserName] = useState<string>("Estudiante");

  useEffect(() => {
    if (!courseId || !studentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await courseClient.getStudentStats(courseId, studentId);
        setStats(res.data);

        const user = await userApi.getUserById(studentId);
        setUserName(user.user.name);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [courseId, studentId]);

async function handleDownloadPdf() {
  if (!stats) return;

  // Convertimos las fechas y formateamos números
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();

  const submissionsRows = stats.submissions
    .map(
      (sub: any) => `
    <tr>
      <td>${sub.type === "examen" ? "Examen" : "Tarea"}</td>
      <td>${sub.taskTitle}</td>
      <td>${sub.grade.toFixed(2)}</td>
      <td>${sub.status}</td>
      <td>${formatDate(sub.submitted_at)}</td>
    </tr>
  `
    )
    .join("");

  const today = new Date().toLocaleDateString();

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
          h1 { color: #7E57C2; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #aaa; padding: 8px; text-align: left; }
          th { background-color: #7E57C2; color: white; }
          .summary { margin-top: 16px; }
          .footer { margin-top: 48px; font-size: 0.8em; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Informe de Estadísticas</h1>
        <p><strong>Estudiante:</strong> ${userName}</p>
        <p><strong>Fecha:</strong> ${today}</p>

        <div class="summary">
          <h2>Resumen</h2>
          <p><strong>Promedio de tareas:</strong> ${stats.averageTaskGrade.toFixed(2)}</p>
          <p><strong>Promedio de exámenes:</strong> ${stats.averageExamGrade.toFixed(2)}</p>
          <p><strong>Promedio general:</strong> ${(
            (stats.averageTaskGrade + stats.averageExamGrade) / 2
          ).toFixed(2)}</p>
          <p><strong>Tasa de entrega de tareas:</strong> ${(
            stats.taskSubmissionRate * 100
          ).toFixed(0)}%</p>
          <p><strong>Tasa de entrega de exámenes:</strong> ${(
            stats.examSubmissionRate * 100
          ).toFixed(0)}%</p>
        </div>

        <h2>Detalle de Envíos</h2>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Título</th>
              <th>Nota</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${submissionsRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generado por la app educativa - ${today}</p>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Sin datos disponibles."}</Text>
      </View>
    );
  }

  const gradeChartData = {
    labels: ["Tareas", "Exámenes"],
    datasets: [{ data: [stats.averageTaskGrade, stats.averageExamGrade] }],
  };

  const submissionChartData = {
    labels: ["Tareas", "Exámenes"],
    datasets: [{ data: [stats.taskSubmissionRate, stats.examSubmissionRate] }],
  };

  const timelineData = {
    labels: stats.submissions.map((sub: any) =>
      new Date(sub.submitted_at).toLocaleDateString()
    ),
    datasets: [
      {
        data: stats.submissions.map((sub: any) => sub.grade),
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Estadísticas de {userName}</Text>

      <Text style={styles.chartTitle}>Promedio de calificaciones</Text>
      <BarChart
        data={gradeChartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        fromZero
        yAxisLabel=""
        yAxisSuffix="/10"
        style={styles.chart}
      />

      <BarChart
        data={submissionChartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        fromZero
        yAxisLabel=""
        yAxisSuffix="%"
        style={styles.chart}
      />

      <Text style={styles.chartTitle}>Evolución de calificaciones</Text>
      <LineChart
        data={timelineData}
        width={screenWidth - 32}
        height={256}
        chartConfig={chartConfig}
        bezier
        fromZero
        style={styles.chart}
      />

      <Text style={styles.subheading}>Detalle de envíos</Text>
      <View style={styles.card}>
        {stats.submissions.map((sub: any) => (
          <List.Item
            key={sub.taskId}
            title={`${sub.type === "examen" ? "Examen" : "Tarea"}: ${sub.taskTitle}`}
            description={`Nota: ${sub.grade} — Estado: ${sub.status} — Fecha: ${new Date(
              sub.submitted_at
            ).toLocaleDateString()}`}
            left={(props) => (
              <List.Icon
                {...props}
                icon={sub.type === "examen" ? "file-document-box-outline" : "file-outline"}
              />
            )}
          />
        ))}
      </View>

      <Button
        icon="download"
        mode="contained"
        onPress={handleDownloadPdf}
        style={styles.downloadButton}
        contentStyle={{ flexDirection: "row-reverse" }} // ícono a la derecha (opcional)
      >
        Descargar informe PDF
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    paddingBottom: 40, // para que no quede muy pegado al borde
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  chartTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    fontWeight: "500",
    color: "#444",
  },
  subheading: {
    fontSize: 18,
    fontWeight: "500",
    marginVertical: 16,
    color: "#555",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 24,
    elevation: 2,
  },
  downloadButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  errorText: {
    color: "#B00020",
    fontSize: 16,
    textAlign: "center",
  },
});
