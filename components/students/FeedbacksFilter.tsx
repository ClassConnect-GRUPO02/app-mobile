import React, { useState } from "react";
import { View, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Searchbar, Chip, Text, IconButton, Surface, Button } from "react-native-paper";

interface FeedbacksFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCourse: string | null;
  onCourseChange: (course: string | null) => void;
  selectedScore: number | null;
  onScoreChange: (score: number | null) => void;
  enrolledCourses: string[]; // Lista de nombres de cursos
  onRefresh: () => void;
  refreshing: boolean;
}

export const FeedbacksFilter: React.FC<FeedbacksFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCourse,
  onCourseChange,
  selectedScore,
  onScoreChange,
  enrolledCourses,
  onRefresh,
  refreshing,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCourse, setTempCourse] = useState<string | null>(selectedCourse);
  const [tempScore, setTempScore] = useState<number | null>(selectedScore);

  const scores = [1, 2, 3, 4, 5];
  const hasFilters = selectedCourse !== null || selectedScore !== null;

  const openModal = () => {
    setTempCourse(selectedCourse);
    setTempScore(selectedScore);
    setModalVisible(true);
  };

  const applyFilters = () => {
    onCourseChange(tempCourse);
    onScoreChange(tempScore);
    setModalVisible(false);
  };

  const resetFilters = () => {
    setTempCourse(null);
    setTempScore(null);
  };

  const removeFilter = (type: "course" | "score") => {
    if (type === "course") onCourseChange(null);
    if (type === "score") onScoreChange(null);
  };

  return (
    <View style={styles.container}>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterButton, hasFilters && styles.activeFilterButton]}
          onPress={openModal}
        >
          <IconButton icon="filter-variant" size={20} />
          <Text style={styles.filterText}>Filtros</Text>
        </TouchableOpacity>

        <View style={styles.chips}>
          {selectedCourse && (
            <Chip style={styles.chip} onClose={() => removeFilter("course")}>
              {selectedCourse}
            </Chip>
          )}
          {selectedScore && (
            <Chip style={styles.chip} onClose={() => removeFilter("score")}>
              {selectedScore} estrellas
            </Chip>
          )}
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar Feedbacks</Text>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Curso</Text>
              <View style={styles.chipGroup}>
                <Chip selected={tempCourse === null} onPress={() => setTempCourse(null)} style={styles.chip}>
                  Todos
                </Chip>
                {enrolledCourses.map((course) => (
                  <Chip
                    key={course}
                    selected={tempCourse === course}
                    onPress={() => setTempCourse(course)}
                    style={styles.chip}
                  >
                    {course}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Puntuación</Text>
              <View style={styles.chipGroup}>
                <Chip selected={tempScore === null} onPress={() => setTempScore(null)} style={styles.chip}>
                  Todas
                </Chip>
                {scores.map((score) => (
                  <Chip
                    key={score}
                    selected={tempScore === score}
                    onPress={() => setTempScore(score)}
                    style={styles.chip}
                  >
                    {score} estrellas
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button onPress={resetFilters}>Limpiar filtros</Button>
              <View style={styles.actionButtons}>
                <Button onPress={() => setModalVisible(false)} style={{marginRight: 8}}>Cancelar</Button>
                <Button mode="contained" onPress={applyFilters}>
                  Aplicar
                </Button>
              </View>
            </View>
          </Surface>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  searchBar: { flex: 1, borderRadius: 8 },
  refreshButton: { marginLeft: 8 },
  filtersRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: { backgroundColor: "#e6d9ff" },
  filterText: { fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
  chip: { marginRight: 8, marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  filterSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  chipGroup: { flexDirection: "row", flexWrap: "wrap" },
  modalActions: {
    marginTop: 16,
    paddingHorizontal: 10, // añade espacio a los lados
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
