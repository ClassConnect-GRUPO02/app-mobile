export interface CourseActivityLog {
  id: string
  courseId: string
  userId: string
  action: string
  metadata: any
  createdAt: string
  userName?: string
  userEmail?: string
}
