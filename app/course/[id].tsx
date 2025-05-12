import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import {
  Text,
  Button,
  Chip,
  Divider,
  List,
  ActivityIndicator,
  FAB,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { courseClient } from "@/api/coursesClient";
import { useState, useEffect } from "react";
import type { Course } from "@/types/Course";
import React from "react";
import { userApi } from "@/api/userApi";
import FeedbackForm from "../(courses)/feedback-form";
import { Platform, SafeAreaView, StatusBar } from "react-native";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [instructorName, setInstructorName] = useState("No especificado");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Estado para controlar el modal
  const [activeTab, setActiveTab] = useState<"info" | "students">("info");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userId = await userApi.getUserId();
        if (!userId) throw new Error("No se pudo obtener el ID del usuario");

        const userInfo = await userApi.getUserById(userId);
        setUserType(userInfo?.user?.userType);

        const courseData = await courseClient.getCourseById(id);
        if (!courseData) throw new Error("No se pudo cargar el curso");
        setCourse(courseData);

        if (courseData.creatorId) {
          try {
            const creatorInfo = await userApi.getUserById(courseData.creatorId);
            if (creatorInfo?.user?.name) {
              setInstructorName(creatorInfo.user.name);
            }
          } catch (error) {
            console.error("Error al obtener información del creador:", error);
          }
        }

        setIsCreator(courseData.creatorId === userId);

        const instructorStatus = await courseClient.isInstructorInCourse(
          id,
          userId
        );
        setIsInstructor(instructorStatus.isInstructor);

        const enrollmentStatus = await courseClient.isEnrolledInCourse(
          id,
          userId
        );
        setIsEnrolled(enrollmentStatus);

        if (instructorStatus.isInstructor) {
          const studentList = await courseClient.getStudentsInCourse(id);
          setStudents(studentList);
        }
      } catch (err) {
        console.error("Error al cargar el curso:", err);
        setError("No se pudo cargar la información del curso");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Eliminar curso",
      "¿Estás seguro de que deseas eliminar este curso?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await courseClient.deleteCourse(id);
              Alert.alert("Éxito", "Curso eliminado", [
                { text: "OK", onPress: () => router.replace("/(courses)") },
              ]);
            } catch (error) {
              console.error("Error al eliminar el curso:", error);
              Alert.alert("Error", "No se pudo eliminar el curso.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleFeedbackSubmitted = () => setSelectedStudent(null);

  const handleEdit = () =>
    router.push({ pathname: "/(courses)/edit", params: { id } });

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const userId = await userApi.getUserId();
      if (!userId) {
        Alert.alert("Error", "Debes iniciar sesión para inscribirte");
        return;
      }
      await courseClient.enrollStudentInCourse(id, userId);
      setIsEnrolled(true);
      if (course) {
        setCourse({ ...course, enrolled: course.enrolled + 1 });
      }
      Alert.alert("Éxito", "Inscripción exitosa");
    } catch (error) {
      console.error("Error al inscribirse:", error);
      Alert.alert("Error", "No se pudo completar la inscripción.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Cargando curso...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.notFoundContainer}>
        <Text variant="headlineMedium">Curso no encontrado</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Volver
        </Button>
      </View>
    );
  }

  const availableSpots = course.capacity - course.enrolled;
  const isFullyBooked = availableSpots === 0;
  const isStudent = userType === "alumno";

  const renderInfoTab = () => (
    <ScrollView>
      <StatusBar />
      <Image
        source={{
          uri:
            course.imageUrl ||
            "https://www.svgrepo.com/show/441689/page-not-found.svg",
        }}
        style={styles.courseImage}
      />
      <View style={styles.contentContainer}>
        <Text variant="headlineSmall" style={styles.title}>
          {course.name}
        </Text>
        <View style={styles.chipContainer}>
          <Chip style={styles.chip}>{course.category}</Chip>
          <Chip style={styles.chip}>{course.level}</Chip>
          <Chip style={styles.chip}>{course.modality}</Chip>
        </View>
        <View style={styles.section}>
          <Text variant="bodyLarge" style={styles.description}>
            {course.description}
          </Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detalles del curso
          </Text>
          <List.Item
            title="Fechas"
            description={`${new Date(
              course.startDate
            ).toLocaleDateString()} - ${new Date(
              course.endDate
            ).toLocaleDateString()}`}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          <List.Item
            title="Docente"
            description={instructorName}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Capacidad"
            description={`${course.enrolled} / ${course.capacity} estudiantes`}
            left={(props) => <List.Icon {...props} icon="account-group" />}
          />
        </View>
        {course.prerequisites.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Requisitos previos
              </Text>
              {course.prerequisites.map((req, idx) => (
                <List.Item
                  key={idx}
                  title={req}
                  left={(props) => <List.Icon {...props} icon="check-circle" />}
                />
              ))}
            </View>
          </>
        )}
        <View style={styles.actionContainer}>
          {isStudent &&
            !isInstructor &&
            (isEnrolled ? (
              <Button
                mode="contained"
                style={[styles.button, styles.enrolledButton]}
                disabled
              >
                Ya estás inscrito
              </Button>
            ) : isFullyBooked ? (
              <Button
                mode="contained"
                style={[styles.button, styles.fullyBookedButton]}
                disabled
              >
                Sin cupos
              </Button>
            ) : (
              <Button
                mode="contained"
                style={styles.button}
                onPress={handleEnroll}
                loading={enrolling}
                disabled={enrolling}
              >
                Inscribirse
              </Button>
            ))}
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => router.back()}
          >
            Volver
          </Button>
        </View>
      </View>
    </ScrollView>
  );

  const renderStudentsTab = () => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    {students.map((student) => (
      <View
        key={student.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Image
          source={{
            uri: student.avatarUrl || "https://via.placeholder.com/40",
          }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        <Text style={{ flex: 1 }}>{student.name}</Text>
        <Button
          mode="outlined"
          onPress={() => setSelectedStudent(student)}
          compact
        >
          Dar feedback
        </Button>
      </View>
    ))}

    {/* Aquí mostramos el formulario de feedback si hay un estudiante seleccionado */}
    {selectedStudent && (
      <View style={styles.feedbackFormContainer}>
        {/* Botón de cierre fuera del formulario */}
        <Button
          mode="text"
          onPress={() => setSelectedStudent(null)} // Cierra el formulario
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </Button>
        
        {/* Formulario de feedback */}
        <FeedbackForm
          studentId={selectedStudent.id}
          courseId={course.id}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      </View>
    )}
  </ScrollView>
);



  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <Button
          mode={activeTab === "info" ? "contained" : "outlined"}
          onPress={() => setActiveTab("info")}
          style={styles.tabButton}
        >
          Información
        </Button>
        {isInstructor && (
          <Button
            mode={activeTab === "students" ? "contained" : "outlined"}
            onPress={() => setActiveTab("students")}
            style={styles.tabButton}
          >
            Alumnos
          </Button>
        )}
      </View>

      {activeTab === "info" ? renderInfoTab() : renderStudentsTab()}

      {isCreator && activeTab === "info" && (
        <View style={styles.fabContainer}>
          <FAB
            icon="delete"
            style={[styles.fab, styles.fabDelete]}
            onPress={handleDelete}
            color="#fff"
            small
            loading={deleting}
            disabled={deleting}
          />
          <FAB
            icon="pencil"
            style={[styles.fab, styles.fabEdit]}
            onPress={handleEdit}
            color="#fff"
            small
          />
        </View>
      )}
    </View>
  );
}

// Mantén el código que ya tienes, pero con ajustes visuales en la interfaz.
const styles = StyleSheet.create({
  // Ajustes visuales para una mejor apariencia
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: { marginTop: 16, fontSize: 16 },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  courseImage: { width: "100%", height: 250, marginBottom: 16 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontWeight: "bold", marginBottom: 12 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  chip: { marginRight: 8, marginBottom: 8 },
  section: { marginVertical: 8 },
  sectionTitle: { fontWeight: "bold", marginBottom: 8 },
  description: { lineHeight: 24 },
  divider: { marginVertical: 16 },
  actionContainer: { marginTop: 24, marginBottom: 16 },
  button: { marginBottom: 12, paddingVertical: 6 },
  enrolledButton: { backgroundColor: "#4caf50" },
  fullyBookedButton: { backgroundColor: "#9e9e9e" },
  backButton: { marginTop: 16 },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
  },
  tabButton: {
    marginHorizontal: 8,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "center",
  },
  fab: { marginBottom: 8, elevation: 4 },
  fabEdit: { backgroundColor: "#6200ee" },
  fabDelete: { backgroundColor: "#f44336" },
 feedbackFormContainer: {
    position: "relative",  // Permite la posición flotante del botón de cierre
    marginTop: 16,
    paddingBottom: 80,  // Espacio para que no se sobreponga el formulario
  },
  
  // Aquí definimos la "X" fuera del formulario, pero flotante sobre la vista
  closeButton: {
    position: "absolute",
    top: 16,  // Ajustamos para que esté un poco alejada de la parte superior
    right: 16,  // Colocamos la "X" en la esquina superior derecha
    backgroundColor: "transparent",
    zIndex: 10,  // Asegura que el botón esté encima del formulario
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6200ee",  // Puedes cambiar el color si lo prefieres
    fontWeight: "bold",
  },
});
