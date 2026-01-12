import { v4 as uuidv4 } from "uuid"
import { ModelData, TextureData, ResourcePack, CustomSound, LanguageFile, CustomParticle, CustomFont } from "./types"

// --- Sound Conversion ---

export function convertSoundsToJava(sounds: CustomSound[]): Record<string, any> {
    const javaSounds: Record<string, any> = {}

    sounds.forEach(sound => {
        javaSounds[sound.name] = {
            category: sound.category,
            sounds: sound.sounds.map(s => ({
                name: s,
                type: "sound"
            })),
            ...(sound.subtitle && { subtitle: sound.subtitle }),
            ...(sound.replace !== undefined && { replace: sound.replace })
        }
    })

    return javaSounds
}

export function convertSoundsToBedrock(sounds: CustomSound[]): Record<string, any> {
    const bedrockDefinitions: Record<string, any> = {
        format_version: "1.14.0",
        sound_definitions: {}
    }

    sounds.forEach(sound => {
        bedrockDefinitions.sound_definitions[sound.name] = {
            category: sound.category,
            sounds: sound.sounds.map(s => ({
                name: `sounds/${s}`,
                volume: 1.0,
                pitch: 1.0,
                load_on_low_memory: true
            })),
            ...(sound.subtitle && { __subtitle: sound.subtitle })
        }
    })

    return bedrockDefinitions
}

// --- Language Conversion ---

export function convertLangToJava(content: Record<string, string>): Record<string, string> {
    return content
}

export function convertLangToBedrock(content: Record<string, string>): string {
    return Object.entries(content)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n")
}

// --- Model Conversion ---

export function convertModelToBedrock(model: ModelData): any {
    // Basic conversion from Java block/item model to Bedrock geometry
    // This is a simplified conversion and won't support complex display settings or parent hierarchies perfectly

    const geometryId = `geometry.${model.name}`

    const bones: any[] = []

    // Create a root bone
    bones.push({
        name: "root",
        pivot: [0, 0, 0]
    })

    // Convert elements to cubes
    if (model.elements) {
        const cubes = model.elements.map(element => {
            const from = element.from || [0, 0, 0]
            const to = element.to || [0, 0, 0]
            const size = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]

            // Bedrock origin is different, and UV mapping is different
            // This is a placeholder for the complex math needed for perfect conversion
            return {
                origin: from,
                size: size,
                uv: [0, 0] // Placeholder UV
            }
        })

        bones.push({
            name: "main",
            parent: "root",
            pivot: [0, 0, 0],
            cubes: cubes
        })
    }

    return {
        format_version: "1.12.0",
        "minecraft:geometry": [
            {
                description: {
                    identifier: geometryId,
                    texture_width: 64, // Default assumption
                    texture_height: 64,
                    visible_bounds_width: 2,
                    visible_bounds_height: 2,
                    visible_bounds_offset: [0, 0, 0]
                },
                bones: bones
            }
        ]
    }
}

// --- Texture Conversion ---

export function generateItemTextureJson(textures: TextureData[]): any {
    const textureData: Record<string, any> = {}

    textures.forEach(texture => {
        const name = texture.name.replace(/\.[^/.]+$/, "")
        textureData[name] = {
            textures: `textures/items/${name}`
        }
    })

    return {
        resource_pack_name: "pack_name", // Will be replaced or ignored by game
        texture_name: "atlas.items",
        texture_data: textureData
    }
}

// --- Manifest Generation ---

export function generateManifestJson(pack: ResourcePack): any {
    const headerUuid = uuidv4()
    const moduleUuid = uuidv4()

    return {
        format_version: 2,
        header: {
            name: pack.name,
            description: pack.description,
            uuid: headerUuid,
            version: [1, 0, 0],
            min_engine_version: [1, 21, 0]
        },
        modules: [
            {
                type: "resources",
                uuid: moduleUuid,
                version: [1, 0, 0]
            }
        ]
    }
}

// --- Particle Conversion ---

export function convertParticlesToBedrock(particles: CustomParticle[]): Record<string, any> {
    const particleDefinitions: Record<string, any> = {}

    particles.forEach(particle => {
        if (particle.bedrockContent) {
            // Use preserved Bedrock content
            particleDefinitions[particle.name] = particle.bedrockContent
        }
    })

    return particleDefinitions
}

// --- Font Conversion ---

export function convertFontsToBedrock(fonts: CustomFont[]): any {
    const providers: any[] = []

    fonts.forEach(font => {
        font.providers.forEach(provider => {
            if (provider.type === "bitmap") {
                providers.push({
                    type: "bitmap",
                    file: `textures/font/${font.name}.png`,
                    height: provider.height || 8,
                    ascent: provider.ascent || 8,
                    chars: provider.chars || []
                })
            } else if (provider.type === "ttf") {
                providers.push({
                    type: "ttf",
                    file: `font/${font.name}.ttf`,
                    size: provider.size || 11,
                    oversample: provider.oversample || 1.0,
                    shift: provider.shift || [0.0, 0.0],
                    face: ""
                })
            }
        })
    })

    if (providers.length === 0) return null

    return {
        format_version: "1.1.0",
        font: providers
    }
}
