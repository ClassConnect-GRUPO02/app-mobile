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
  Modal,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { courseClient } from "@/api/coursesClient";
import { useState, useEffect } from "react";
import type { Course } from "@/types/Course";
import React from "react";
import { userApi } from "@/api/userApi";
import FeedbackForm from "../(courses)/feedback-form";
import { Platform, SafeAreaView, StatusBar } from "react-native";
import type { Module } from "@/types/Module";
import { ModuleList } from "@/components/modules/ModuleList";
import { ModuleForm } from "@/components/modules/ModuleForm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { moduleClient } from "@/api/modulesClient";

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
  const [activeTab, setActiveTab] = useState<"info" | "students" | "modules">(
    "info"
  );
  const [modules, setModules] = useState<Module[]>([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
  if (!id) return;

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await userApi.getUserId();
      if (!userId) throw new Error("No se pudo obtener el ID del usuario");

      const [userInfo, courseData, fetchedModules] = await Promise.all([
        userApi.getUserById(userId),
        courseClient.getCourseById(id),
        moduleClient.getModulesByCourseId(id),
      ]);

      setUserType(userInfo?.user?.userType);
      setCourse(courseData);
      setModules(fetchedModules);

      if (courseData.creatorId) {
        const creatorInfo = await userApi.getUserById(courseData.creatorId);
        setInstructorName(creatorInfo?.user?.name || "No especificado");
      }

      setIsCreator(courseData.creatorId === userId);

      const [instructorStatus, enrollmentStatus] = await Promise.all([
        courseClient.isInstructorInCourse(id, userId),
        courseClient.isEnrolledInCourse(id, userId),
      ]);

      console.log("Instructor status:", instructorStatus);
      console.log("Enrollment status:", enrollmentStatus);

      setIsInstructor(instructorStatus);
      setIsEnrolled(enrollmentStatus);

      if (instructorStatus) {
        const studentList = await courseClient.getStudentsInCourse(id);
        setStudents(studentList);
      }
    } catch (err) {
      console.error("Error al cargar el curso:", err);
      setError("No se pudo cargar la información del curso");
    } finally {
      setLoading(false);
      console.log("Final state:", {
    instructorName,
    isEnrolled,
    isInstructor,
    isCreator,
    userType,
  });
    }


  };

  fetchData();

  
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
      await userApi.notifyUser(
        userId,
        "Inscripción exitosa",
        `Te has inscrito en el curso ${course?.name}`,
        "courseEnrollment"
      );
    } catch (error) {
      console.error("Error al inscribirse:", error);
      Alert.alert("Error", "No se pudo completar la inscripción.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddModule = () => {
    setSelectedModule(null);
    setShowModuleForm(true);
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setShowModuleForm(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const success = await moduleClient.deleteModule(id, moduleId);
      if (success) {
        // Actualizar la lista de módulos
        setModules(modules.filter((module) => module.id !== moduleId));
        Alert.alert("Éxito", "El módulo ha sido eliminado correctamente");
      } else {
        Alert.alert("Error", "No se pudo eliminar el módulo");
      }
    } catch (error) {
      console.error("Error al eliminar el módulo:", error);
      Alert.alert("Error", "Ocurrió un error al eliminar el módulo");
    }
  };

  const handleModulePress = (moduleId: string) => {
    router.push({
      pathname: "/course/module/[moduleId]",
      params: { moduleId, courseId: id },
    });
  };

  const handleSaveModule = async (module: Module) => {
    setShowModuleForm(false);

    // Recargar los módulos para mostrar los cambios
    try {
      const updatedModules = await moduleClient.getModulesByCourseId(id);
      setModules(updatedModules);
    } catch (error) {
      console.error("Error al recargar módulos:", error);
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
  const isTeacher = userType === "docente";

  const renderInfoTab = () => (
    <View style={styles.container}>
      <ScrollView>
        <StatusBar barStyle="light-content" />

        <Image
          source={{
            uri:
              course.imageUrl ||
              "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2062&auto=format&fit=crop",
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

          <Divider style={styles.divider} />

          <View style={styles.actionContainer}>
            {/* Mostrar botón de inscripción solo para estudiantes que no sean instructores y no estén inscritos */}
            {isStudent &&
              !isInstructor &&
              (isEnrolled ? (
                <>
                  <Button
                    mode="contained"
                    style={[styles.button, styles.enrolledButton]}
                    disabled
                  >
                    Ya estás inscrito
                  </Button>
                  <Button
                    mode="outlined"
                    style={styles.button}
                    onPress={() =>
                      router.push({
                        pathname: "/(courses)/feedback",
                        params: { id: id },
                      })
                    }
                  >
                    Dejar Feedback
                  </Button>
                </>
              ) : isFullyBooked ? (
                <Button
                  mode="contained"
                  style={[styles.button, styles.fullyBookedButton]}
                  disabled
                >
                  Sin cupos disponibles
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

            {isTeacher && (
              <Button
                mode="outlined"
                style={styles.button}
                onPress={() =>
                  router.push({
                    pathname: "/(courses)/feedbacks",
                    params: { id: id },
                  })
                }
              >
                Ver Feedbacks del Curso
              </Button>
            )}

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

      {/* Modal para crear/editar módulo */}
      <Modal
        visible={showModuleForm}
        onDismiss={() => setShowModuleForm(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <ModuleForm
          courseId={id}
          initialData={selectedModule || undefined}
          onSave={handleSaveModule}
          onCancel={() => setShowModuleForm(false)}
        />
      </Modal>
    </View>
  );

  const renderModulesTab = () => (
    <View style={styles.modulesContainer}>
      {isCreator && (
        <Button
          mode="contained"
          icon="plus"
          onPress={handleAddModule}
          style={styles.addModuleButton}
        >
          Agregar módulo
        </Button>
      )}

      <ModuleList
        courseId={id}
        modules={modules}
        isCreator={isCreator}
        onModulePress={handleModulePress}
        onEditModule={isCreator ? handleEditModule : undefined}
        onDeleteModule={isCreator ? handleDeleteModule : undefined}
      />
    </View>
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
        <Button
          mode={activeTab === "modules" ? "contained" : "outlined"}
          onPress={() => setActiveTab("modules")}
          style={styles.tabButton}
        >
          Módulos
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

      {activeTab === "info" && renderInfoTab()}
      {activeTab === "modules" && renderModulesTab()}
      {activeTab === "students" && renderStudentsTab()}

      {isCreator && activeTab === "info" && (
        <View style={styles.fabContainer}>
          <FAB
            icon="delete"
            style={[styles.fab, styles.fabDelete]}
            onPress={handleDelete}
            color="#fff"
            loading={deleting}
            disabled={deleting}
          />
          <FAB
            icon="pencil"
            style={[styles.fab, styles.fabEdit]}
            onPress={handleEdit}
            color="#fff"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  courseImage: {
    width: "100%",
    height: 250,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    lineHeight: 24,
  },
  divider: {
    marginVertical: 16,
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 6,
  },
  enrolledButton: {
    backgroundColor: "#4caf50",
  },
  fullyBookedButton: {
    backgroundColor: "#9e9e9e",
  },
  backButton: {
    marginTop: 16,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "center",
  },
  fab: {
    marginBottom: 8,
    elevation: 4,
  },
  fabEdit: {
    backgroundColor: "#6200ee",
  },
  fabDelete: {
    backgroundColor: "#f44336",
  },

  modalContainer: {
    backgroundColor: "white",
    margin: 0,
    padding: 0,
    flex: 1,
  },
  modulesContainer: {
    flex: 1,
  },
  addModuleButton: {
    marginBottom: 16,
    backgroundColor: "#6200ee",
  },
  feedbackFormContainer: {
    position: "relative", // Permite la posición flotante del botón de cierre
    marginTop: 16,
    paddingBottom: 80, // Espacio para que no se sobreponga el formulario
  },

  // Aquí definimos la "X" fuera del formulario, pero flotante sobre la vista
  closeButton: {
    position: "absolute",
    top: 16, // Ajustamos para que esté un poco alejada de la parte superior
    right: 16, // Colocamos la "X" en la esquina superior derecha
    backgroundColor: "transparent",
    zIndex: 10, // Asegura que el botón esté encima del formulario
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6200ee", // Puedes cambiar el color si lo prefieres
    fontWeight: "bold",
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
  },
});