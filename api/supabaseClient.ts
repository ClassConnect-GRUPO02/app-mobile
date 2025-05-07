import { createClient } from "@supabase/supabase-js"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system"

// Configuración de Supabase
const SUPABASE_URL = "https://gqqdprckhbiprthyfgcq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWRwcmNraGJpcHJ0aHlmZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MTA1NzYsImV4cCI6MjA2MTk4NjU3Nn0.9HMJJCJrCOjY4ITIlE7PSJwDy8LghG-Fc7j81h6O8RA"

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Bucket para almacenar archivos de cursos
const BUCKET_NAME = "course-resources"

// Mapeo simple de extensiones a tipos MIME
const MIME_TYPES: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'html': 'text/html',
  'htm': 'text/html',
  'json': 'application/json',
  'xml': 'application/xml',
  'zip': 'application/zip',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
};

export const supabaseClient = {
  // Subir un archivo a Supabase Storage
  uploadFile: async (uri: string, courseId: string, fileName: string): Promise<string | null> => {
    try {
      // Leer el archivo como base64
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error("El archivo no existe")
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Determinar el tipo MIME
      const fileExtension = uri.split(".").pop()?.toLowerCase() || ""
      const mimeType = MIME_TYPES[fileExtension] || "application/octet-stream"

      // Crear la ruta del archivo en Supabase
      const filePath = `${courseId}/${Date.now()}_${fileName}`

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, decode(base64), {
        contentType: mimeType,
        upsert: true,
      })

      if (error) {
        throw error
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error("Error al subir archivo a Supabase:", error)
      return null
    }
  },

  // Eliminar un archivo de Supabase Storage
  deleteFile: async (url: string): Promise<boolean> => {
    try {
      // Extraer la ruta del archivo de la URL
      const filePath = url.split(`${BUCKET_NAME}/`)[1]

      if (!filePath) {
        throw new Error("URL de archivo inválida")
      }

      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error al eliminar archivo de Supabase:", error)
      return false
    }
  },
}