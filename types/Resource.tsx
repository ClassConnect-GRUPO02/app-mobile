export type ResourceType = "video" | "document" | "link" | "image" | "other"

export interface Resource {
    id: string
    description: string
    type: ResourceType
    url: string
    order: number
    moduleId: string
}

export interface ResourceCreationData {
    description: string
    type: ResourceType
    url: string
    order: number
    moduleId: string
}

export interface ResourceUpdateData {
    description?: string
    type?: ResourceType
    url?: string
    order?: number
}
