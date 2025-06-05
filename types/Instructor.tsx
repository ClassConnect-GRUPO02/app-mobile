export interface InstructorPermissions {
  id: string
  userId: string
  courseId: string
  type: "TITULAR" | "AUXILIAR"
  can_create_content: boolean
  can_grade: boolean
  can_update_course: boolean
}

export interface Instructor {
  id: string
  courseId: string
  userId: string
  type: "TITULAR" | "AUXILIAR"
  can_create_content: boolean
  can_grade: boolean
  can_update_course: boolean
}

export interface InstructorInfo {
  id: string
  name: string
  email: string
  userType: string
  permissions?: InstructorPermissions
}
