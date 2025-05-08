import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Alert } from "react-native"
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper"
import { router, useLocalSearchParams } from "expo-router"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"
import React from "react"

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [comment, setComment] = useState("")
  const [punctuation, setPunctuation] = useState("")
  const [errors, setErrors] = useState<{ comment?: string; punctuation?: string }>({})

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success")

  useEffect(() => {
    const load = async () => {
      try {
        // podrías verificar si el curso existe, etc., acá
      } catch (err) {
        console.error(err)
        setSnackbarMessage("Error al cargar datos")
        setSnackbarType("error")
        setSnackbarVisible(true)
      } finally {
        setInitialLoading(false)
      }
    }

    if (id) load()
    else {
      Alert.alert("Error", "No se proporcionó un ID de curso", [
        { text: "Volver", onPress: () => router.back() },
      ])
    }
  }, [id])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!comment.trim()) newErrors.comment = "El comentario no puede estar vacío"
    const num = Number(punctuation)
    if (!num || num < 1 || num > 5) newErrors.punctuation = "Debe estar entre 1 y 5"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      const userId = await userApi.getUserId()
      await courseClient.sendCourseFeedback(id, {
        student_id: userId ?? "",
        comment,
        punctuation: Number(punctuation),
      })

      
      setSnackbarMessage("Feedback enviado con éxito")
      setSnackbarType("success")
      setSnackbarVisible(true)
      setComment("")
      setPunctuation("")
    } catch (err: any) {
        console.error(err)
        const status = err?.response?.status
      
        if (status === 400 ) {
          setSnackbarMessage("Ya enviaste feedback para este curso")
        } else if (status === 403 ) {
          setSnackbarMessage("Debés estar inscrito en el curso para dejar feedback")
        } else {
          setSnackbarMessage("Error al enviar feedback")
        }
      
        setSnackbarType("error")
        setSnackbarVisible(true)
      }
       finally {
        console.log("Feedback enviado:", {
          courseId: id, 
          comment,
          punctuation: Number(punctuation),
        })
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Dejá tu feedback del curso
      </Text>

      <TextInput
        label="Comentario"
        mode="outlined"
        multiline
        numberOfLines={5}
        value={comment}
        onChangeText={setComment}
        error={!!errors.comment}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.comment}>
        {errors.comment}
      </HelperText>

      <TextInput
        label="Puntuación (1-5)"
        mode="outlined"
        value={punctuation}
        onChangeText={setPunctuation}
        keyboardType="numeric"
        error={!!errors.punctuation}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.punctuation}>
        {errors.punctuation}
      </HelperText>

      <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}>
        Enviar Feedback
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={snackbarType === "error" ? styles.errorSnackbar : styles.successSnackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successSnackbar: {
    backgroundColor: "green",
  },
  errorSnackbar: {
    backgroundColor: "red",
  },
});
