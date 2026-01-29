
export interface VersionConfig {
    version: string
    format: number
    enabled: boolean
}

export interface ModelData {
    id: string
    name: string
    customModelData: number
    parent?: string
    textures: Record<string, string>
    elements?: any[]
    display?: any
    targetItem: string
    customModelDataFloats?: number[]
    customModelDataFlags?: boolean[]
    customModelDataStrings?: string[]
    customModelDataColors?: string[]
    isValid?: boolean
    validationErrors?: string[]
    bedrockGeometry?: any
    bedrockAttachable?: any
    renderType?: "minecraft:item/generated" | "minecraft:item/handheld" | "translucent" | "cutout" // Added for Java transparency
    bedrockMaterial?: "entity_alphatest" | "entity_alphablend" | "entity_emissive_alpha" // Added for Bedrock transparency
    isDefaultOverride?: boolean // If true, this model replaces the default item texture (no CMD required)
}

export interface TextureData {
    id: string
    name: string
    file: File
    path: string
    size?: number
    dimensions?: { width: number; height: number }
    width?: number
    height?: number
    isOptimized?: boolean
    baseCategory?: string // Added to store original category (item, block, etc.)
    animation?: {
        enabled: boolean
        frametime?: number
        interpolate?: boolean
        frames?: number[]
    }
    enabled?: boolean
    frametime?: number
    interpolate?: boolean
    frames?: number[]
}

export interface FontProvider {
    id: string
    type: "bitmap" | "ttf" | "space" | "unihex"
    file?: string
    fileHandle?: File // Added for individual provider file upload
    ascent?: number
    height?: number
    chars?: string[]
    advances?: Record<string, number>
    size?: number
    oversample?: number
    shift?: [number, number]
    skip?: string[]
}

export interface CustomFont {
    id: string
    name: string
    providers: FontProvider[]
    file?: File
}

export interface CustomSound {
    id: string
    name: string
    category: "master" | "music" | "record" | "weather" | "block" | "hostile" | "neutral" | "player" | "ambient" | "voice"
    sounds: string[]
    file?: File
    subtitle?: string
    replace?: boolean
    bedrockDefinition?: any // Added for preserving sound_definitions.json entry
}

export interface CustomParticle {
    id: string
    name: string
    textures: string[]
    file?: File
    bedrockContent?: any // Added to preserve particles/*.json
}

export interface ShaderFile {
    id: string
    name: string
    type: "vertex" | "fragment" | "program"
    file?: File
    content?: string
}

export interface LanguageFile {
    code: string // e.g., "en_us"
    name: string // e.g., "English (US)"
    content: Record<string, string>
}

export interface ResourcePack {
    name: string
    description: string
    version: string
    format: number
    models: ModelData[]
    textures: TextureData[]
    fonts: CustomFont[]
    sounds: CustomSound[]
    languages: LanguageFile[]
    particles: CustomParticle[]
    shaders: ShaderFile[]
    packIcon?: File
    author?: string
    website?: string
    license?: string
}

export interface MergeConflict {
    path: string
    packs: { packName: string; file: File }[]
    packName?: string
    file?: File
    resolution: "skip" | "overwrite" | "rename"
}

export interface GeyserMapping {
    format_version: number
    items: {
        [javaItem: string]: Array<{
            name: string
            custom_model_data: number
            display_name?: string
            texture_size?: number
            icon?: string
            allow_offhand?: boolean
            creative_category?: number
            creative_group?: string
            tags?: string[]
        }>
    }
}
