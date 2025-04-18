import React from "react"
import { useState } from "react"
import { StyleSheet, View, TouchableOpacity, Modal } from "react-native"
import { Searchbar, Text, Chip, Surface, IconButton, Button } from "react-native-paper"

interface CourseFiltersProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    selectedCategory: string | null
    onCategoryChange: (category: string | null) => void
    selectedLevel: string | null
    onLevelChange: (level: string | null) => void
    selectedModality: string | null
    onModalityChange: (modality: string | null) => void
    categories: string[]
    levels: string[]
    modalities: string[]
    onRefresh: () => void
    refreshing: boolean
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
                                                                searchQuery,
                                                                onSearchChange,
                                                                selectedCategory,
                                                                onCategoryChange,
                                                                selectedLevel,
                                                                onLevelChange,
                                                                selectedModality,
                                                                onModalityChange,
                                                                categories,
                                                                levels,
                                                                modalities,
                                                                onRefresh,
                                                                refreshing,
                                                            }) => {
    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [tempCategory, setTempCategory] = useState<string | null>(selectedCategory)
    const [tempLevel, setTempLevel] = useState<string | null>(selectedLevel)
    const [tempModality, setTempModality] = useState<string | null>(selectedModality)

    const hasActiveFilters = selectedCategory !== null || selectedLevel !== null || selectedModality !== null

    const openFilterModal = () => {
        setTempCategory(selectedCategory)
        setTempLevel(selectedLevel)
        setTempModality(selectedModality)
        setFilterModalVisible(true)
    }

    const closeFilterModal = () => {
        setFilterModalVisible(false)
    }

    const applyFilters = () => {
        onCategoryChange(tempCategory)
        onLevelChange(tempLevel)
        onModalityChange(tempModality)
        closeFilterModal()
    }

    const resetFilters = () => {
        setTempCategory(null)
        setTempLevel(null)
        setTempModality(null)
    }

    const removeFilter = (type: "category" | "level" | "modality") => {
        switch (type) {
            case "category":
                onCategoryChange(null)
                break
            case "level":
                onLevelChange(null)
                break
            case "modality":
                onModalityChange(null)
                break
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar cursos"
                    onChangeText={onSearchChange}
                    value={searchQuery}
                    style={styles.searchBar}
                />
                <IconButton
                    icon="refresh"
                    size={24}
                    onPress={onRefresh}
                    disabled={refreshing}
                    style={styles.refreshButton}
                    loading={refreshing}
                />
            </View>

            <View style={styles.filtersRow}>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
                    onPress={openFilterModal}
                >
                    <IconButton icon="filter-variant" size={20} style={styles.filterIcon} />
                    <Text style={styles.filterText}>Filtros</Text>
                </TouchableOpacity>

                <View style={styles.tagsContainer}>
                    {selectedCategory && (
                        <Chip
                            style={styles.filterTag}
                            onClose={() => removeFilter("category")}
                            closeIconAccessibilityLabel="Eliminar filtro de categoría"
                        >
                            {selectedCategory}
                        </Chip>
                    )}
                    {selectedLevel && (
                        <Chip
                            style={styles.filterTag}
                            onClose={() => removeFilter("level")}
                            closeIconAccessibilityLabel="Eliminar filtro de nivel"
                        >
                            {selectedLevel}
                        </Chip>
                    )}
                    {selectedModality && (
                        <Chip
                            style={styles.filterTag}
                            onClose={() => removeFilter("modality")}
                            closeIconAccessibilityLabel="Eliminar filtro de modalidad"
                        >
                            {selectedModality}
                        </Chip>
                    )}
                </View>
            </View>

            <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={closeFilterModal}>
                <View style={styles.modalOverlay}>
                    <Surface style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filtrar cursos</Text>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Categoría</Text>
                            <View style={styles.chipGroup}>
                                <Chip
                                    selected={tempCategory === null}
                                    onPress={() => setTempCategory(null)}
                                    style={[styles.chip, tempCategory === null && styles.selectedChip]}
                                >
                                    Todas
                                </Chip>
                                {categories.map((category) => (
                                    <Chip
                                        key={category}
                                        selected={tempCategory === category}
                                        onPress={() => setTempCategory(category)}
                                        style={[styles.chip, tempCategory === category && styles.selectedChip]}
                                    >
                                        {category}
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Nivel</Text>
                            <View style={styles.chipGroup}>
                                <Chip
                                    selected={tempLevel === null}
                                    onPress={() => setTempLevel(null)}
                                    style={[styles.chip, tempLevel === null && styles.selectedChip]}
                                >
                                    Todos
                                </Chip>
                                {levels.map((level) => (
                                    <Chip
                                        key={level}
                                        selected={tempLevel === level}
                                        onPress={() => setTempLevel(level)}
                                        style={[styles.chip, tempLevel === level && styles.selectedChip]}
                                    >
                                        {level}
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Modalidad</Text>
                            <View style={styles.chipGroup}>
                                <Chip
                                    selected={tempModality === null}
                                    onPress={() => setTempModality(null)}
                                    style={[styles.chip, tempModality === null && styles.selectedChip]}
                                >
                                    Todas
                                </Chip>
                                {modalities.map((modality) => (
                                    <Chip
                                        key={modality}
                                        selected={tempModality === modality}
                                        onPress={() => setTempModality(modality)}
                                        style={[styles.chip, tempModality === modality && styles.selectedChip]}
                                    >
                                        {modality}
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <Button onPress={resetFilters} style={styles.resetButton}>
                                Limpiar filtros
                            </Button>
                            <View style={styles.actionButtons}>
                                <Button onPress={closeFilterModal} style={styles.cancelButton}>
                                    Cancelar
                                </Button>
                                <Button mode="contained" onPress={applyFilters} style={styles.applyButton}>
                                    Aplicar
                                </Button>
                            </View>
                        </View>
                    </Surface>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    searchBar: {
        flex: 1,
        elevation: 2,
        borderRadius: 8,
    },
    refreshButton: {
        marginLeft: 8,
    },
    filtersRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingRight: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    activeFilterButton: {
        backgroundColor: "#e6d9ff",
    },
    filterIcon: {
        margin: 0,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "500",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        flex: 1,
    },
    filterTag: {
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: "#e6d9ff",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        maxHeight: "80%",
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#6200ee",
    },
    filterSection: {
        marginBottom: 20,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333",
    },
    chipGroup: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    chip: {
        margin: 4,
    },
    selectedChip: {
        backgroundColor: "#6200ee",
    },
    modalActions: {
        marginTop: 16,
    },
    resetButton: {
        alignSelf: "center",
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        flex: 1,
        marginRight: 8,
    },
    applyButton: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: "#6200ee",
    },
})

