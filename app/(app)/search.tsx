import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import {
  Text,
  Title,
  Searchbar,
  ActivityIndicator,
  Card,
  Avatar,
  Chip,
  useTheme,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { userApi, UserInfo } from "../../api/userApi";
import { useRouter } from "expo-router";
import { AppColors } from "@/constants/Colors";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
  
    setLoading(true);
    setSearched(true);
    setError("");
    
    // Limpiar resultados antes de buscar
    setResults([]);
  
    try {
      const response = await userApi.getAllUsers();
  
      // Filtrar usuarios por nombre o email que contengan el texto de búsqueda
      const filteredUsers = response.users.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  
      setResults(filteredUsers);
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
      setError("Ocurrió un error al realizar la búsqueda. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  
  const renderUserItem = ({ item }: { item: UserInfo }) => (
    <Card
      style={styles.userCard}
      onPress={() => {
        console.log(item.id);  // Verifica que el ID correcto se está pasando
        router.push(`/(app)/profile/${item.id}`);
      }}
      
    >
      <Card.Content style={styles.userCardContent}>
        <Avatar.Text
          size={50}
          label={item.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: AppColors.primary }}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Chip style={styles.userTypeChip} textStyle={{ fontSize: 12, color: AppColors.primary }}>
            {item.userType === "alumno" ? "Alumno" : "Docente"}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <View style={styles.headerContainer}>
        <Title style={styles.title}>Buscar Usuarios</Title>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre o email"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          iconColor={AppColors.primary}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Buscando usuarios...</Text>
        </View>
      ) : searched ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No se encontraron usuarios con "{searchQuery}"
            </Text>
          </View>
        )
      ) : (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Introduce un nombre o email para buscar usuarios
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
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
  searchContainer: {
    padding: 15,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  searchBar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  resultsContainer: {
    padding: 15,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: AppColors.text,
  },
  userEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  userTypeChip: {
    alignSelf: "flex-start",
    height: 24,
    backgroundColor: AppColors.primarySoft,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructionsText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    color: AppColors.error,
    margin: 15,
    textAlign: "center",
    fontSize: 14,
  },
});
