import { useState, useEffect } from "react"
import { StyleSheet, View, Alert } from "react-native"
import { Text, Button, ActivityIndicator } from "react-native-paper"
import { useLocalSearchParams, router } from "expo-router"
import { courseClient } from "@/api/coursesClient"
import type { Module } from "@/types/Module"
import { StatusBar } from "expo-status-bar"
import { ModuleForm } from "@/components/modules/ModuleForm"
import {moduleClient} from "@/api/modulesClient";
import {userApi} from "@/api/userApi";
import React from "react"

export default function EditModuleScreen() {
  const { moduleId, courseId } = useLocalSearchParams<{ moduleId: string; courseId: string }>()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    const fetchModuleAndPermissions = async () => {
      try {
        setLoading(true)

        if (!moduleId || !courseId) {
          throw new Error("ID de módulo o curso no proporcionado")
        }

        // Obtener el módulo
        const moduleData = await moduleClient.getModuleById(courseId, moduleId)
        if (!moduleData) {
          throw new Error("No se pudo cargar el módulo")
        }

        setModule(moduleData)

        // Verificar si el usuario es el creador del curso
        const userId = await userApi.getUserId()
        if (!userId) {
          throw new Error("No se pudo obtener el ID del usuario")
        }

        const courseData = await courseClient.getCourseById(courseId)
        if (courseData) {
          const isUserCreator = courseData.creatorId === userId
          setIsCreator(isUserCreator)

          if (!isUserCreator) {
            throw new Error("No tienes permisos para editar este módulo")
          }
        }
      } catch (err) {
        console.error("Error al cargar el módulo:", err)
        setError(`${err instanceof Error ? err.message : "Error desconocido"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchModuleAndPermissions()
  }, [moduleId, courseId])

  const handleSaveModule = (updatedModule: Module) => {
    Alert.alert("Éxito", "El módulo ha sido actualizado correctamente", [{ text: "OK", onPress: () => router.back() }])
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Cargando módulo...</Text>
      </View>
    )
  }

  if (error || !module || !isCreator) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineMedium" style={styles.errorTitle}>
          Error
        </Text>
        <Text style={styles.errorText}>{error || "No tienes permisos para editar este módulo"}</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Volver
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <ModuleForm courseId={courseId} initialData={module} onSave={handleSaveModule} onCancel={() => router.back()} />
    </View>
  )
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    marginBottom: 12,
    color: "#d32f2f",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  backButton: {
    marginTop: 16,
  },
})
