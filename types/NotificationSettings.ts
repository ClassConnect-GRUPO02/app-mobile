interface NotificationSettings {
  push_enabled: boolean
  email_enabled: boolean
  // Configuraciones específicas para estudiantes (1=solo push, 2=solo email, 3=ambas)
  new_assignment: number
  deadline_reminder: number
  course_enrollment: number
  favorite_course_update: number
  teacher_feedback: number
  // Configuraciones específicas para docentes (1=solo push, 2=solo email, 3=ambas)
  assignment_submission: number
  student_feedback: number
}

export default NotificationSettings