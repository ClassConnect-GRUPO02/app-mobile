export type LatePolicy =
    | "ninguna"
    | "descontar"
    | "penalizar"
    | "aceptar"
    | "aceptar_con_descuento"
    | "aceptar_con_penalizacion"
export type AnswerFormat = "texto" | "opcion_multiple" | "archivo" | "mixto"
export type TaskType = "tarea" | "examen"
export type SubmissionStatus = "submitted" | "late" | "graded"

export interface Task {
    id: string
    course_id: string
    created_by: string
    type: TaskType
    title: string
    description: string
    instructions: string
    due_date: string
    allow_late: boolean
    late_policy: LatePolicy
    has_timer: boolean
    time_limit_minutes?: number | null
    published: boolean
    visible_from?: string | null
    visible_until?: string | null
    allow_file_upload: boolean
    answer_format: AnswerFormat
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

export interface TaskSubmission {
    id?: string
    task_id: string
    student_id: string
    answers: string[]
    file_url?: string
    submitted_at: string
    status: SubmissionStatus
    grade?: number | null
    feedback?: string | null
}

export interface TaskWithSubmissionCount extends Task {
    _count?: {
        submissions: number
    }
    course?: {
        name: string
    }
}
