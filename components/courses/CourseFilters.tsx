import React from "react"
import { useState } from "react"
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native"
import { Searchbar, Text, Chip, Surface } from "react-native-paper"

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
                                                            }) => {
    const [activeTab, setActiveTab] = useState<"category" | "level" | "modality" | null>(null)

    const handleTabPress = (tab: "category" | "level" | "modality" | null) => {
        setActiveTab(activeTab === tab ? null : tab)
    }

    const renderTabContent = () => {
        if (!activeTab) return null

        switch (activeTab) {
            case "category":
                return (
                    <View style={styles.tabContent}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                                <Chip
                                    selected={selectedCategory === null}
                                    onPress={() => onCategoryChange(null)}
                                    style={[styles.chip, selectedCategory === null && styles.selectedChip]}
                                >
                                    Todas las categorías
                                </Chip>
                                {categories.map((category) => (
                                    <Chip
                                        key={category}
                                        selected={selectedCategory === category}
                                        onPress={() => onCategoryChange(category)}
                                        style={[styles.chip, selectedCategory === category && styles.selectedChip]}
                                    >
                                        {category}
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )
            case "level":
                return (
                    <View style={styles.tabContent}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                                <Chip
                                    selected={selectedLevel === null}
                                    onPress={() => onLevelChange(null)}
                                    style={[styles.chip, selectedLevel === null && styles.selectedChip]}
                                >
                                    Todos los niveles
                                </Chip>
                                {levels.map((level) => (
                                    <Chip
                                        key={level}
                                        selected={selectedLevel === level}
                                        onPress={() => onLevelChange(level)}
                                        style={[styles.chip, selectedLevel === level && styles.selectedChip]}
                                    >
                                        {level}
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )
            case "modality":
                return (
                    <View style={styles.tabContent}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                                <Chip
                                    selected={selectedModality === null}
                                    onPress={() => onModalityChange(null)}
                                    style={[styles.chip, selectedModality === null && styles.selectedChip]}
                                >
                                    Todas las modalidades
                                </Chip>
                                {modalities.map((modality) => (
                                    <Chip
                                        key={modality}
                                        selected={selectedModality === modality}
                                        onPress={() => onModalityChange(modality)}
                                        style={[styles.chip, selectedModality === modality && styles.selectedChip]}
                                    >
                                        {modality}
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )
            default:
                return null
        }
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Buscar cursos"
                onChangeText={onSearchChange}
                value={searchQuery}
                style={styles.searchBar}
            />

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "category" && styles.activeTab,
                        selectedCategory && styles.selectedTabIndicator,
                    ]}
                    onPress={() => handleTabPress("category")}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "category" && styles.activeTabText,
                            selectedCategory && styles.selectedTabText,
                        ]}
                    >
                        {selectedCategory || "Categoría"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === "level" && styles.activeTab, selectedLevel && styles.selectedTabIndicator]}
                    onPress={() => handleTabPress("level")}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "level" && styles.activeTabText,
                            selectedLevel && styles.selectedTabText,
                        ]}
                    >
                        {selectedLevel || "Nivel"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "modality" && styles.activeTab,
                        selectedModality && styles.selectedTabIndicator,
                    ]}
                    onPress={() => handleTabPress("modality")}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "modality" && styles.activeTabText,
                            selectedModality && styles.selectedTabText,
                        ]}
                    >
                        {selectedModality || "Modalidad"}
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab && (
                <Surface style={styles.tabContentContainer} elevation={2}>
                    {renderTabContent()}
                </Surface>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    searchBar: {
        marginBottom: 12,
        elevation: 2,
    },
    tabsContainer: {
        flexDirection: "row",
        borderRadius: 8,
        overflow: "hidden",
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        backgroundColor: "#e0e0e0",
        borderBottomColor: "#6b00ce",
    },
    selectedTabIndicator: {
        borderBottomColor: "#6b00ce",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
    },
    activeTabText: {
        color: "#6200ee",
    },
    selectedTabText: {
        color: "#6b00ce",
    },
    tabContentContainer: {
        borderRadius: 8,
        marginTop: 1,
        marginBottom: 8,
    },
    tabContent: {
        padding: 12,
    },
    chipContainer: {
        flexDirection: "row",
        paddingRight: 8,
    },
    chip: {
        marginRight: 8,
    },
    selectedChip: {
        backgroundColor: "#6200ee",
    },
})

