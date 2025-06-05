import { useState, useEffect } from "react"
import { courseClient } from "@/api/coursesClient"
import { userApi } from "@/api/userApi"

export interface InstructorPermissions {
  isCreator: boolean
  isInstructor: boolean
  isTitular: boolean
  isAuxiliar: boolean
  can_create_content: boolean
  can_grade: boolean
  can_update_course: boolean
}

export const useInstructorPermissions = (courseId: string) => {
  const [permissions, setPermissions] = useState<InstructorPermissions>({
    isCreator: false,
    isInstructor: false,
    isTitular: false,
    isAuxiliar: false,
    can_create_content: false,
    can_grade: false,
    can_update_course: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const userId = await userApi.getUserId()
        if (!userId) return

        // Obtener información del curso
        const course = await courseClient.getCourseById(courseId)
        const isCreator = course.creatorId === userId

        // Verificar si es instructor
        const isInstructor = await courseClient.isInstructorInCourse(courseId, userId)

        if (isCreator) {
          // Si es creador, tiene todos los permisos
          setPermissions({
            isCreator: true,
            isInstructor: true,
            isTitular: true,
            isAuxiliar: false,
            can_create_content: true,
            can_grade: true,
            can_update_course: true,
          })
        } else if (isInstructor) {
          // Si es instructor pero no creador, obtener permisos específicos
          const instructorPermissions = await courseClient.getInstructorPermissions(courseId, userId)

          setPermissions({
            isCreator: false,
            isInstructor: true,
            isTitular: instructorPermissions.type === "TITULAR",
            isAuxiliar: instructorPermissions.type === "AUXILIAR",
            can_create_content: instructorPermissions.can_create_content,
            can_grade: instructorPermissions.can_grade,
            can_update_course: instructorPermissions.can_update_course,
          })
        } else {
          // No es instructor
          setPermissions({
            isCreator: false,
            isInstructor: false,
            isTitular: false,
            isAuxiliar: false,
            can_create_content: false,
            can_grade: false,
            can_update_course: false,
          })
        }
      } catch (error) {
        console.error("Error fetching instructor permissions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchPermissions()
    }
  }, [courseId])

  return { permissions, loading }
}
