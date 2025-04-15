export interface Course {
    id: string
    name: string
    description: string
    shortDescription: string
    startDate: string
    endDate: string
    instructor: {
        name: string
        profile: string
    }
    capacity: number
    enrolled: number
    category: string
    level: "Principiante" | "Intermedio" | "Avanzado"
    modality: "Online" | "Presencial" | "Híbrido"
    prerequisites: string[]
    isEnrolled?: boolean
    imageUrl: string
}