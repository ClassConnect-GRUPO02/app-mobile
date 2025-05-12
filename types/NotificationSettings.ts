interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  // Configuraciones específicas para estudiantes (1=solo push, 2=solo email, 3=ambas)
  newAssignment: number
  deadlineReminder: number
  courseEnrollment: number
  favoriteCourseUpdate: number
  teacherFeedback: number
  // Configuraciones específicas para docentes (1=solo push, 2=solo email, 3=ambas)
  assignmentSubmission: number
  studentFeedback: number
}

export default NotificationSettings