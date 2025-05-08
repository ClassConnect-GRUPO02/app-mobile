export interface Module {
    id: string
    name: string
    description: string
    url: string
    order: number
    courseId: string
}

export interface ModuleCreationData {
    name: string
    description: string
    url: string
    order: number
    courseId: string
}

export interface ModuleUpdateData {
    name?: string
    description?: string
    url?: string
    order?: number
}
