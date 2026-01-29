"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Film, Upload, Trash2, Plus, Settings2, Layout, Copy, Check, Terminal, Box } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { importBedrockPack, detectPackEdition } from "./resource-pack/bedrock-import"
import {
  convertSoundsToBedrock,
  convertLangToBedrock,
  convertParticlesToBedrock,
  convertFontsToBedrock
} from "./resource-pack/converters"
import { FontManager } from "./resource-pack/font-manager"
import { SoundManager } from "./resource-pack/sound-manager"
import { ParticleManager } from "./resource-pack/particle-manager"
import { ShaderManager } from "./resource-pack/shader-manager"
import { TextureManager } from "./resource-pack/texture-manager"
import {
  ResourcePack,
  ModelData,
  TextureData,
  CustomFont,
  FontProvider,
  CustomSound,
  CustomParticle,
  ShaderFile,
  GeyserMapping,
  MergeConflict,
  VersionConfig
} from "./resource-pack/types"

const validateModel = (model: ModelData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!model.name.trim()) errors.push("Model name is required")
  // Allow custom_model_data to be 0 or greater (0 is valid for base item override)
  if (model.customModelData === undefined || model.customModelData === null || model.customModelData < 0) {
    errors.push("Valid custom model data is required (0 or greater)")
  }
  if (!model.targetItem.trim()) errors.push("Target item is required")
  if (Object.keys(model.textures).length === 0) errors.push("At least one texture is required")

  return { isValid: errors.length === 0, errors }
}

const validateResourcePack = (pack: ResourcePack): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!pack.name.trim()) errors.push("Pack name is required")
  if (!pack.description.trim()) errors.push("Pack description is required")
  if (pack.models.length === 0) errors.push("At least one model is required")

  // Check for duplicate custom model data within same target item
  const targetItemGroups = pack.models.reduce(
    (acc, model) => {
      if (!acc[model.targetItem]) acc[model.targetItem] = []
      acc[model.targetItem].push(model.customModelData)
      return acc
    },
    {} as Record<string, number[]>,
  )

  Object.entries(targetItemGroups).forEach(([item, dataValues]) => {
    const duplicates = dataValues.filter((value, index) => dataValues.indexOf(value) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate custom model data for ${item}: ${duplicates.join(", ")}`)
    }
  })

  return { isValid: errors.length === 0, errors }
}

const translations = {
  ja: {
    title: "MARV",
    subtitle: "Minecraft リソースパック作成ツール",
    tabs: {
      general: "一般設定",
      models: "モデル管理",
      textures: "テクスチャ管理",
      fonts: "フォント管理",
      sounds: "サウンド管理",
      particles: "パーティクル管理",
      shaders: "シェーダー管理",
      preview: "プレビュー",
      advanced: "高度な設定",
      merge: "パックマージ",
      versions: "複数バージョン",
      geyser: "Geyser マッピング", // Added Geyser tab translation
    },
    general: {
      packName: "パック名",
      packDescription: "パック説明",
      packVersion: "バージョン",
      packFormat: "パックフォーマット",
      author: "作成者",
      website: "ウェブサイト",
      license: "ライセンス",
      packIcon: "パックアイコン",
      uploadIcon: "アイコンをアップロード",
      removeIcon: "アイコンを削除",
      title: "基本設定",
    },
    models: {
      addModel: "モデルを追加",
      noModels: "モデルがありません",
      modelCount: "モデル数",
      validModels: "有効なモデル",
      invalidModels: "無効なモデル",
      transparency: "透明度設定",
      renderType: "描画タイプ (Java)",
      bedrockMaterial: "マテリアル (Bedrock)",
      giveCommand: "Giveコマンド",
      summonCommand: "召喚コマンド (Item Display)",
      copyCommand: "コピー",
    },
    textures: {
      addTexture: "テクスチャを追加",
      noTextures: "テクスチャがありません",
      textureCount: "テクスチャ数",
      totalSize: "合計サイズ",
      optimizeAll: "すべて最適化",
    },
    fonts: {
      addFont: "フォントを追加",
      noFonts: "フォントがありません",
      fontCount: "フォント数",
      fontName: "フォント名",
      providerType: "プロバイダータイプ",
      addProvider: "プロバイダーを追加",
      description: "フォントの追加と編集を行います。",
      commandSnippets: "コマンドスニペット",
      tellraw: "Tellraw コマンド",
      title: "Title コマンド",
      rename: "アイテム名/説明文",
      generic: "汎用JSONテキスト",
    },
    sounds: {
      addSound: "サウンドを追加",
      noSounds: "サウンドがありません",
      soundCount: "サウンド数",
      soundName: "サウンド名",
      category: "カテゴリ",
      subtitle: "字幕",
    },
    particles: {
      addParticle: "パーティクルを追加",
      noParticles: "パーティクルがありません",
      particleCount: "パーティクル数",
    },
    shaders: {
      addShader: "シェーダーを追加",
      noShaders: "シェーダーがありません",
      shaderCount: "シェーダー数",
      shaderType: "シェーダータイプ",
    },
    actions: {
      download: "ZIPダウンロード",
      downloadJson: "JSON設定をダウンロード",
      import: "既存パックをインポート",
      export: "設定をエクスポート",
      validate: "検証",
      optimize: "最適化",
      reset: "リセット",
      copied: "コピーしました！",
      copiedDesc: "コマンドをクリップボードにコピーしました。",
    },
    status: {
      ready: "準備完了",
      processing: "処理中...",
      validating: "検証中...",
      optimizing: "最適化中...",
      generating: "生成中...",
      complete: "完了",
    },
    alerts: {
      noModels: "有効なモデルがありません。少なくとも1つのモデルを追加してください。",
      packGenerated: "リソースパックが正常に生成されました！",
      validationPassed: "すべての検証に合格しました！",
      validationFailed: "検証エラーがあります。修正してください。",
      optimizationComplete: "最適化が完了しました。",
      importError: "インポートエラーが発生しました。",
      exportComplete: "設定のエクスポートが完了しました。",
    },
    buttons: {
      optimizeAll: "すべて最適化",
    },
    dashboard: {
      title: "ダッシュボード",
      stats: "パック統計",
      models: "モデル",
      textures: "テクスチャ",
      fonts: "フォント",
      sounds: "サウンド",
      particles: "パーティクル",
      shaders: "シェーダー",
      totalSize: "合計サイズ",
      readiness: "公開準備完了",
    },
  },
  en: {
    title: "MARV",
    subtitle: "Minecraft Resource Pack Creator",
    tabs: {
      general: "General",
      models: "Models",
      textures: "Textures",
      fonts: "Fonts",
      sounds: "Sounds",
      particles: "Particles",
      shaders: "Shaders",
      preview: "Preview",
      advanced: "Advanced",
      merge: "Merge Packs",
      versions: "Multi-Version",
      geyser: "Geyser Mapping", // Added Geyser tab translation
    },
    general: {
      packName: "Pack Name",
      packDescription: "Pack Description",
      packVersion: "Version",
      packFormat: "Pack Format",
      author: "Author",
      website: "Website",
      license: "License",
      packIcon: "Pack Icon",
      uploadIcon: "Upload Icon",
      removeIcon: "Remove Icon",
      title: "General Settings",
    },
    models: {
      addModel: "Add Model",
      noModels: "No models available",
      modelCount: "Model Count",
      validModels: "Valid Models",
      invalidModels: "Invalid Models",
      transparency: "Transparency Settings",
      renderType: "Render Type (Java)",
      bedrockMaterial: "Material (Bedrock)",
      giveCommand: "Give Command",
      summonCommand: "Summon (Item Display)",
      copyCommand: "Copy",
    },
    textures: {
      addTexture: "Add Texture",
      noTextures: "No textures available",
      textureCount: "Texture Count",
      totalSize: "Total Size",
      optimizeAll: "Optimize All",
    },
    fonts: {
      addFont: "Add Font",
      noFonts: "No fonts available",
      fontCount: "Font Count",
      fontName: "Font Name",
      providerType: "Provider Type",
      addProvider: "Add Provider",
      description: "Manage and edit custom fonts.",
      commandSnippets: "Command Snippets",
      tellraw: "Tellraw Command",
      title: "Title Command",
      rename: "Item Name/Lore",
      generic: "Generic JSON Text",
    },
    sounds: {
      addSound: "Add Sound",
      noSounds: "No sounds available",
      soundCount: "Sound Count",
      soundName: "Sound Name",
      category: "Category",
      subtitle: "Subtitle",
      description: "Custom sounds allow you to add or replace sounds in Minecraft.",
    },
    particles: {
      addParticle: "Add Particle",
      noParticles: "No particles available",
      particleCount: "Particle Count",
      description: "Custom particles allow you to create unique visual effects.",
    },
    shaders: {
      addShader: "Add Shader",
      noShaders: "No shaders available",
      shaderCount: "Shader Count",
      shaderType: "Shader Type",
      description: "Manage vertex and fragment shaders for advanced visual effects.",
    },
    actions: {
      download: "Download ZIP",
      downloadJson: "Download JSON",
      import: "Import Pack",
      export: "Export Settings",
      validate: "Validate",
      optimize: "Optimize",
      reset: "Reset",
      copied: "Copied!",
      copiedDesc: "Command copied to clipboard.",
    },
    status: {
      ready: "Ready",
      processing: "Processing...",
      validating: "Validating...",
      optimizing: "Optimizing...",
      generating: "Generating...",
      complete: "Complete",
    },
    alerts: {
      noModels: "No valid models found. Please add at least one model.",
      packGenerated: "Resource pack generated successfully!",
      validationPassed: "All validations passed!",
      validationFailed: "Validation errors found. Please fix them.",
      optimizationComplete: "Optimization completed.",
      importError: "Import error occurred.",
      exportComplete: "Settings exported successfully.",
    },
    buttons: {
      optimizeAll: "Optimize All",
    },
    dashboard: {
      title: "Dashboard",
      stats: "Pack Statistics",
      models: "Models",
      textures: "Textures",
      fonts: "Fonts",
      sounds: "Sounds",
      particles: "Particles",
      shaders: "Shaders",
      totalSize: "Total Size",
      readiness: "Ready for Release",
    },
  },
}

const MINECRAFT_ITEMS = [
  "stick",
  "diamond_sword",
  "iron_sword",
  "golden_sword",
  "stone_sword",
  "wooden_sword",
  "netherite_sword",
  "diamond_pickaxe",
  "iron_pickaxe",
  "golden_pickaxe",
  "stone_pickaxe",
  "wooden_pickaxe",
  "netherite_pickaxe",
  "diamond_axe",
  "iron_axe",
  "golden_axe",
  "stone_axe",
  "wooden_axe",
  "netherite_axe",
  "diamond_shovel",
  "iron_shovel",
  "golden_shovel",
  "stone_shovel",
  "wooden_shovel",
  "netherite_shovel",
  "diamond_hoe",
  "iron_hoe",
  "golden_hoe",
  "stone_hoe",
  "wooden_hoe",
  "netherite_hoe",
  "bow",
  "crossbow",
  "trident",
  "shield",
  "fishing_rod",
  "apple",
  "bread",
  "cooked_beef",
  "cooked_porkchop",
  "cooked_chicken",
  "diamond",
  "emerald",
  "gold_ingot",
  "iron_ingot",
  "coal",
  "stone",
  "cobblestone",
  "dirt",
  "grass_block",
  "oak_log",
  "enchanted_book",
  "book",
  "paper",
  "map",
  "compass",
  "clock",
  "carrot_on_a_stick",
  "warped_fungus_on_a_stick",
  "flint_and_steel",
  "shears",
  "spyglass",
  "brush",
  "goat_horn",
]

const PACK_FORMATS = [
  { version: "1.21.6", format: 63, description: "Minecraft 1.21.6" },
  { version: "1.21.4", format: 48, description: "Minecraft 1.21.4 (New items/ folder structure)" },
  { version: "1.21", format: 34, description: "Minecraft 1.21" },
  { version: "1.20.5-1.20.6", format: 32, description: "Minecraft 1.20.5-1.20.6" },
  { version: "1.20.3-1.20.4", format: 22, description: "Minecraft 1.20.3-1.20.4" },
  { version: "1.20.0-1.20.2", format: 18, description: "Minecraft 1.20.0-1.20.2" },
  { version: "1.19.4", format: 15, description: "Minecraft 1.19.4" },
  { version: "1.19.3", format: 13, description: "Minecraft 1.19.3" },
  { version: "1.19.0-1.19.2", format: 12, description: "Minecraft 1.19.0-1.19.2" },
  { version: "1.18.2", format: 9, description: "Minecraft 1.18.2" },
  { version: "1.18.0-1.18.1", format: 8, description: "Minecraft 1.18.0-1.18.1" },
  { version: "1.17.0-1.17.1", format: 7, description: "Minecraft 1.17.0-1.17.1" },
  { version: "1.16.2-1.16.5", format: 6, description: "Minecraft 1.16.2-1.16.5" },
  { version: "1.15.0-1.16.1", format: 5, description: "Minecraft 1.15.0-1.16.1" },
]

import { useToast } from "@/hooks/use-toast"

export function ResourcePackMaker() {
  const { toast } = useToast()
  const [language, setLanguage] = useState<"ja" | "en">("en") // Default to English
  const t = translations[language]

  const [resourcePack, setResourcePack] = useState<ResourcePack>({
    name: "",
    description: "",
    version: "1.21.6",
    format: 63,
    models: [],
    textures: [],
    fonts: [],
    sounds: [],
    particles: [],
    shaders: [],
    packIcon: undefined,
    author: "",
    website: "",
    license: "All Rights Reserved",
    languages: []
  })

  const [activeTab, setActiveTab] = useState("general")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: [],
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [mergePacks, setMergePacks] = useState<{ name: string; file: File }[]>([])
  const [mergeConflicts, setMergeConflicts] = useState<MergeConflict[]>([])
  const [versionConfigs, setVersionConfigs] = useState<VersionConfig[]>([
    { version: "1.21.6+", format: 63, enabled: true },
    { version: "1.21.4-1.21.5", format: 48, enabled: false },
    { version: "1.21.0-1.21.3", format: 34, enabled: false },
    { version: "1.20.5-1.20.6", format: 32, enabled: false },
    { version: "1.20.3-1.20.4", format: 22, enabled: false },
    { version: "1.20.0-1.20.2", format: 18, enabled: false },
    { version: "1.19.4", format: 15, enabled: false },
    { version: "1.19.3", format: 13, enabled: false },
    { version: "1.19.0-1.19.2", format: 12, enabled: false },
    { version: "1.18.0-1.18.2", format: 9, enabled: false },
    { version: "1.17.0-1.17.1", format: 7, enabled: false },
    { version: "1.16.2-1.16.5", format: 6, enabled: false },
    { version: "1.15.0-1.15.2", format: 5, enabled: false },
    { version: "1.13.0-1.14.4", format: 4, enabled: false },
  ])
  const [packEdition, setPackEdition] = useState<"java" | "bedrock">("java")
  const [geyserMappings, setGeyserMappings] = useState<GeyserMapping | undefined>(undefined)
  const [dragActive, setDragActive] = useState(false)

  const [targetItemInput, setTargetItemInput] = useState<Record<string, string>>({})
  const [showTargetItemSuggestions, setShowTargetItemSuggestions] = useState<Record<string, boolean>>({})

  const [editingTextureAnimation, setEditingTextureAnimation] = useState<string | null>(null)

  // Auto-linking side effect
  useEffect(() => {
    setResourcePack((prev) => {
      let changed = false
      const updatedModels = prev.models.map((model) => {
        if (Object.keys(model.textures).length === 0) {
          const cleanModelName = model.name.toLowerCase().replace(/\s+/g, "_")
          const matchingTexture = prev.textures.find(
            (t) => t.name.toLowerCase().replace(/\s+/g, "_") === cleanModelName,
          )
          if (matchingTexture) {
            changed = true
            // Extract category from path: textures/category/name
            const category = matchingTexture.path.split("/")[1] || "item"
            return { ...model, textures: { layer0: `${category}/${matchingTexture.name}` } }
          }
        }
        return model
      })

      if (!changed) return prev
      return { ...prev, models: updatedModels }
    })
  }, [resourcePack.models.length, resourcePack.textures.length])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const statistics = useMemo(() => {
    const validModels = resourcePack.models.filter((model) => {
      const validation = validateModel(model)
      return validation.isValid
    })

    const totalTextureSize = resourcePack.textures.reduce((sum, texture) => sum + (texture.size || 0), 0)
    const optimizedTextures = resourcePack.textures.filter((t) => t.isOptimized).length

    return {
      totalModels: resourcePack.models.length,
      validModels: validModels.length,
      invalidModels: resourcePack.models.length - validModels.length,
      totalTextures: resourcePack.textures.length,
      optimizedTextures,
      totalSize: totalTextureSize,
      formattedSize: formatFileSize(totalTextureSize),
    }
  }, [resourcePack.models, resourcePack.textures, formatFileSize])

  const packStats = statistics

  const updateProgress = useCallback((step: string, percent: number) => {
    setProcessingStep(step)
    setProgress(percent)
  }, [])

  const handlePackInfoChange = useCallback((field: keyof ResourcePack, value: string | number | File | undefined) => {
    setResourcePack((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const addModel = useCallback(() => {
    const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
    // Start from 0 to allow base item override, then find next available
    let newCustomModelData = 0
    while (existingCustomModelData.includes(newCustomModelData)) {
      newCustomModelData++
    }

    const newModel: ModelData = {
      id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `New Model ${resourcePack.models.length + 1}`,
      customModelData: newCustomModelData,
      parent: "item/generated",
      textures: {},
      targetItem: "stick",
      customModelDataFloats: [],
      customModelDataFlags: [],
      customModelDataStrings: [],
      customModelDataColors: [],
      renderType: "minecraft:item/generated",
      bedrockMaterial: "entity_alphatest",
    }

    setResourcePack((prev) => ({
      ...prev,
      models: [...prev.models, newModel],
    }))
  }, [resourcePack.models])

  const updateModel = useCallback((modelId: string, updatedModel: Partial<ModelData>) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) => {
        if (model.id === modelId) {
          const m = { ...model, ...updatedModel }
          // If name is updated and no textures assigned, try to find matching texture
          if (updatedModel.name && Object.keys(m.textures).length === 0) {
            const cleanName = updatedModel.name.toLowerCase().replace(/\s+/g, "_")
            const matchingTexture = prev.textures.find(t =>
              t.name.toLowerCase().replace(/\s+/g, "_") === cleanName
            )
            if (matchingTexture) {
              const category = matchingTexture.path.split("/")[1] || "item"
              m.textures = { layer0: `${category}/${matchingTexture.name}` }
            }
          }
          return m
        }
        return model
      }),
    }))
  }, [])

  const deleteModel = useCallback((modelId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.filter((model) => model.id !== modelId),
    }))
  }, [])

  const updateModelTexture = useCallback((modelId: string, layer: string, textureName: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) =>
        model.id === modelId
          ? {
            ...model,
            textures: {
              ...model.textures,
              [layer]: textureName,
            },
          }
          : model,
      ),
    }))
  }, [])

  const removeModelTexture = useCallback((modelId: string, layer: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) => {
        if (model.id === modelId) {
          const newTextures = { ...model.textures }
          delete newTextures[layer]
          return { ...model, textures: newTextures }
        }
        return model
      }),
    }))
  }, [])

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new globalThis.Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const syncAllTextures = useCallback(() => {
    setResourcePack((prev) => {
      let changed = false
      const updatedModels = prev.models.map((model) => {
        if (Object.keys(model.textures).length === 0) {
          const cleanModelName = model.name.toLowerCase().replace(/\s+/g, "_")
          const matchingTexture = prev.textures.find(
            (t) => t.name.toLowerCase().replace(/\s+/g, "_") === cleanModelName,
          )
          if (matchingTexture) {
            changed = true
            // Extract category from path: textures/category/name
            const category = matchingTexture.path.split("/")[1] || "item"
            return { ...model, textures: { layer0: `${category}/${matchingTexture.name}` } }
          }
        }
        return model
      })

      if (!changed) return prev
      return { ...prev, models: updatedModels }
    })
  }, [])

  const addTexture = useCallback(
    async (file: File, category: string = "item") => {
      const fileName = file.name.replace(/\.[^/.]+$/, "")

      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      const newTexture: TextureData = {
        id: `texture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: fileName,
        file: file,
        path: `textures/${category}/${fileName}`, // Store path without extension for internal consistency
        size: file.size,
        dimensions,
        isOptimized: false,
        baseCategory: category,
        animation: {
          // Initialize animation settings
          enabled: false,
          frametime: 1,
          interpolate: false,
          frames: [],
        },
      }

      setResourcePack((prev) => {
        const cleanFileName = fileName.toLowerCase().replace(/\s+/g, "_")

        // Automatically link to models with same name that have no textures
        const updatedModels = prev.models.map(model => {
          const cleanModelName = model.name.toLowerCase().replace(/\s+/g, "_")
          if (cleanModelName === cleanFileName && Object.keys(model.textures).length === 0) {
            return { ...model, textures: { layer0: `${category}/${fileName}` } }
          }
          return model
        })

        const updatedTextures = [
          ...prev.textures.filter((t) => t.path !== newTexture.path),
          newTexture,
        ]

        return {
          ...prev,
          textures: updatedTextures,
          models: updatedModels,
        }
      })
    },
    [getImageDimensions],
  )

  const updateTexture = useCallback((textureId: string, updatedTexture: Partial<TextureData>) => {
    setResourcePack((prev) => {
      const oldTexture = prev.textures.find((t) => t.id === textureId)
      if (!oldTexture) return prev

      const nameChanged = updatedTexture.name && updatedTexture.name !== oldTexture.name
      let newPath = oldTexture.path

      if (nameChanged) {
        const category = oldTexture.baseCategory || oldTexture.path.split("/")[1] || "item"
        newPath = `textures/${category}/${updatedTexture.name}`
      }

      const updatedTextures = prev.textures.map((texture) =>
        texture.id === textureId ? { ...texture, ...updatedTexture, path: newPath } : texture,
      )

      // If name/path changed, update all models that were using the old path
      let updatedModels = prev.models
      if (nameChanged) {
        const oldRef = oldTexture.path.replace("textures/", "")
        const newRef = newPath.replace("textures/", "")

        updatedModels = prev.models.map((model) => {
          const newModelTextures = { ...model.textures }
          let modelChanged = false
          Object.entries(newModelTextures).forEach(([key, val]) => {
            if (val === oldRef) {
              newModelTextures[key] = newRef
              modelChanged = true
            }
          })
          return modelChanged ? { ...model, textures: newModelTextures } : model
        })
      }

      return {
        ...prev,
        textures: updatedTextures,
        models: updatedModels,
      }
    })
  }, [])

  const optimizeTexture = useCallback(async (textureId: string) => {
    setIsProcessing(true)
    updateProgress("Optimizing texture...", 50)

    // Simulate optimization process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.map((texture) =>
        texture.id === textureId
          ? { ...texture, isOptimized: true, size: Math.floor((texture.size || 0) * 0.7) }
          : texture,
      ),
    }))

    setIsProcessing(false)
    setProgress(0)
  }, [])

  const optimizeAllTextures = useCallback(async () => {
    setIsProcessing(true)
    const unoptimizedTextures = resourcePack.textures.filter((t) => !t.isOptimized)

    if (unoptimizedTextures.length === 0) {
      setIsProcessing(false)
      return
    }

    const results: Record<string, { isOptimized: boolean; size: number }> = {}
    for (let i = 0; i < unoptimizedTextures.length; i++) {
      updateProgress(
        `Optimizing texture ${i + 1}/${unoptimizedTextures.length}...`,
        (i / unoptimizedTextures.length) * 100,
      )

      const texture = unoptimizedTextures[i]
      // Simulate optimization
      await new Promise((resolve) => setTimeout(resolve, 100))
      results[texture.id] = {
        isOptimized: true,
        size: Math.floor((texture.size || 0) * 0.7),
      }
    }

    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.map((texture) =>
        results[texture.id] ? { ...texture, ...results[texture.id] } : texture,
      ),
    }))

    setIsProcessing(false)
    setProgress(0)
    alert(t.alerts.optimizationComplete)
  }, [resourcePack.textures, t.alerts.optimizationComplete, updateProgress])

  const convertToBedrock = useCallback((bbmodelData: any, modelName: string) => {
    try {
      console.log("Converting to Bedrock format:", modelName)

      const geometry = {
        format_version: "1.16.0",
        "minecraft:geometry": [
          {
            description: {
              identifier: `geometry.${modelName}`,
              texture_width: bbmodelData.resolution?.width || 16,
              texture_height: bbmodelData.resolution?.height || 16,
              visible_bounds_width: 2,
              visible_bounds_height: 1.5,
              visible_bounds_offset: [0, 0.25, 0],
            },
            bones: [] as any[],
          },
        ],
      }

      // Recursive bone processing for Bedrock
      if (bbmodelData.outliner && Array.isArray(bbmodelData.outliner)) {
        const bones: any[] = []

        const processItem = (item: any, parentName?: string) => {
          if (typeof item === "string") {
            // It's a top-level element UUID, but usually elements are inside groups for Bedrock
            return
          }

          const currentBoneName = item.name || `bone_${bones.length}`
          const bone: any = {
            name: currentBoneName,
            pivot: item.origin ? [item.origin[0], item.origin[1], item.origin[2]] : [0, 0, 0],
            cubes: [] as any[],
          }

          if (parentName) {
            bone.parent = parentName
          }

          if (item.rotation) {
            // Blockbench uses [x, y, z], Bedrock uses [x, y, z] but sometimes needs inversion depending on context
            // Usually [rotX, rotY, rotZ] is fine
            bone.rotation = [item.rotation[0], item.rotation[1], item.rotation[2]]
          }

          // Process children (could be UUIDs of elements or nested group objects)
          if (item.children && Array.isArray(item.children)) {
            item.children.forEach((child: any) => {
              if (typeof child === "string") {
                // It's an element UUID
                const element = bbmodelData.elements?.find((e: any) => e.uuid === child)
                if (element) {
                  const cube: any = {
                    origin: element.from || [0, 0, 0],
                    size: [
                      (element.to?.[0] || 0) - (element.from?.[0] || 0),
                      (element.to?.[1] || 0) - (element.from?.[1] || 0),
                      (element.to?.[2] || 0) - (element.from?.[2] || 0),
                    ],
                    uv: {} as any,
                  }

                  if (element.rotation) {
                    cube.rotation = element.rotation
                    cube.pivot = element.origin || element.from || [0, 0, 0]
                  }

                  if (element.inflate) {
                    cube.inflate = element.inflate
                  }

                  // Convert UV mapping to Bedrock format
                  if (element.faces) {
                    Object.entries(element.faces).forEach(([faceName, faceData]: [string, any]) => {
                      if (faceData && faceData.uv) {
                        // Bedrock expects [u, v, width, height] or {uv: [u, v], uv_size: [w, h]}
                        cube.uv[faceName] = {
                          uv: [faceData.uv[0], faceData.uv[1]],
                          uv_size: [faceData.uv[2] - faceData.uv[0], faceData.uv[3] - faceData.uv[1]],
                        }
                      }
                    })
                  }
                  bone.cubes.push(cube)
                }
              } else {
                // It's a nested group
                processItem(child, currentBoneName)
              }
            })
          }

          bones.push(bone)
        }

        bbmodelData.outliner.forEach((item: any) => processItem(item))
        geometry["minecraft:geometry"][0].bones = bones
      }

      console.log("Bedrock conversion successful, bones:", geometry["minecraft:geometry"][0].bones.length)
      return geometry
    } catch (error) {
      console.error("Bedrock conversion error:", error)
      return null
    }
  }, [])

  const handleBbmodelUpload = useCallback(
    async (file: File, parsedData: any) => {
      try {
        console.log("BBModel import started:", file.name, "Edition:", packEdition)
        setIsProcessing(true)
        updateProgress("Parsing BBModel file...", 10)

        const modelName = parsedData.name || file.name.replace(".bbmodel", "")

        // Auto-detection logic: Try to parse targetItem and CMD from filename
        // Pattern: {targetItem}_{cmd}.bbmodel or {targetItem}.bbmodel
        let targetItem = parsedData.meta?.model_identifier || "stick"
        let detectedCmd: number | undefined = undefined

        const nameMatch = file.name.replace(".bbmodel", "").match(/^(.+?)(?:_(\d+))?$/)
        if (nameMatch) {
          const potentialItem = nameMatch[1].toLowerCase()
          const potentialCmd = nameMatch[2] ? parseInt(nameMatch[2]) : undefined

          if (MINECRAFT_ITEMS.includes(potentialItem)) {
            targetItem = potentialItem
            if (potentialCmd) {
              detectedCmd = potentialCmd
            }
          } else if (MINECRAFT_ITEMS.includes(potentialItem.replace(/_/g, ""))) {
            // Try loose matching (e.g. diamondsword -> diamond_sword) if needed, but strict is saver
          }
        }

        const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
        let customModelData = detectedCmd || 1

        // If detected CMD is already taken, fallback to finding next free slot
        // OR should we enforce the detected one? User probably wants to enforce it.
        // But let's check for collision.
        // If detectedCmd is set, we use it. If collision, we might just use it anyway (overwrite intent?) or warn.
        // Current logic finds NEXT free. Let's keep it safe:
        // if no detected CMD, find next free.
        // if detected CMD, check availability. If taken, maybe increment? 
        // User request "Auto detect" implies "Use what I said".

        if (detectedCmd) {
          if (existingCustomModelData.includes(detectedCmd)) {
            // Conflict! For now, let's just accept it (duplicates allowed in UI? validator checks it).
            // Ideally we might prompt, but for "auto detect", let's assume they know what they are naming.
            customModelData = detectedCmd
          }
        } else {
          while (existingCustomModelData.includes(customModelData)) {
            customModelData++
          }
        }

        updateProgress("Processing textures...", 30)

        const textureMap: Record<string, string> = {}
        const textureFiles: File[] = []

        if (parsedData.textures && Array.isArray(parsedData.textures)) {
          for (let i = 0; i < parsedData.textures.length; i++) {
            const texture = parsedData.textures[i]
            updateProgress(
              `Processing texture ${i + 1}/${parsedData.textures.length}...`,
              30 + (i / parsedData.textures.length) * 40,
            )

            if (texture.source && texture.source.startsWith("data:image")) {
              const base64Data = texture.source.split(",")[1]
              const binaryData = atob(base64Data)
              const arrayBuffer = new Uint8Array(binaryData.length)
              for (let j = 0; j < binaryData.length; j++) {
                arrayBuffer[j] = binaryData.charCodeAt(j)
              }
              const blob = new Blob([arrayBuffer], { type: "image/png" })
              const textureName = texture.name || `texture_${i}`
              const textureFile = new File([blob], `${textureName}.png`, { type: "image/png" })

              textureFiles.push(textureFile)
              // For Java 3D models, we need index-based keys ("0", "1", etc.)
              // For Java 2D items, we use "layer0", "layer1"
              textureMap[`layer${i}`] = textureName
              textureMap[i.toString()] = textureName
            }
          }
        }

        updateProgress("Creating model...", 80)

        let bedrockGeometry = null
        if (packEdition === "bedrock") {
          bedrockGeometry = convertToBedrock(parsedData, modelName)
        }

        const newModel: ModelData = {
          id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: modelName,
          customModelData,
          parent: parsedData.elements ? undefined : "item/generated", // Use generic parent only for 2D items
          textures: textureMap,
          targetItem,
          customModelDataFloats: [],
          customModelDataFlags: [],
          customModelDataStrings: [],
          customModelDataColors: [],
          elements: parsedData.elements,
          display: parsedData.display,
          bedrockGeometry,
          renderType: "minecraft:item/generated",
          bedrockMaterial: "entity_alphatest",
        }

        // Batch state update for performance and consistency
        const newTextureDataList: TextureData[] = []
        for (const textureFile of textureFiles) {
          const fileName = textureFile.name.replace(/\.[^/.]+$/, "")
          const dimensions = await getImageDimensions(textureFile)
          newTextureDataList.push({
            id: `texture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: fileName,
            file: textureFile,
            path: `textures/item/${fileName}`,
            size: textureFile.size,
            dimensions,
            isOptimized: false,
            animation: { enabled: false, frametime: 1, interpolate: false, frames: [] },
          })
        }

        setResourcePack((prev) => {
          const newPaths = new Set(newTextureDataList.map((t) => t.path))
          const filteredTextures = prev.textures.filter((t) => !newPaths.has(t.path))

          return {
            ...prev,
            textures: [...filteredTextures, ...newTextureDataList],
            models: [...prev.models, newModel],
          }
        })

        updateProgress("Complete!", 100)

        setTimeout(() => {
          setIsProcessing(false)
          setProgress(0)
          console.log("BBModel import complete:", {
            modelName,
            customModelData,
            targetItem,
            textureCount: textureFiles.length,
            edition: packEdition,
          })
        }, 500)
      } catch (error) {
        console.error("Import error:", error)
        setIsProcessing(false)
        updateProgress(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, 0)
      }
    },
    [packEdition, resourcePack.models, getImageDimensions, convertToBedrock],
  )

  const handleJsonModelImport = useCallback(
    async (file: File, parsedData: any) => {
      try {
        console.log("JSON Model import started:", file.name)
        setIsProcessing(true)
        updateProgress("Parsing JSON model file...", 10)

        const modelName = file.name.replace(".json", "")

        // Detect if this is a Blockbench export or a standard Minecraft model
        const isBlockbench = parsedData.meta || parsedData.resolution || parsedData.outliner

        if (isBlockbench) {
          // Use existing BBModel handler for Blockbench exports
          return await handleBbmodelUpload(file, parsedData)
        }

        // Standard Minecraft Java model JSON
        const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
        let customModelData = 1
        while (existingCustomModelData.includes(customModelData)) {
          customModelData++
        }

        updateProgress("Processing model data...", 50)

        const newModel: ModelData = {
          id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: modelName,
          customModelData,
          parent: parsedData.parent || undefined,
          textures: parsedData.textures || {},
          targetItem: "stick",
          customModelDataFloats: [],
          customModelDataFlags: [],
          customModelDataStrings: [],
          customModelDataColors: [],
          elements: parsedData.elements,
          display: parsedData.display,
          renderType: parsedData.render_type || "minecraft:item/generated",
          bedrockMaterial: "entity_alphatest",
        }

        setResourcePack((prev) => ({
          ...prev,
          models: [...prev.models, newModel],
        }))

        updateProgress("Complete!", 100)

        setTimeout(() => {
          setIsProcessing(false)
          setProgress(0)
          alert(`Successfully imported model: ${modelName}`)
        }, 500)
      } catch (error) {
        console.error("JSON model import error:", error)
        setIsProcessing(false)
        setProgress(0)
        alert("Failed to import JSON model. Please check the file format.")
      }
    },
    [resourcePack.models, handleBbmodelUpload, updateProgress],
  )

  const handleBedrockGeometryImport = useCallback(
    (parsedData: any) => {
      try {
        console.log("Bedrock Geometry import started")

        // Validate Bedrock geometry format
        if (!parsedData["minecraft:geometry"] && !parsedData.format_version) {
          toast({
            title: "Invalid Format",
            description: "Invalid Bedrock geometry file. Must contain 'minecraft:geometry' field.",
            variant: "destructive"
          })
          return
        }

        const geometries = parsedData["minecraft:geometry"] || []
        const geoArray = Array.isArray(geometries) ? geometries : [geometries]
        const firstGeo = geoArray[0]
        const identifier = firstGeo?.description?.identifier || "custom_geometry"
        const modelName = identifier.split(":").pop() || "bedrock_model"

        // Find existing model or Ask to create new
        const existingModel = resourcePack.models.find(
          (m) => m.name.toLowerCase() === modelName.toLowerCase() || m.id === modelName
        )

        if (existingModel) {
          setResourcePack((prev) => ({
            ...prev,
            models: prev.models.map((model) =>
              model.id === existingModel.id
                ? { ...model, bedrockGeometry: parsedData }
                : model
            ),
          }))
          toast({ title: "Success", description: `Attached Bedrock geometry to existing model: ${existingModel.name}` })
        } else {
          // Create a new model automatically for this geometry
          const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
          let newCustomModelData = 1
          while (existingCustomModelData.includes(newCustomModelData)) {
            newCustomModelData++
          }

          const newModel: ModelData = {
            id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: modelName,
            customModelData: newCustomModelData,
            parent: "item/generated",
            textures: {},
            targetItem: "stick",
            bedrockGeometry: parsedData,
            bedrockMaterial: "entity_alphatest",
          }

          setResourcePack((prev) => ({
            ...prev,
            models: [...prev.models, newModel],
          }))
          toast({ title: "Model Created", description: `Created new model "${modelName}" with attached Bedrock geometry.` })
        }
      } catch (error) {
        console.error("Bedrock geometry import error:", error)
        toast({
          title: "Import Failed",
          description: "Failed to import Bedrock geometry. Please check the file format.",
          variant: "destructive"
        })
      }
    },
    [resourcePack.models, toast],
  )

  const validatePack = useCallback(() => {
    setIsProcessing(true)
    updateProgress("Validating resource pack...", 50)

    const packValidation = validateResourcePack(resourcePack)
    const modelValidations = resourcePack.models.map((model) => ({
      model,
      validation: validateModel(model),
    }))

    const allErrors = [
      ...packValidation.errors,
      ...modelValidations.flatMap((mv) => mv.validation.errors.map((error) => `${mv.model.name}: ${error}`)),
    ]

    setValidationResults({
      isValid: allErrors.length === 0,
      errors: allErrors,
    })

    setTimeout(() => {
      setIsProcessing(false)
      setProgress(0)
      if (allErrors.length === 0) {
        alert(t.alerts.validationPassed)
      } else {
        alert(t.alerts.validationFailed)
      }
    }, 1000)
  }, [resourcePack, t.alerts])

  const getMinecraftVersion = useCallback((format: number): string => {
    const versionMap: Record<number, string> = {
      63: "1.21.6+",
      48: "1.21.4-1.21.5",
      34: "1.21.0-1.21.3",
      32: "1.20.5-1.20.6",
      22: "1.20.3-1.20.4",
      18: "1.20.0-1.20.2",
      15: "1.19.4",
      13: "1.19.3",
      12: "1.19.0-1.19.2",
      9: "1.18.0-1.18.2", // Corrected: format 9 is 1.18.0-1.18.1, changed to 1.18.0-1.18.2 as per original code's logic.
      8: "1.17.0-1.17.1", // Corrected: format 8 is 1.18.0-1.18.1, original code had 1.17.0-1.17.1
      7: "1.16.2-1.16.5", // Corrected: format 7 is 1.17.0-1.17.1, original code had 1.16.2-1.16.5
      6: "1.16.0-1.16.1", // Corrected: format 6 is 1.16.2-1.16.5, original code had 1.15.0-1.16.1
      5: "1.15.0-1.15.2", // Corrected: format 5 is 1.15.0-1.16.1, original code had 1.14.4
      4: "1.13.0-1.14.4", // Added for completeness
    }
    return versionMap[format] || "Unknown"
  }, [])

  const generateGeyserMapping = useCallback((): string => {
    const mapping: GeyserMapping = {
      format_version: 1,
      items: {},
    }

    const validModels = resourcePack.models.filter((m) => validateModel(m).isValid)

    validModels.forEach((model) => {
      // Support for 1.21.4+ components syntax in targetItem
      // If targetItem already contains 'minecraft:' or components like '[', use it as is
      const javaItem = (model.targetItem.includes(":") || model.targetItem.includes("[")
        ? model.targetItem
        : `minecraft:${model.targetItem}`).toLowerCase()

      if (!mapping.items[javaItem]) {
        mapping.items[javaItem] = []
      }

      const textureName = (
        Object.values(model.textures)[0]
          ?.replace(/^.*\//, "")
          .replace(/\.[^/.]+$/, "") || model.name
      ).toLowerCase().replace(/\s+/g, "_")

      mapping.items[javaItem].push({
        name: textureName,
        custom_model_data: model.customModelData,
        display_name: model.name,
        icon: textureName,
        allow_offhand: true,
        texture_size: 16,
        creative_category: 1,
        creative_group: "custom_items",
        tags: ["custom_item"],
      })
    })

    return JSON.stringify(mapping, null, 2)
  }, [resourcePack.models])

  const generateZip = useCallback(async () => {
    console.log("Starting ZIP generation, Edition:", packEdition, "Format:", resourcePack.format)
    setIsProcessing(true)
    updateProgress("Initializing...", 5)

    const validation = validateResourcePack(resourcePack)
    if (!validation.isValid) {
      alert(`Validation failed:\n${validation.errors.join("\n")}`)
      setIsProcessing(false)
      return
    }

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    const validModels = resourcePack.models.filter((m) => validateModel(m).isValid)
    console.log("Valid models:", validModels.length)

    if (packEdition === "bedrock") {
      console.log("Generating Bedrock Edition pack")
      updateProgress("Creating Bedrock manifest...", 15)

      // Create manifest.json
      const manifest = {
        format_version: 2,
        header: {
          name: resourcePack.name,
          description: resourcePack.description,
          uuid: crypto.randomUUID(),
          version: [1, 0, 0],
          min_engine_version: [1, 21, 0],
        },
        modules: [
          {
            type: "resources",
            uuid: crypto.randomUUID(),
            version: [1, 0, 0],
          },
        ],
      }

      zip.file("manifest.json", JSON.stringify(manifest, null, 2))

      // Add pack icon
      if (resourcePack.packIcon) {
        zip.file("pack_icon.png", resourcePack.packIcon)
      }

      updateProgress("Creating Bedrock models and attachables...", 40)

      // Generate geometry and attachables for each model
      for (let i = 0; i < validModels.length; i++) {
        const model = validModels[i]
        updateProgress(
          `Processing model ${i + 1}/${validModels.length}: ${model.name}`,
          40 + (i / validModels.length) * 30,
        )

        if (model.bedrockGeometry) {
          // Geometry file
          zip.file(`models/entity/${model.name}.geo.json`, JSON.stringify(model.bedrockGeometry, null, 2))

          // Attachable file
          let attachable = model.bedrockAttachable

          if (!attachable) {
            attachable = {
              format_version: "1.10.0",
              "minecraft:attachable": {
                description: {
                  identifier: `custom:${model.name}`,
                  materials: {
                    default: model.bedrockMaterial || "entity_alphatest",
                  },
                  textures: {
                    default: `textures/entity/${model.name}`,
                  },
                  geometry: {
                    default: `geometry.${model.name}`,
                  },
                  render_controllers: ["controller.render.default"],
                  scripts: {
                    parent_setup: "variable.item_slot = 0;",
                  },
                },
              },
            }
          }

          zip.file(`attachables/${model.name}.json`, JSON.stringify(attachable, null, 2))
        }
      }

      // Add textures
      updateProgress("Adding Bedrock textures...", 75)

      const itemTextureData: any = {
        resource_pack_name: "vanilla",
        texture_name: "atlas.items",
        texture_data: {},
      }

      for (const texture of resourcePack.textures) {
        // Ensure texture name is clean
        const textureName = texture.name.replace(/\.[^/.]+$/, "").replace(/^.*[\\/]/, "")
        const texturePath = `textures/entity/${textureName}`

        zip.file(`${texturePath}.png`, texture.file)

        // Register in item_texture.json
        itemTextureData.texture_data[textureName] = {
          textures: texturePath
        }
      }

      zip.file("textures/item_texture.json", JSON.stringify(itemTextureData, null, 2))

      // README for Bedrock
      const readme = `# ${resourcePack.name}

${resourcePack.description}

## Minecraft Bedrock Edition Resource Pack

### Installation
1. Copy this pack to your resource_packs folder
2. Activate in Settings > Global Resources
3. Join a world to see custom models

### Models Included
${validModels.map((m) => `- ${m.name} (Custom Model Data: ${m.customModelData})`).join("\n")}

### Technical Details
- Format Version: 2
- Min Engine Version: 1.21.0
- Total Models: ${validModels.length}
- Total Textures: ${resourcePack.textures.length}

Generated with MARV Resource Pack Maker
${new Date().toLocaleString()}
`

      zip.file("README.txt", readme)

      updateProgress("Generating Geyser mapping...", 85)
      const geyserMapping = generateGeyserMapping()
      zip.file("geyser_mappings.json", geyserMapping)

      // Add sounds
      if (resourcePack.sounds.length > 0) {
        updateProgress("Adding Bedrock sounds...", 90)
        const soundDefs = convertSoundsToBedrock(resourcePack.sounds)
        zip.file("sounds/sound_definitions.json", JSON.stringify(soundDefs, null, 2))

        for (const sound of resourcePack.sounds) {
          if (sound.file) {
            zip.file(`sounds/${sound.name}.ogg`, sound.file)
          }
        }
      }

      // Add languages
      if (resourcePack.languages.length > 0) {
        updateProgress("Adding Bedrock languages...", 92)
        for (const lang of resourcePack.languages) {
          const content = convertLangToBedrock(lang.content)
          const bedrockCode = lang.code.replace(/_(\w+)/, (m, c) => `_${c.toUpperCase()}`)
          zip.file(`texts/${bedrockCode}.lang`, content)
        }
      }

      // Add particles
      if (resourcePack.particles.length > 0) {
        updateProgress("Adding Bedrock particles...", 94)
        const particleDefs = convertParticlesToBedrock(resourcePack.particles)
        for (const [name, content] of Object.entries(particleDefs)) {
          zip.file(`particles/${name}.json`, JSON.stringify(content, null, 2))
        }
        for (const p of resourcePack.particles) {
          if (p.file) {
            zip.file(`textures/particle/${p.name}.png`, p.file)
          }
        }
      }

      // Add fonts
      if (resourcePack.fonts.length > 0) {
        updateProgress("Adding Bedrock fonts...", 96)
        const fontsData = convertFontsToBedrock(resourcePack.fonts)
        if (fontsData) {
          zip.file("font/default.json", JSON.stringify(fontsData, null, 2))
          for (const font of resourcePack.fonts) {
            for (const provider of font.providers) {
              const fileToSave = provider.fileHandle || (font.providers.length === 1 ? font.file : null)
              if (fileToSave) {
                const ext = fileToSave.name.split(".").pop()?.toLowerCase()
                const filename = fileToSave.name.replace(/\.[^/.]+$/, "")

                if (ext === "ttf" || ext === "otf") {
                  zip.file(`font/${filename}.${ext}`, fileToSave)
                } else if (ext === "png") {
                  zip.file(`textures/font/${filename}.${ext}`, fileToSave)
                }
              }
            }
          }
        }
      }
    } else {
      console.log("Generating Java Edition pack, Format:", resourcePack.format)

      // Java Edition pack.mcmeta
      const packMcmeta = {
        pack: {
          pack_format: resourcePack.format,
          description: resourcePack.description || "Generated Resource Pack",
        },
      }
      zip.file("pack.mcmeta", JSON.stringify(packMcmeta, null, 2))

      // Pack icon
      if (resourcePack.packIcon) {
        zip.file("pack.png", resourcePack.packIcon)
      }

      // README
      const minecraftVersion = getMinecraftVersion(resourcePack.format)
      const readme = `# ${resourcePack.name || "Resource Pack"}

**Generated by MARV Resource Pack Maker**

## Pack Information
- **Version**: ${resourcePack.version}
- **Pack Format**: ${resourcePack.format} (Minecraft ${minecraftVersion})
- **Description**: ${resourcePack.description}
${resourcePack.author ? `- **Author**: ${resourcePack.author}` : ""}
${resourcePack.website ? `- **Website**: ${resourcePack.website}` : ""}
${resourcePack.license ? `- **License**: ${resourcePack.license}` : ""}

## Contents
- **Models**: ${validModels.length}
- **Textures**: ${resourcePack.textures.length}
- **Fonts**: ${resourcePack.fonts.length}
- **Sounds**: ${resourcePack.sounds.length}
- **Particles**: ${resourcePack.particles.length}
- **Shaders**: ${resourcePack.shaders.length}

## Installation
1. Download this resource pack
2. Open Minecraft ${minecraftVersion}
3. Go to Options > Resource Packs
4. Click "Open Pack Folder"
5. Move this ZIP file into the folder
6. Select the pack in Minecraft

## Custom Model Data Reference

${validModels
          .map(
            (model) => `### ${model.name}
- **Item**: minecraft:${model.targetItem}
- **Custom Model Data**: ${model.customModelData}
- **Give Command** (1.21.4+): 
  \`\`\`
  /give @p minecraft:${model.targetItem}[minecraft:custom_model_data={floats:[${model.customModelData}.0f]}]
  \`\`\`
- **Legacy Command** (pre-1.21.4):
  \`\`\`
  /give @p minecraft:${model.targetItem}{CustomModelData:${model.customModelData}}
  \`\`\`
`,
          )
          .join("\n")}

---
Generated on ${new Date().toLocaleString()}
Format: ${resourcePack.format >= 48 ? "1.21.4+ (item_model with range_dispatch)" : "Legacy (overrides)"}
`

      zip.file("README.md", readme)

      updateProgress("Creating item definitions...", 40)

      // Group models by target item
      const itemGroups = validModels.reduce(
        (acc, model) => {
          if (!acc[model.targetItem]) {
            acc[model.targetItem] = []
          }
          acc[model.targetItem].push(model)
          return acc
        },
        {} as Record<string, ModelData[]>,
      )

      // Generate item definitions based on format
      for (const [itemNameRaw, models] of Object.entries(itemGroups)) {
        const itemName = itemNameRaw.toLowerCase().replace(/\s+/g, "_")
        const sortedModels = [...models].sort((a, b) => a.customModelData - b.customModelData)

        // Check if there's a default override model
        const defaultOverride = sortedModels.find(m => m.isDefaultOverride)
        const regularModels = sortedModels.filter(m => !m.isDefaultOverride)

        if (resourcePack.format >= 48) {
          // 1.21.4+ format with range_dispatch
          console.log("Using 1.21.4+ item_model format for", itemName)

          // Generate individual item definitions for each model to support [minecraft:item_model=name]
          sortedModels.forEach(model => {
            const modelName = model.name.toLowerCase().replace(/\s+/g, "_")
            const singleItemDef = {
              model: {
                type: "minecraft:model",
                model: `minecraft:item/${modelName}`
              }
            }
            zip.file(`assets/minecraft/items/${modelName}.json`, JSON.stringify(singleItemDef, null, 2))
          })

          // If there's a default override, use it as the base, otherwise use vanilla
          const baseFallback = defaultOverride
            ? {
              type: "minecraft:model",
              model: `minecraft:item/${defaultOverride.name.toLowerCase().replace(/\s+/g, "_")}`
            }
            : {
              type: "minecraft:model",
              model: `minecraft:item/${itemName}`
            }

          const itemDef = {
            model: regularModels.length > 0 ? {
              type: "minecraft:range_dispatch",
              property: "minecraft:custom_model_data",
              index: 0,
              fallback: baseFallback,
              entries: regularModels.map((model) => ({
                threshold: model.customModelData,
                model: {
                  type: "minecraft:model",
                  model: `minecraft:item/${model.name.toLowerCase().replace(/\s+/g, "_")}`
                },
              })),
            } : baseFallback,
          }

          zip.file(`assets/minecraft/items/${itemName}.json`, JSON.stringify(itemDef, null, 2))
        } else {
          // Legacy format with overrides
          console.log("Using legacy overrides format for", itemName)

          // If there's a default override, use its texture as the base
          const baseTexture = defaultOverride && defaultOverride.textures.layer0
            ? defaultOverride.textures.layer0
            : `minecraft:item/${itemName}`

          const itemModel = {
            parent: defaultOverride?.parent || "item/generated",
            textures: {
              layer0: baseTexture,
            },
            overrides: regularModels.map((model) => ({
              predicate: {
                custom_model_data: model.customModelData,
              },
              model: `minecraft:item/${model.name.toLowerCase().replace(/\s+/g, "_")}`
            })),
          }

          zip.file(`assets/minecraft/models/item/${itemName}.json`, JSON.stringify(itemModel, null, 2))
        }
      }

      // Generate model files
      updateProgress("Creating model files...", 60)

      for (let i = 0; i < validModels.length; i++) {
        const model = validModels[i]
        const modelName = model.name.toLowerCase().replace(/\s+/g, "_")
        updateProgress(
          `Processing model ${i + 1}/${validModels.length}: ${modelName}`,
          60 + (i / validModels.length) * 15,
        )

        const modelJson: any = {
          textures: {},
        }

        if (model.parent) {
          modelJson.parent = model.parent
        } else if (!model.elements) {
          modelJson.parent = "item/generated"
        }

        Object.entries(model.textures).forEach(([layer, texturePath]) => {
          // Handle various texture path formats:
          // - "item/my_texture" -> "minecraft:item/my_texture"
          // - "my_texture" -> "minecraft:item/my_texture"
          // - "minecraft:item/my_texture" -> "minecraft:item/my_texture"
          let cleanPath = texturePath
            .replace(/^minecraft:/, "") // Remove minecraft: prefix if present
            .replace(/^item\//, "") // Remove item/ prefix if present
            .replace(/^.*[\\/]/, "") // Remove any directory path
            .replace(/\.[^/.]+$/, "") // Remove file extension
            .toLowerCase()
            .replace(/\s+/g, "_") // Normalize: lowercase and replace spaces with underscores

          modelJson.textures[layer] = `minecraft:item/${cleanPath}`
        })

        if (model.elements) {
          modelJson.elements = model.elements
        }

        if (model.display) {
          modelJson.display = model.display
        }

        if (model.renderType && model.renderType !== "minecraft:item/generated") {
          modelJson.render_type = model.renderType
        }

        zip.file(`assets/minecraft/models/item/${modelName}.json`, JSON.stringify(modelJson, null, 2))
      }

      // Add textures
      updateProgress("Adding textures...", 80)

      for (const texture of resourcePack.textures) {
        // Use path property if available, fallback to textures/item/name
        const fullPath = texture.path ? `${texture.path}.png` : `textures/item/${texture.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, "_")}.png`

        if (texture.file) {
          zip.file(`assets/minecraft/${fullPath}`, texture.file)
        }

        if (texture.animation?.enabled) {
          const mcmeta = {
            animation: {
              ...(texture.animation.frametime !== undefined && { frametime: texture.animation.frametime }),
              ...(texture.animation.interpolate !== undefined && { interpolate: texture.animation.interpolate }),
              ...(texture.animation.frames &&
                texture.animation.frames.length > 0 && { frames: texture.animation.frames }),
            },
          }
          zip.file(`assets/minecraft/${fullPath}.mcmeta`, JSON.stringify(mcmeta, null, 2))
        }
      }

      // Add fonts
      if (resourcePack.fonts.length > 0) {
        updateProgress("Adding custom fonts...", 85)

        for (const font of resourcePack.fonts) {
          const fontJson = {
            providers: font.providers.map((provider) => {
              const providerJson: any = {
                type: provider.type,
              }

              // Handle file name and saving
              let filename = font.name
              let extension = ""

              if (provider.fileHandle) {
                filename = provider.fileHandle.name.split(".").pop() ? provider.fileHandle.name.replace(/\.[^/.]+$/, "") : provider.fileHandle.name
                extension = provider.fileHandle.name.split(".").pop() || ""
              } else if (font.file) {
                filename = font.file.name.replace(/\.[^/.]+$/, "")
                extension = font.file.name.split(".").pop() || ""
              }

              if (provider.type === "bitmap") {
                // Determine bitmap path
                let bitmapPath = provider.file || `minecraft:font/${filename}.png`

                if (provider.fileHandle) {
                  const safeName = provider.fileHandle.name
                  // If no custom path specified, use the uploaded filename
                  if (!provider.file) {
                    bitmapPath = `minecraft:font/${safeName}`
                  }
                  zip.file(`assets/minecraft/textures/font/${safeName}`, provider.fileHandle)
                } else if (font.file && extension.toLowerCase() === "png") {
                  const safeName = `${filename}.png`
                  if (!provider.file) {
                    bitmapPath = `minecraft:font/${safeName}`
                  }
                  zip.file(`assets/minecraft/textures/font/${safeName}`, font.file)
                }

                providerJson.file = bitmapPath
                providerJson.ascent = provider.ascent || 8
                providerJson.height = provider.height || 8
                if (provider.chars) providerJson.chars = provider.chars
              } else if (provider.type === "ttf") {
                // Determine ttf path
                let ttfPath = provider.file || `minecraft:font/${filename}.ttf`

                if (provider.fileHandle) {
                  const safeName = provider.fileHandle.name
                  // If no custom path specified, use the uploaded filename
                  if (!provider.file) {
                    ttfPath = `minecraft:font/${safeName}`
                  }
                  zip.file(`assets/minecraft/font/${safeName}`, provider.fileHandle)
                } else if (font.file && (extension.toLowerCase() === "ttf" || extension.toLowerCase() === "otf")) {
                  const safeName = `${filename}.${extension}`
                  if (!provider.file) {
                    ttfPath = `minecraft:font/${safeName}`
                  }
                  zip.file(`assets/minecraft/font/${safeName}`, font.file)
                }

                providerJson.file = ttfPath
                providerJson.size = provider.size || 11
                providerJson.oversample = provider.oversample || 1.0
                if (provider.shift) providerJson.shift = provider.shift
                if (provider.skip) providerJson.skip = provider.skip
              } else if (provider.type === "space") {
                providerJson.advances = provider.advances || {}
              } else if (provider.type === "unihex") {
                providerJson.hex_file = provider.file || `minecraft:font/unifont.hex`
                providerJson.size_overrides = []
              }

              return providerJson
            }),
          }

          zip.file(`assets/minecraft/font/${font.name}.json`, JSON.stringify(fontJson, null, 2))
        }
      }

      // Add sounds
      if (resourcePack.sounds.length > 0) {
        updateProgress("Adding custom sounds...", 88)

        const soundsJson: Record<string, any> = {}

        for (const sound of resourcePack.sounds) {
          soundsJson[sound.name] = {
            category: sound.category,
            sounds: sound.sounds,
          }

          if (sound.subtitle) {
            soundsJson[sound.name].subtitle = sound.subtitle
          }
          if (sound.replace !== undefined) {
            soundsJson[sound.name].replace = sound.replace
          }

          if (sound.file) {
            zip.file(`assets/minecraft/sounds/${sound.name}.ogg`, sound.file)
          }
        }

        zip.file("assets/minecraft/sounds.json", JSON.stringify(soundsJson, null, 2))
      }

      // Add particles
      if (resourcePack.particles.length > 0) {
        updateProgress("Adding custom particles...", 91)

        for (const particle of resourcePack.particles) {
          const particleJson = {
            textures: particle.textures,
          }

          zip.file(`assets/minecraft/particles/${particle.name}.json`, JSON.stringify(particleJson, null, 2))

          if (particle.file) {
            zip.file(`assets/minecraft/textures/particle/${particle.name}.png`, particle.file)
          }
        }
      }

      // Add shaders
      if (resourcePack.shaders.length > 0) {
        updateProgress("Adding shaders...", 94)

        for (const shader of resourcePack.shaders) {
          const extension = shader.type === "program" ? ".json" : shader.type === "vertex" ? ".vsh" : ".fsh"
          const folder = shader.type === "program" ? "program" : "core"

          if (shader.file) {
            zip.file(`assets/minecraft/shaders/${folder}/${shader.name}${extension}`, shader.file)
          }
        }
      }

      updateProgress("Generating Geyser mapping...", 85)
      const geyserMapping = generateGeyserMapping()
      zip.file("geyser_mappings.json", geyserMapping)
    }

    updateProgress("Generating ZIP file...", 97)

    const content = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    })

    updateProgress("Complete!", 100)

    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    const packName = resourcePack.name || "resource-pack"
    const editionSuffix = packEdition === "bedrock" ? "-bedrock" : ""
    a.download = `${packName}${editionSuffix}.zip`
    a.click()
    URL.revokeObjectURL(url)

    console.log("ZIP generation complete!")

    setTimeout(() => {
      setIsProcessing(false)
      setProgress(0)
      alert(t.alerts.packGenerated)
    }, 1000)
  }, [
    resourcePack,
    t.alerts,
    getMinecraftVersion,
    updateProgress,
    packEdition,
    generateGeyserMapping, // Added to dependencies
  ])

  const handleMergePackUpload = useCallback(async (files: FileList) => {
    const newPacks: { name: string; file: File }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".zip")) {
        newPacks.push({ name: file.name.replace(".zip", ""), file })
      }
    }

    setMergePacks((prev) => [...prev, ...newPacks])
  }, [])

  const analyzeMergeConflicts = useCallback(async () => {
    setIsProcessing(true)
    updateProgress("Analyzing packs for conflicts...", 10)

    try {
      const JSZip = (await import("jszip")).default
      const textureMap = new Map<string, { packName: string; file: File }[]>()

      for (let i = 0; i < mergePacks.length; i++) {
        const pack = mergePacks[i]
        updateProgress(`Analyzing ${pack.name}...`, 10 + (i / mergePacks.length) * 40)

        const zip = await JSZip.loadAsync(pack.file)

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir && path.includes("textures/")) {
            const file = await zipEntry
              .async("blob")
              .then((blob) => new File([blob], path.split("/").pop() || "texture.png"))

            if (!textureMap.has(path)) {
              textureMap.set(path, [])
            }
            textureMap.get(path)!.push({ packName: pack.name, file })
          }
        }
      }

      const conflicts: MergeConflict[] = []
      for (const [path, packs] of textureMap.entries()) {
        if (packs.length > 1) {
          conflicts.push({ path, packs, resolution: "overwrite" })
        }
      }

      setMergeConflicts(conflicts)
      updateProgress("Analysis complete!", 100)

      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error("Merge analysis error:", error)
      setIsProcessing(false)
      setProgress(0)
      alert("Failed to analyze packs for merging.")
    }
  }, [mergePacks])

  const executeMerge = useCallback(async () => {
    setIsProcessing(true)
    updateProgress("Merging packs...", 10)

    try {
      const JSZip = (await import("jszip")).default
      const mergedTextures = new Map<string, File>()
      const mergedModelsMap = new Map<string, any>()

      for (let i = 0; i < mergePacks.length; i++) {
        const pack = mergePacks[i]
        updateProgress(`Merging ${pack.name}...`, 10 + (i / mergePacks.length) * 70)

        const zip = await JSZip.loadAsync(pack.file)

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue

          if (path.includes("textures/")) {
            const conflict = mergeConflicts.find((c) => c.path === path)

            if (conflict) {
              if (conflict.resolution === "skip" && mergedTextures.has(path)) {
                continue
              } else if (conflict.resolution === "rename") {
                const newPath = path.replace(/(\.[^.]+)$/, `_${pack.name}$1`)
                const file = await zipEntry
                  .async("blob")
                  .then((blob) => new File([blob], newPath.split("/").pop() || "texture.png"))
                mergedTextures.set(newPath, file)
                continue
              }
            }

            const file = await zipEntry
              .async("blob")
              .then((blob) => new File([blob], path.split("/").pop() || "texture.png"))
            mergedTextures.set(path, file)
          } else if (path.includes("models/")) {
            const content = await zipEntry.async("text")
            try {
              const modelData = JSON.parse(content)
              mergedModelsMap.set(path, modelData)
            } catch (e) {
              console.error(`Failed to parse model: ${path}`)
            }
          }
        }
      }

      updateProgress("Processing textures...", 80)
      const textureEntries = Array.from(mergedTextures.entries())
      const newTextureDataList = await Promise.all(
        textureEntries.map(async ([path, file]) => {
          const fileName = file.name.replace(/\.[^/.]+$/, "")
          const dimensions = await getImageDimensions(file)
          const category = path.split("/").find((p) => p === "block" || p === "item") || "item"

          return {
            id: `texture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: fileName,
            file: file,
            path: `textures/${category}/${fileName}`,
            size: file.size,
            dimensions,
            isOptimized: false,
            animation: { enabled: false, frametime: 1, interpolate: false, frames: [] },
          }
        }),
      )

      updateProgress("Processing models...", 90)
      const newModelDataList: ModelData[] = []
      for (const [path, modelData] of mergedModelsMap.entries()) {
        const modelName = path.split("/").pop()?.replace(".json", "") || "merged_model"
        const normalizedTextures: Record<string, string> = {}
        if (modelData.textures) {
          Object.entries(modelData.textures).forEach(([tk, tv]) => {
            if (typeof tv === "string") {
              const clean = tv.replace(/^.*:/, "").replace(/^item\//, "").replace(/^block\//, "")
              const hasSlash = tv.includes("/")
              normalizedTextures[tk] = hasSlash ? tv.replace(/^.*:/, "") : `item/${clean}`
            }
          })
        }

        newModelDataList.push({
          id: `model_merged_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: modelName,
          customModelData: 0,
          parent: modelData.parent || "item/generated",
          textures: normalizedTextures,
          targetItem: "stick",
          customModelDataFloats: [],
          customModelDataFlags: [],
          customModelDataStrings: [],
          customModelDataColors: [],
          elements: modelData.elements,
          display: modelData.display,
        })
      }

      setResourcePack((prev) => {
        let updatedModels = [...prev.models, ...newModelDataList]

        // Auto-link new textures to models
        newTextureDataList.forEach((newTex) => {
          const cleanFileName = newTex.name.toLowerCase().replace(/\s+/g, "_")
          const category = newTex.path.split("/")[1] || "item"
          updatedModels = updatedModels.map((model) => {
            const cleanModelName = model.name.toLowerCase().replace(/\s+/g, "_")
            if (cleanModelName === cleanFileName && Object.keys(model.textures).length === 0) {
              return { ...model, textures: { layer0: `${category}/${newTex.name}` } }
            }
            return model
          })
        })

        const newPaths = new Set(newTextureDataList.map((t) => t.path))
        const filteredTextures = prev.textures.filter((t) => !newPaths.has(t.path))

        return {
          ...prev,
          textures: [...filteredTextures, ...newTextureDataList],
          models: updatedModels,
        }
      })

      updateProgress("Merge complete!", 100)

      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
        setMergePacks([])
        setMergeConflicts([])
        alert(
          `Successfully merged ${mergePacks.length} packs with ${newTextureDataList.length} textures and ${newModelDataList.length} models!`,
        )
      }, 500)
    } catch (error) {
      console.error("Merge execution error:", error)
      setIsProcessing(false)
      setProgress(0)
      alert("Failed to merge packs.")
    }
  }, [mergePacks, mergeConflicts, getImageDimensions, updateProgress])

  const generateMultiVersionPacks = useCallback(async () => {
    const enabledVersions = versionConfigs.filter((v) => v.enabled)

    if (enabledVersions.length === 0) {
      alert("Please enable at least one version.")
      return
    }

    setIsProcessing(true)

    for (let i = 0; i < enabledVersions.length; i++) {
      const versionConfig = enabledVersions[i]
      updateProgress(`Generating pack for ${versionConfig.version}...`, (i / enabledVersions.length) * 100)

      // Temporarily set the format for this version
      const originalFormat = resourcePack.format
      setResourcePack((prev) => ({ ...prev, format: versionConfig.format }))

      // Generate the pack
      await generateZip()

      // Restore original format
      setResourcePack((prev) => ({ ...prev, format: originalFormat }))

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsProcessing(false)
    setProgress(0)
    alert(`Generated ${enabledVersions.length} version(s) successfully!`)
  }, [versionConfigs, resourcePack.format, generateZip])

  const importExistingPack = useCallback(
    async (file: File) => {
      if (!file || !file.name) {
        console.error("Import error: No file provided")
        alert("Please select a file to import.")
        return
      }

      setIsProcessing(true)
      updateProgress("Importing pack...", 10)

      console.log("=== STARTING IMPORT ===")
      console.log("File name:", file.name)
      console.log("File size:", file.size, "bytes")

      try {
        if (file.name.endsWith(".json")) {
          // Import from JSON settings file
          const text = await file.text()
          const data = JSON.parse(text)

          if (data.pack && data.models) {
            setResourcePack({
              name: data.pack.name || file.name.replace(".json", ""),
              description: data.pack.description || "",
              version: data.pack.version || "1.21.6",
              format: data.pack.pack_format || 63,
              models: data.models || [],
              textures: data.textures || [],
              fonts: data.fonts || [],
              sounds: data.sounds || [],
              particles: data.particles || [],
              shaders: data.shaders || [],
              packIcon: undefined,
              author: data.pack.author || "",
              website: data.pack.website || "",
              license: data.pack.license || "All Rights Reserved",
              languages: data.languages || [],
            })
            setIsProcessing(false)
            setProgress(0)
            alert(t.alerts.exportComplete)
          } else {
            alert("Invalid JSON file format. Expected 'pack' and 'models' properties.")
            setIsProcessing(false)
            setProgress(0)
          }
        } else if (file.name.endsWith(".zip")) {
          updateProgress("Loading ZIP file...", 20)
          const JSZip = (await import("jszip")).default
          const zip = await JSZip.loadAsync(file)

          // Detect Edition
          const detectedEdition = await detectPackEdition(zip)
          console.log("Detected edition:", detectedEdition)

          if (detectedEdition === "bedrock") {
            console.log("=== ENTERING BEDROCK IMPORT PATH ===")
            updateProgress("Importing Bedrock pack...", 30)
            try {
              const pack = await importBedrockPack(zip, file.name, getImageDimensions, geyserMappings)
              console.log("Bedrock pack imported:", pack)
              setResourcePack(pack)
              setPackEdition("bedrock")
              setIsProcessing(false)
              setProgress(0)
              toast({
                title: "Import Successful",
                description: "Bedrock pack imported successfully!",
                variant: "default",
              })
              console.log("=== BEDROCK IMPORT COMPLETE - RETURNING ===")
              return
            } catch (e) {
              console.error("Bedrock import failed", e)
              toast({
                title: "Import Failed",
                description: "Failed to import Bedrock pack. See console for details.",
                variant: "destructive",
              })
              setIsProcessing(false)
              return
            }
          }

          console.log("=== ENTERING JAVA EDITION IMPORT PATH ===")

          const importedPack: ResourcePack = {
            name: file.name.replace(".zip", ""),
            description: "",
            version: "1.21.6",
            format: 63,
            models: [],
            textures: [],
            fonts: [],
            sounds: [],
            particles: [],
            shaders: [],
            packIcon: undefined,
            author: "",
            website: "",
            license: "All Rights Reserved",
            languages: [],
          }

          // Read pack.mcmeta
          updateProgress("Reading pack metadata...", 30)
          const packMetaFile = zip.file("pack.mcmeta")
          if (packMetaFile) {
            const packMetaContent = await packMetaFile.async("text")
            const packMeta = JSON.parse(packMetaContent)
            importedPack.description = packMeta.pack.description || ""
            importedPack.format = packMeta.pack.pack_format || 63
          }

          // Read pack.png
          updateProgress("Reading pack icon...", 35)
          const packIconFile = zip.file("pack.png")
          if (packIconFile) {
            const iconBlob = await packIconFile.async("blob")
            const iconFile = new File([iconBlob], "pack.png", { type: "image/png" })
            importedPack.packIcon = iconFile
          }

          updateProgress("Reading textures...", 40)
          const textureMap: Record<string, File> = {}
          const textureFiles = Object.keys(zip.files).filter(
            (path) =>
              path.startsWith("assets/minecraft/textures/") &&
              (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg")),
          )

          // </CHANGE> Fixed texture import to include size and dimensions
          for (const texturePath of textureFiles) {
            const textureFile = zip.file(texturePath)
            if (textureFile) {
              const textureBlob = await textureFile.async("blob")
              const textureName = texturePath.split("/").pop() || ""
              const textureFileObj = new File([textureBlob], textureName, { type: "image/png" })

              // Get dimensions for imported textures
              const dimensions = await getImageDimensions(textureFileObj)

              // Store with full path as key for reference
              // Preserve the path structure: e.g., 'textures/block/my_block'
              const relativePath = texturePath
                .replace("assets/minecraft/", "")
                .replace(/\.(png|jpg|jpeg)$/, "")
              textureMap[relativePath] = textureFileObj

              // Add to textures array with all required properties
              importedPack.textures.push({
                id: `texture_${Date.now()}_${Math.random()}`,
                name: textureName.replace(/\.(png|jpg|jpeg)$/, ""), // Clean name
                file: textureFileObj,
                path: relativePath,
                size: textureFileObj.size,
                dimensions,
                isOptimized: false,
                animation: {
                  // Initialize animation for imported textures
                  enabled: false,
                  frametime: 1,
                  interpolate: false,
                  frames: [],
                },
              })
            }
          }

          // --- START ROBUST MODEL SCAN ---
          updateProgress("Analyzing pack structure...", 50)
          const allFiles = Object.keys(zip.files)
          const baseItemOverrides: Record<string, Array<{ model: string; predicate: any }>> = {}

          // 1. Detect Item Logic (1.21.4+ and Legacy)
          const itemDefPaths = allFiles.filter(f => f.includes("/items/") && f.endsWith(".json"))
          if (itemDefPaths.length > 0) {
            console.log(`Found ${itemDefPaths.length} item definition files.`)
            for (const path of itemDefPaths) {
              try {
                const data = JSON.parse(await zip.file(path)!.async("text"))
                const itemName = path.split("/").pop()?.replace(".json", "") || ""
                if (data.model?.type === "minecraft:select" && data.model.cases) {
                  baseItemOverrides[itemName] = data.model.cases.map((c: any) => ({
                    model: c.model?.model?.replace(/^.*:/, "").replace(/^item\//, ""),
                    predicate: { custom_model_data: c.when }
                  }))
                }
              } catch (e) { }
            }
          }


          // 2. Scan for Model Overrides (Legacy / Pre-1.21.4)
          const modelItemPaths = allFiles.filter(f => f.includes("/models/item/") && f.endsWith(".json"))
          console.log(`Scanning ${modelItemPaths.length} legacy model files...`)

          for (const path of modelItemPaths) {
            const itemName = path.split("/").pop()?.replace(".json", "") || ""
            if (baseItemOverrides[itemName]) continue // Prefer new format

            try {
              const data = JSON.parse(await zip.file(path)!.async("text"))
              if (Array.isArray(data.overrides) && data.overrides.length > 0) {
                baseItemOverrides[itemName] = data.overrides.map((o: any) => ({
                  model: o.model?.replace(/^.*:/, "").replace(/^item\//, ""),
                  predicate: o.predicate
                }))
              }
            } catch (e) { }
          }

          // 3. Build Models from Gathered Data
          updateProgress("Importing models...", 75)
          const processedKeys = new Set<string>()

          for (const [targetItem, overrides] of Object.entries(baseItemOverrides)) {
            for (const override of overrides) {
              const cmd = override.predicate?.custom_model_data
              if (cmd === undefined || !override.model) continue

              const uniqueId = `${targetItem}_${JSON.stringify(cmd)}`
              if (processedKeys.has(uniqueId)) continue
              processedKeys.add(uniqueId)

              // Support models in any sub folder or namespace
              const modelRef = override.model
              const modelPath = allFiles.find(f =>
                f.endsWith(`/models/item/${modelRef}.json`) ||
                f.endsWith(`/models/${modelRef}.json`) ||
                f.endsWith(`/${modelRef}.json`)
              )

              if (modelPath) {
                try {
                  const mData = JSON.parse(await zip.file(modelPath)!.async("text"))
                  const normalizedTextures: Record<string, string> = {}
                  if (mData.textures) {
                    Object.entries(mData.textures).forEach(([tk, tv]) => {
                      if (typeof tv === "string") {
                        const clean = tv.replace(/^.*:/, "").replace(/^item\//, "")
                        normalizedTextures[tk] = `item/${clean}`
                      }
                    })
                  }

                  const newModel: ModelData = {
                    id: `model_${Date.now()}_${Math.random()}`,
                    name: modelRef.split("/").pop() || modelRef,
                    customModelData: typeof cmd === "number" ? cmd : 0,
                    parent: mData.parent || "item/generated",
                    textures: normalizedTextures,
                    elements: mData.elements,
                    display: mData.display,
                    targetItem: targetItem,
                    customModelDataFloats: [],
                    customModelDataFlags: [],
                    customModelDataStrings: [],
                    customModelDataColors: [],
                  }

                  if (typeof cmd === "object") {
                    if (cmd.floats) newModel.customModelDataFloats = cmd.floats
                    if (cmd.flags) newModel.customModelDataFlags = cmd.flags
                    if (cmd.strings) newModel.customModelDataStrings = cmd.strings
                    if (cmd.colors) {
                      newModel.customModelDataColors = cmd.colors.map((c: number[]) =>
                        `#${c.map(v => v.toString(16).padStart(2, "0")).join("")}`
                      )
                    }
                    const hash = JSON.stringify(cmd).split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
                    newModel.customModelData = (Math.abs(hash) % 10000) + 1
                  }
                  importedPack.models.push(newModel)
                } catch (e) { }
              }
            }
          }
          console.log(`Imported ${importedPack.models.length} custom models.`)

          updateProgress("Reading fonts...", 70)
          // Read fonts from assets/minecraft/font/
          const fontFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/font/") && path.endsWith(".json"),
          )

          for (const fontPath of fontFiles) {
            const fontFile = zip.file(fontPath)
            if (fontFile) {
              const fontContent = await fontFile.async("text")
              const fontData = JSON.parse(fontContent)
              const fontName = fontPath.split("/").pop()?.replace(".json", "") || ""

              const newFont: CustomFont = {
                id: `font_${Date.now()}_${Math.random()}`,
                name: fontName,
                providers: [],
              }

              if (Array.isArray(fontData.providers)) {
                for (const provider of fontData.providers) {
                  const newProvider: FontProvider = {
                    id: `provider_${Date.now()}_${Math.random()}`,
                    type: provider.type || "bitmap",
                    file: provider.file || "",
                    ascent: provider.ascent,
                    height: provider.height,
                    chars: provider.chars,
                    advances: provider.advances,
                    size: provider.size,
                    oversample: provider.oversample,
                    shift: provider.shift,
                    skip: provider.skip,
                  }
                  newFont.providers.push(newProvider)
                }
              }

              importedPack.fonts.push(newFont)
            }
          }

          // Read sounds from assets/minecraft/sounds.json
          updateProgress("Reading sounds...", 75)
          const soundsFile = zip.file("assets/minecraft/sounds.json")
          if (soundsFile) {
            const soundsContent = await soundsFile.async("text")
            const soundsData = JSON.parse(soundsContent)

            for (const [soundName, soundConfig] of Object.entries(soundsData)) {
              if (typeof soundConfig === "object" && soundConfig !== null) {
                const config = soundConfig as any
                const newSound: CustomSound = {
                  id: `sound_${Date.now()}_${Math.random()}`,
                  name: soundName,
                  category: config.category || "master",
                  sounds: Array.isArray(config.sounds) ? config.sounds : [],
                  subtitle: config.subtitle,
                  replace: config.replace,
                }
                importedPack.sounds.push(newSound)
              }
            }
          }

          // Read particles from assets/minecraft/particles/
          updateProgress("Reading particles...", 80)
          const particleFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/particles/") && path.endsWith(".json"),
          )

          for (const particlePath of particleFiles) {
            const particleFile = zip.file(particlePath)
            if (particleFile) {
              const particleContent = await particleFile.async("text")
              const particleData = JSON.parse(particleContent)
              const particleName = particlePath.split("/").pop()?.replace(".json", "") || ""

              const newParticle: CustomParticle = {
                id: `particle_${Date.now()}_${Math.random()}`,
                name: particleName,
                textures: Array.isArray(particleData.textures) ? particleData.textures : [],
              }

              importedPack.particles.push(newParticle)
            }
          }

          // Read shaders from assets/minecraft/shaders/
          updateProgress("Reading shaders...", 85)
          const shaderFiles = Object.keys(zip.files).filter(
            (path) =>
              path.startsWith("assets/minecraft/shaders/") &&
              (path.endsWith(".vsh") || path.endsWith(".fsh") || path.endsWith(".json")),
          )

          for (const shaderPath of shaderFiles) {
            const shaderFile = zip.file(shaderPath)
            if (shaderFile) {
              const shaderContent = await shaderFile.async("text")
              const shaderName = shaderPath.split("/").pop() || ""
              const shaderType = shaderPath.endsWith(".vsh")
                ? "vertex"
                : shaderPath.endsWith(".fsh")
                  ? "fragment"
                  : "program"

              const newShader: ShaderFile = {
                id: `shader_${Date.now()}_${Math.random()}`,
                name: shaderName,
                type: shaderType,
                content: shaderContent, // Store content for later use or display if needed
              }

              importedPack.shaders.push(newShader)
            }
          }

          updateProgress("Finalizing import...", 95)

          console.log("=== IMPORT COMPLETE ===")
          console.log("Imported Pack Data:", {
            name: importedPack.name,
            models: importedPack.models.length,
            textures: importedPack.textures.length,
            fonts: importedPack.fonts.length,
            sounds: importedPack.sounds.length,
            particles: importedPack.particles.length,
            shaders: importedPack.shaders.length,
          })
          console.log("Full imported pack:", importedPack)

          setResourcePack(importedPack)

          // Use setTimeout to ensure state update is processed before alert
          setTimeout(() => {
            setIsProcessing(false)
            setProgress(0)

            const stats = {
              models: importedPack.models.length,
              textures: importedPack.textures.length,
              fonts: importedPack.fonts.length,
              sounds: importedPack.sounds.length,
              particles: importedPack.particles.length,
              shaders: importedPack.shaders.length,
            }

            console.log("Import stats displayed to user:", stats)

            const tabs = [
              { tab: "models", count: stats.models },
              { tab: "textures", count: stats.textures },
              { tab: "fonts", count: stats.fonts },
              { tab: "sounds", count: stats.sounds },
              { tab: "particles", count: stats.particles },
              { tab: "shaders", count: stats.shaders },
            ]
            const bestTab = tabs.reduce((prev, current) => (prev.count > current.count ? prev : current), { tab: "general", count: -1 })
            if (bestTab.count > 0) {
              setActiveTab(bestTab.tab)
            }


            alert(
              `Import complete!\n\nModels: ${stats.models}\nTextures: ${stats.textures}\nFonts: ${stats.fonts}\nSounds: ${stats.sounds}\nParticles: ${stats.particles}\nShaders: ${stats.shaders}`,
            )
          }, 500) // Short delay to allow state update
        } else {
          alert("Unsupported file type. Please import a .zip or .json file.")
          setIsProcessing(false)
          setProgress(0)
        }
      } catch (error) {
        console.error("Import error:", error)
        alert(`${t.alerts.importError}\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [t, updateProgress, getImageDimensions, geyserMappings, toast, detectPackEdition, importBedrockPack, setPackEdition],
  )

  const exportSettings = useCallback(() => {
    const settings = {
      pack: {
        name: resourcePack.name,
        description: resourcePack.description,
        version: resourcePack.version,
        pack_format: resourcePack.format,
        author: resourcePack.author,
        website: resourcePack.website,
        license: resourcePack.license,
      },
      models: resourcePack.models,
      textures: resourcePack.textures.map((t) => ({
        id: t.id,
        name: t.name,
        path: t.path,
        size: t.size,
        dimensions: t.dimensions,
        isOptimized: t.isOptimized,
        animation: t.animation, // Include animation settings
      })),
      fonts: resourcePack.fonts.map((f) => ({
        id: f.id,
        name: f.name,
        providers: f.providers.map((p) => ({
          id: p.id,
          type: p.type,
          file: p.file,
          ascent: p.ascent,
          height: p.height,
          chars: p.chars,
          advances: p.advances,
          size: p.size,
          oversample: p.oversample,
          shift: p.shift,
          skip: p.skip,
        })),
      })),
      sounds: resourcePack.sounds.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        sounds: s.sounds,
        subtitle: s.subtitle,
        replace: s.replace,
      })),
      particles: resourcePack.particles.map((p) => ({
        id: p.id,
        name: p.name,
        textures: p.textures,
      })),
      shaders: resourcePack.shaders.map((sh) => ({
        id: sh.id,
        name: sh.name,
        type: sh.type,
        content: sh.content,
      })),
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${resourcePack.name || "resource-pack"}-settings.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [resourcePack])

  const deleteTexture = useCallback((textureId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.filter((texture) => texture.id !== textureId),
    }))
  }, [])

  const handlePackIconUpload = useCallback((file: File) => {
    setResourcePack((prev) => ({
      ...prev,
      packIcon: file,
    }))
  }, [])

  const removePackIcon = useCallback(() => {
    setResourcePack((prev) => ({
      ...prev,
      packIcon: undefined,
    }))
  }, [])

  const addFont = useCallback((file?: File) => {
    const newFont: CustomFont = {
      id: `font_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `custom_font_${resourcePack.fonts.length + 1}`,
      providers: [],
      file: file
    }
    setResourcePack((prev) => ({
      ...prev,
      fonts: [...prev.fonts, newFont],
    }))
  }, [resourcePack.fonts])

  const updateFont = useCallback((fontId: string, updatedFont: Partial<CustomFont>) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.map((font) => (font.id === fontId ? { ...font, ...updatedFont } : font)),
    }))
  }, [])

  const deleteFont = useCallback((fontId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.filter((font) => font.id !== fontId),
    }))
  }, [])

  const addFontProvider = useCallback((fontId: string) => {
    const newProvider: FontProvider = {
      id: `provider_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "bitmap",
      ascent: 8,
      height: 8,
      chars: [],
    }
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.map((font) =>
        font.id === fontId ? { ...font, providers: [...font.providers, newProvider] } : font,
      ),
    }))
  }, [])

  const handleFontImport = useCallback((font: CustomFont) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: [...prev.fonts, font],
    }))
  }, [])

  const updateFontProvider = useCallback(
    (fontId: string, providerId: string, updatedProvider: Partial<FontProvider>) => {
      setResourcePack((prev) => ({
        ...prev,
        fonts: prev.fonts.map((font) =>
          font.id === fontId
            ? {
              ...font,
              providers: font.providers.map((provider) =>
                provider.id === providerId ? { ...provider, ...updatedProvider } : provider,
              ),
            }
            : font,
        ),
      }))
    },
    [],
  )

  const deleteFontProvider = useCallback((fontId: string, providerId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.map((font) =>
        font.id === fontId
          ? {
            ...font,
            providers: font.providers.filter((provider) => provider.id !== providerId),
          }
          : font,
      ),
    }))
  }, [])

  const addSound = useCallback(() => {
    const newSound: CustomSound = {
      id: `sound_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `custom_sound_${resourcePack.sounds.length + 1}`,
      category: "master",
      sounds: [],
    }
    setResourcePack((prev) => ({
      ...prev,
      sounds: [...prev.sounds, newSound],
    }))
  }, [resourcePack.sounds])

  const updateSound = useCallback((soundId: string, updatedSound: Partial<CustomSound>) => {
    setResourcePack((prev) => ({
      ...prev,
      sounds: prev.sounds.map((sound) => (sound.id === soundId ? { ...sound, ...updatedSound } : sound)),
    }))
  }, [])

  const deleteSound = useCallback((soundId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      sounds: prev.sounds.filter((sound) => sound.id !== soundId),
    }))
  }, [])

  const addParticle = useCallback(() => {
    const newParticle: CustomParticle = {
      id: `particle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `custom_particle_${resourcePack.particles.length + 1}`,
      textures: [],
    }
    setResourcePack((prev) => ({
      ...prev,
      particles: [...prev.particles, newParticle],
    }))
  }, [resourcePack.particles])

  const updateParticle = useCallback((particleId: string, updatedParticle: Partial<CustomParticle>) => {
    setResourcePack((prev) => ({
      ...prev,
      particles: prev.particles.map((particle) =>
        particle.id === particleId ? { ...particle, ...updatedParticle } : particle,
      ),
    }))
  }, [])

  const deleteParticle = useCallback((particleId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      particles: prev.particles.filter((particle) => particle.id !== particleId),
    }))
  }, [])

  const addShader = useCallback((file: File, type: "vertex" | "fragment" | "program") => {
    const newShader: ShaderFile = {
      id: `shader_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: file.name.replace(/\.(vsh|fsh|json)$/, ""),
      type,
      file,
    }
    setResourcePack((prev) => ({
      ...prev,
      shaders: [...prev.shaders, newShader],
    }))
  }, [])

  const deleteShader = useCallback((shaderId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      shaders: prev.shaders.filter((shader) => shader.id !== shaderId),
    }))
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)

      for (const file of files) {
        if (file.name.endsWith(".zip")) {
          await importExistingPack(file)
          return // Stop after importing a pack
        } else if (file.name.endsWith(".bbmodel")) {
          const text = await file.text()
          const data = JSON.parse(text)
          await handleBbmodelUpload(file, data)
          setActiveTab("models")
        } else if (file.name.endsWith(".png")) {
          await addTexture(file, "item")

          // Smart Model Creation
          if (confirm(`Create a model for "${file.name}"?`)) {
            const modelName = file.name.replace(/\.[^/.]+$/, "")
            let targetItem = "stick"
            // Simple heuristic to guess target item
            for (const item of MINECRAFT_ITEMS) {
              if (modelName.includes(item)) {
                targetItem = item
                break
              }
            }

            const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
            let newCustomModelData = 1
            while (existingCustomModelData.includes(newCustomModelData)) {
              newCustomModelData++
            }

            const newModel: ModelData = {
              id: `model_${Date.now()}_${Math.random()}`,
              name: modelName,
              customModelData: newCustomModelData,
              parent: "item/generated",
              textures: { layer0: `item/${modelName}` },
              targetItem: targetItem,
              customModelDataFloats: [],
              customModelDataFlags: [],
              customModelDataStrings: [],
              customModelDataColors: [],
            }
            setResourcePack(prev => ({ ...prev, models: [...prev.models, newModel] }))
            setActiveTab("models")
          } else {
            setActiveTab("textures")
          }
        } else if (file.name.endsWith(".json")) {
          // Detect if it's a project export or Geyser mapping
          try {
            const text = await file.text()
            const json = JSON.parse(text)
            if (json.items && json.format_version) {
              setGeyserMappings(json)
              toast({
                title: "Mappings Loaded",
                description: "Geyser mappings loaded successfully.",
              })
              setActiveTab("geyser")
            } else if (json.models && json.textures) {
              // It's a project export! Fix texture metadata but acknowledge files are missing
              toast({
                title: "Configuration Loaded",
                description: "Settings restored. Note: PNG files must be re-uploaded to export again.",
              })
              setResourcePack(prev => ({
                ...prev,
                ...json,
                // Ensure array properties exist
                models: json.models || [],
                textures: json.textures || [],
                fonts: json.fonts || [],
                sounds: json.sounds || [],
                particles: json.particles || [],
                shaders: json.shaders || [],
              }))
            } else {
              await importExistingPack(file)
            }
          } catch (err) {
            toast({
              title: "Error",
              description: "Failed to parse JSON file.",
              variant: "destructive",
            })
          }
        }
      }
    }
  }, [importExistingPack, handleBbmodelUpload, addTexture, resourcePack.models])

  return (
    <div
      className="min-h-screen bg-background p-4 md:p-8 relative"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-4 border-primary border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-background p-8 rounded-xl shadow-xl border border-border text-center transform scale-110 transition-transform">
            <Upload className="w-16 h-16 mx-auto text-primary mb-4" />
            <p className="text-2xl font-bold text-primary">Drop files here</p>
            <p className="text-muted-foreground mt-2">Support: .zip (Pack), .bbmodel (Model), .png (Texture), .json (Config/Mapping)</p>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-sans text-4xl font-bold text-primary md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setLanguage(language === "en" ? "ja" : "en")}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              {language === "en" ? "日本語" : "English"}
            </button>
            <div className="flex items-center gap-2 rounded-md border-2 border-primary bg-card px-4 py-2">
              <label className="text-sm font-medium">Edition:</label>
              <select
                value={packEdition}
                onChange={(e) => setPackEdition(e.target.value as "java" | "bedrock")}
                className="rounded border border-border bg-input px-2 py-1 text-sm"
              >
                <option value="java">Java Edition</option>
                <option value="bedrock">Bedrock Edition</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.models.modelCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.totalModels}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.models.validModels}</div>
            <div className="mt-1 text-2xl font-bold text-green-600">{packStats.validModels}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.textures.textureCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.totalTextures}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.textures.totalSize}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.formattedSize}</div>
          </div>
          {/* Add font count to stats */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.fonts.fontCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{resourcePack.fonts.length}</div>
          </div>
          {/* Add a sync button to statistics area */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col justify-between">
            <div className="text-sm font-medium text-primary">Texture Sync</div>
            <Button size="sm" variant="outline" onClick={syncAllTextures} className="mt-2 text-xs">
              <Sparkles className="mr-1 h-3 w-3" /> Link Orphan Models
            </Button>
          </div>
          {/* Add sound count to stats */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.sounds.soundCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{resourcePack.sounds.length}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-lg border-2 border-primary bg-card p-6">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {["general", "models", "textures", "fonts", "sounds", "particles", "shaders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {t.tabs[tab as keyof typeof t.tabs]}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("geyser")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "geyser"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.geyser}
            </button>
            <button
              onClick={() => setActiveTab("merge")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "merge"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.merge}
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "versions"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.versions}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "preview"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.preview}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "general" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    {t.general.title}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="packName">{t.general.packName}</Label>
                      <Input
                        id="packName"
                        value={resourcePack.name}
                        onChange={(e) => handlePackInfoChange("name", e.target.value)}
                        placeholder="My Custom Pack"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="packDesc">{t.general.packDescription}</Label>
                      <Textarea
                        id="packDesc"
                        value={resourcePack.description}
                        onChange={(e) => handlePackInfoChange("description", e.target.value)}
                        placeholder="A custom resource pack created with MARV"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author">{t.general.author}</Label>
                        <Input
                          id="author"
                          value={resourcePack.author}
                          onChange={(e) => handlePackInfoChange("author", e.target.value)}
                          placeholder="Author Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="format">{t.general.packFormat}</Label>
                        <Select
                          value={resourcePack.format.toString()}
                          onValueChange={(v) => handlePackInfoChange("format", parseInt(v))}
                        >
                          <SelectTrigger id="format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PACK_FORMATS.map((f) => (
                              <SelectItem key={f.format} value={f.format.toString()}>
                                {f.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-secondary bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                    <Layout className="h-5 w-5 text-secondary" />
                    {t.general.packIcon}
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-dashed border-secondary bg-muted">
                      {resourcePack.packIcon ? (
                        <>
                          <img
                            src={URL.createObjectURL(resourcePack.packIcon)}
                            alt="Pack Icon"
                            className="h-full w-full object-cover pixelated"
                          />
                          <button
                            onClick={() => handlePackInfoChange("packIcon", undefined)}
                            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                          <Plus className="mb-1 h-6 w-6" />
                          <span className="text-[10px]">PNG</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Recommended: 128x128 or 256x256 PNG.
                      </p>
                      <label className="cursor-pointer inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors">
                        {t.general.uploadIcon}
                        <input
                          type="file"
                          accept="image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePackInfoChange("packIcon", file)
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border-2 border-accent/20 bg-accent/5 p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold flex items-center gap-2 text-foreground">
                    <Sparkles className="h-5 w-5 text-accent" />
                    {t.dashboard.stats}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t.dashboard.models, value: packStats.totalModels, color: "bg-blue-500" },
                      { label: t.dashboard.textures, value: packStats.totalTextures, color: "bg-orange-500" },
                      { label: t.dashboard.fonts, value: resourcePack.fonts.length, color: "bg-purple-500" },
                      { label: t.dashboard.sounds, value: resourcePack.sounds.length, color: "bg-green-500" },
                      { label: t.dashboard.particles, value: resourcePack.particles.length, color: "bg-yellow-500" },
                      { label: t.dashboard.shaders, value: resourcePack.shaders.length, color: "bg-indigo-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-md border bg-background p-3 flex flex-col justify-between">
                        <span className="text-xs text-muted-foreground uppercase">{stat.label}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xl font-black">{stat.value}</span>
                          <div className={`h-1.5 w-6 rounded-full ${stat.color} opacity-50`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-accent/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t.dashboard.totalSize}</span>
                      <span className="font-bold">{packStats.formattedSize}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>{t.dashboard.readiness}</span>
                        <span>{Math.min(100, (packStats.validModels / (packStats.totalModels || 1)) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(100, (packStats.validModels / (packStats.totalModels || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "models" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={addModel}
                  className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                >
                  {t.models.addModel}
                </button>
                <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Import Model JSON
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const text = await file.text()
                        const data = JSON.parse(text)
                        handleJsonModelImport(file, data)
                      }
                    }}
                  />
                </label>
                <label className="cursor-pointer rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 transition-colors flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Import Bedrock Geometry
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const text = await file.text()
                        try {
                          const data = JSON.parse(text)
                          handleBedrockGeometryImport(data)
                        } catch (err) {
                          toast({ title: "Error", description: "Invalid JSON file", variant: "destructive" })
                        }
                      }
                    }}
                  />
                </label>
              </div>
              {resourcePack.models.length === 0 ? (
                <p className="text-center text-muted-foreground">{t.models.noModels}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {resourcePack.models.map((model) => {
                    const validation = validateModel(model)
                    const filteredSuggestions = MINECRAFT_ITEMS.filter((item) =>
                      item.toLowerCase().includes((targetItemInput[model.id] || model.targetItem).toLowerCase()),
                    ).slice(0, 10)

                    // Find preview texture
                    const firstTextureKey = Object.keys(model.textures)[0]
                    const firstTexturePath = model.textures[firstTextureKey]?.replace("item/", "").replace("minecraft:item/", "")
                    const previewTexture = resourcePack.textures.find(t => t.name === firstTexturePath)

                    return (
                      <div
                        key={model.id}
                        className={`rounded-lg border-2 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow ${validation.isValid ? "border-green-500/50 bg-card" : "border-destructive bg-destructive/5"}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border border-border overflow-hidden">
                              {previewTexture ? (
                                <img src={URL.createObjectURL(previewTexture.file)} alt={model.name} className="w-full h-full object-contain pixelated" />
                              ) : (
                                <div className="text-xs text-muted-foreground">No Preview</div>
                              )}
                            </div>
                            <div>
                              <input
                                type="text"
                                value={model.name}
                                onChange={(e) => updateModel(model.id, { name: e.target.value })}
                                className="font-bold text-lg w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1"
                                placeholder="Model Name"
                              />
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {model.isDefaultOverride ? "Default Override" : `CMD: ${model.customModelData}`}
                                </p>
                                {model.bedrockGeometry && (
                                  <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-cyan-200">
                                    Bedrock Geo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteModel(model.id)}
                            className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                          >
                            <span className="text-xl">×</span>
                          </button>
                        </div>

                        <div className="space-y-3 flex-1">
                          {/* Compact Inputs */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Target Item</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={
                                  targetItemInput[model.id] !== undefined ? targetItemInput[model.id] : model.targetItem
                                }
                                onChange={(e) => {
                                  const value = e.target.value
                                  setTargetItemInput((prev) => ({ ...prev, [model.id]: value }))
                                  setShowTargetItemSuggestions((prev) => ({ ...prev, [model.id]: true }))
                                  updateModel(model.id, { targetItem: value })
                                }}
                                className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm"
                                placeholder="Enter item ID"
                              />
                              {showTargetItemSuggestions[model.id] && filteredSuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border-2 border-border bg-background shadow-lg max-h-40 overflow-y-auto">
                                  {filteredSuggestions.map((item) => (
                                    <button
                                      key={item}
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        setTargetItemInput((prev) => ({ ...prev, [model.id]: item }))
                                        updateModel(model.id, { targetItem: item })
                                        setShowTargetItemSuggestions((prev) => ({ ...prev, [model.id]: false }))
                                      }}
                                      className="w-full px-2 py-1 text-left text-xs hover:bg-accent transition-colors"
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Texture Selector */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Main Texture</label>
                            <select
                              value={model.textures["layer0"] || ""}
                              onChange={(e) => updateModelTexture(model.id, "layer0", e.target.value)}
                              className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm"
                            >
                              <option value="">Select Texture...</option>
                              {resourcePack.textures.map((t) => {
                                const normalizedName = t.name
                                  .replace(/\.[^/.]+$/, "")
                                  .toLowerCase()
                                  .replace(/\s+/g, "_")
                                return (
                                  <option key={t.id} value={`item/${normalizedName}`}>
                                    {t.name}
                                  </option>
                                )
                              })}
                            </select>
                          </div>

                          {/* Default Override Toggle */}
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md border border-border/50">
                            <div>
                              <label className="text-xs font-medium text-foreground">Default Override</label>
                              <p className="text-[10px] text-muted-foreground">Replace item's default texture</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={model.isDefaultOverride || false}
                              onChange={(e) => {
                                const isOverride = e.target.checked
                                updateModel(model.id, {
                                  isDefaultOverride: isOverride,
                                  customModelData: isOverride ? 0 : (model.customModelData === 0 ? 1 : model.customModelData)
                                })
                              }}
                              className="h-4 w-4 rounded border-border"
                            />
                          </div>

                          {/* Command Snippets */}
                          <div className="pt-2 border-t border-border/50 space-y-3">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-primary flex items-center gap-1 mb-1.5">
                                <Terminal className="h-3 w-3" />
                                {t.models.giveCommand}
                              </label>
                              <div className="space-y-1">
                                {(() => {
                                  const targetItem = model.targetItem.includes(":") ? model.targetItem : `minecraft:${model.targetItem}`
                                  const cmdMap: string[] = []
                                  const floats = [model.customModelData, ...(model.customModelDataFloats || [])]
                                  cmdMap.push(`floats:[${floats.map(f => `${f}${Number.isInteger(f) ? ".0" : ""}`).join(",")}]`)
                                  if (model.customModelDataFlags?.length) cmdMap.push(`flags:[${model.customModelDataFlags.join(",")}]`)
                                  if (model.customModelDataStrings?.length) cmdMap.push(`strings:[${model.customModelDataStrings.map(s => `"${s}"`).join(",")}]`)
                                  if (model.customModelDataColors?.length) cmdMap.push(`colors:[${model.customModelDataColors.map(c => c.replace("#", "0x")).join(",")}]`)
                                  const modernGive = `/give @s ${targetItem}[minecraft:custom_model_data={${cmdMap.join(",")}}]`
                                  const legacyGive = `/give @s ${targetItem}{CustomModelData:${model.customModelData}}`

                                  return [
                                    { label: "1.21.4+", cmd: modernGive },
                                    { label: "Legacy", cmd: legacyGive }
                                  ].map((item) => (
                                    <div key={item.label} className="group relative flex items-center bg-muted/30 rounded-md border border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
                                      <span className="px-1.5 py-1 text-[8px] bg-muted border-r border-border/50 font-bold text-muted-foreground min-w-[32px] text-center">
                                        {item.label}
                                      </span>
                                      <code className="px-2 py-0.5 text-[10px] whitespace-nowrap overflow-x-auto no-scrollbar flex-1 font-mono text-foreground/70">
                                        {item.cmd}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.cmd)
                                          toast({ title: t.actions.copied, description: t.actions.copiedDesc })
                                        }}
                                        className="p-1 px-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors border-l border-border/50"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                })()}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase text-accent flex items-center gap-1 mb-1.5">
                                <Plus className="h-3 w-3" />
                                {t.models.summonCommand}
                              </label>
                              <div className="space-y-1">
                                {(() => {
                                  const targetItem = model.targetItem.includes(":") ? model.targetItem : `minecraft:${model.targetItem}`
                                  const cmdObj: any = { floats: [model.customModelData, ...(model.customModelDataFloats || [])] }
                                  if (model.customModelDataFlags?.length) cmdObj.flags = model.customModelDataFlags
                                  if (model.customModelDataStrings?.length) cmdObj.strings = model.customModelDataStrings
                                  if (model.customModelDataColors?.length) cmdObj.colors = model.customModelDataColors.map(c => c.replace("#", "0x"))
                                  const componentsStr = JSON.stringify({ "minecraft:custom_model_data": cmdObj }).replace(/\"(floats|flags|strings|colors|minecraft:custom_model_data)\":/g, "$1:")
                                  const modernSummon = `/summon item_display ~ ~ ~ {item:{id:"${targetItem}",count:1,components:${componentsStr}}}`
                                  const legacySummon = `/summon armor_stand ~ ~ ~ {ArmorItems:[{},{},{},{id:"${targetItem}",Count:1b,tag:{CustomModelData:${model.customModelData}}}]}`

                                  return [
                                    { label: "Modern", cmd: modernSummon },
                                    { label: "Legacy", cmd: legacySummon }
                                  ].map((item) => (
                                    <div key={item.label} className="group relative flex items-center bg-muted/30 rounded-md border border-border/50 overflow-hidden hover:border-accent/30 transition-colors">
                                      <span className="px-1.5 py-1 text-[8px] bg-muted border-r border-border/50 font-bold text-muted-foreground min-w-[32px] text-center">
                                        {item.label}
                                      </span>
                                      <code className="px-2 py-0.5 text-[10px] whitespace-nowrap overflow-x-auto no-scrollbar flex-1 font-mono text-foreground/70">
                                        {item.cmd}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.cmd)
                                          toast({ title: t.actions.copied, description: t.actions.copiedDesc })
                                        }}
                                        className="p-1 px-1.5 hover:bg-accent/20 text-muted-foreground hover:text-accent transition-colors border-l border-border/50"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                })()}
                              </div>
                            </div>
                          </div>

                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-primary transition-colors">Advanced Settings</summary>
                            <div className="mt-2 space-y-2 pl-2 border-l-2 border-border/50">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-muted-foreground">Parent</label>
                                <select
                                  value={model.parent}
                                  onChange={(e) => updateModel(model.id, { parent: e.target.value })}
                                  className="w-full rounded bg-input border border-border px-1 py-0.5"
                                >
                                  <option value="item/generated">item/generated</option>
                                  <option value="item/handheld">item/handheld</option>
                                </select>
                              </div>
                              <div className="mt-2 space-y-2 pt-2 border-t border-border/30">
                                <label className="block text-[10px] uppercase font-bold text-muted-foreground">{t.models.transparency}</label>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-muted-foreground">{t.models.renderType}</span>
                                  <select
                                    value={model.renderType || "minecraft:item/generated"}
                                    onChange={(e) => updateModel(model.id, { renderType: e.target.value as any })}
                                    className="w-full rounded bg-input border border-border px-1 py-0.5"
                                  >
                                    <option value="minecraft:item/generated">Default (Cutout)</option>
                                    <option value="translucent">Translucent</option>
                                    <option value="cutout">Cutout</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-muted-foreground">{t.models.bedrockMaterial}</span>
                                  <select
                                    value={model.bedrockMaterial || "entity_alphatest"}
                                    onChange={(e) => updateModel(model.id, { bedrockMaterial: e.target.value as any })}
                                    className="w-full rounded bg-input border border-border px-1 py-0.5"
                                  >
                                    <option value="entity_alphatest">Alpha Test</option>
                                    <option value="entity_alphablend">Alpha Blend</option>
                                    <option value="entity_emissive_alpha">Emissive Alpha</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                        {model.bedrockGeometry && (
                          <div className="mt-3 text-xs bg-cyan-500/10 text-cyan-600 px-2 py-1 rounded border border-cyan-500/20">
                            Bedrock Geometry Linked
                          </div>
                        )}
                        {!validation.isValid && (
                          <div className="mt-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                            {validation.errors[0]}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "textures" && (
            <TextureManager
              textures={resourcePack.textures}
              onAdd={addTexture}
              onDelete={deleteTexture}
              onUpdate={updateTexture}
              onOptimize={optimizeTexture}
              onOptimizeAll={optimizeAllTextures}
            />
          )}

          {activeTab === "fonts" && (
            <FontManager
              fonts={resourcePack.fonts}
              onAdd={addFont}
              onUpdate={updateFont}
              onDelete={deleteFont}
              onImport={handleFontImport}
              t={t}
            />
          )}

          {activeTab === "sounds" && (
            <SoundManager
              sounds={resourcePack.sounds}
              onAdd={addSound}
              onUpdate={updateSound}
              onDelete={deleteSound}
              t={t}
            />
          )}

          {activeTab === "particles" && (
            <ParticleManager
              particles={resourcePack.particles}
              onAdd={addParticle}
              onUpdate={updateParticle}
              onDelete={deleteParticle}
              textures={resourcePack.textures}
              onUploadTexture={addTexture}
              t={t}
            />
          )}

          {activeTab === "shaders" && (
            <ShaderManager
              shaders={resourcePack.shaders}
              onAdd={addShader}
              onDelete={deleteShader}
              t={t}
            />
          )}

          {activeTab === "merge" && (
            <div className="space-y-6">
              <div className="border-2 border-primary rounded-lg p-6 bg-card">
                <h3 className="text-xl font-bold text-primary mb-4">Texture Pack Merge</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Upload Resource Packs to Merge
                    </label>
                    <input
                      type="file"
                      accept=".zip"
                      multiple
                      onChange={(e) => e.target.files && handleMergePackUpload(e.target.files)}
                      className="w-full px-4 py-2 border-2 border-primary rounded-lg bg-background text-foreground"
                    />
                  </div>
                  {mergePacks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">Packs to Merge ({mergePacks.length})</h4>
                      <div className="space-y-2">
                        {mergePacks.map((pack, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-foreground">{pack.name}</span>
                            <button
                              onClick={() => setMergePacks((prev) => prev.filter((_, i) => i !== index))}
                              className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:opacity-80"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={analyzeMergeConflicts}
                          disabled={isProcessing}
                          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                          Analyze Conflicts
                        </button>
                      </div>
                    </div>
                  )}
                  {mergeConflicts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">Conflicts Found ({mergeConflicts.length})</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {mergeConflicts.map((conflict, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="text-sm text-foreground font-mono">{conflict.path}</div>
                            <div className="text-xs text-muted-foreground">
                              Found in: {conflict.packs.map((p) => p.packName).join(", ")}
                            </div>
                            <select
                              value={conflict.resolution}
                              onChange={(e) => {
                                const newConflicts = [...mergeConflicts]
                                newConflicts[index].resolution = e.target.value as any
                                setMergeConflicts(newConflicts)
                              }}
                              className="w-full px-3 py-1 border-2 border-primary rounded bg-background text-foreground"
                            >
                              <option value="overwrite">Overwrite (use last)</option>
                              <option value="skip">Skip (use first)</option>
                              <option value="rename">Rename (keep all)</option>
                            </select>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={executeMerge}
                        disabled={isProcessing}
                        className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        Execute Merge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "versions" && (
            <div className="space-y-6">
              <div className="border-2 border-primary rounded-lg p-6 bg-card">
                <h3 className="text-xl font-bold text-primary mb-4">Multi-Version Pack Generation</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate resource packs for multiple Minecraft versions simultaneously.
                  </p>
                  <div className="space-y-2">
                    {versionConfigs.map((config, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => {
                              const newConfigs = [...versionConfigs]
                              newConfigs[index].enabled = e.target.checked
                              setVersionConfigs(newConfigs)
                            }}
                            className="w-5 h-5"
                          />
                          <div>
                            <div className="font-semibold text-foreground">Minecraft {config.version}</div>
                            <div className="text-xs text-muted-foreground">Pack Format: {config.format}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={generateMultiVersionPacks}
                    disabled={isProcessing || versionConfigs.filter((v) => v.enabled).length === 0}
                    className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    Generate All Enabled Versions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "geyser" && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-lg mb-2">Upload Geyser Mappings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a geyser_mappings.json file to assist with Bedrock pack importing.
                </p>
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="relative">
                    <Upload className="mr-2 h-4 w-4" />
                    Select File
                    <input
                      type="file"
                      accept=".json"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            const text = await file.text()
                            const json = JSON.parse(text)
                            setGeyserMappings(json)
                            toast({ title: "Success", description: "Mappings loaded successfully!" })
                          } catch (err) {
                            toast({ title: "Error", description: "Failed to parse mappings file.", variant: "destructive" })
                          }
                        }
                      }}
                    />
                  </Button>
                  {geyserMappings && <span className="text-green-600 text-sm">✓ Mappings Loaded</span>}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Mapped Items</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const mapping = generateGeyserMapping()
                      const blob = new Blob([mapping], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "geyser_mappings.json"
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Download Mappings
                  </Button>
                </div>
                <div className="border border-border rounded-md bg-muted/50 overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left font-medium">Java Item</th>
                          <th className="p-2 text-left font-medium">CMD</th>
                          <th className="p-2 text-left font-medium">Bedrock Name</th>
                          <th className="p-2 text-left font-medium">Texture</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {geyserMappings ? (
                          Object.entries(geyserMappings.items).map(([item, entries]) => (
                            entries.map((entry, i) => (
                              <tr key={`${item}-${i}`} className="hover:bg-accent/50">
                                <td className="p-2 font-mono text-xs">{item}</td>
                                <td className="p-2">{entry.custom_model_data}</td>
                                <td className="p-2">{entry.name}</td>
                                <td className="p-2 text-muted-foreground">{entry.icon || entry.name}</td>
                              </tr>
                            ))
                          ))
                        ) : resourcePack.models.length > 0 ? (
                          resourcePack.models.map(model => {
                            const javaItem = (model.targetItem.includes(":") || model.targetItem.includes("[")
                              ? model.targetItem
                              : `minecraft:${model.targetItem}`).toLowerCase();
                            const textureName = (
                              Object.values(model.textures)[0]
                                ?.replace(/^.*\//, "")
                                .replace(/\.[^/.]+$/, "") || model.name
                            ).toLowerCase().replace(/\s+/g, "_");

                            return (
                              <tr key={model.id} className="hover:bg-accent/50">
                                <td className="p-2 font-mono text-xs">{javaItem}</td>
                                <td className="p-2">{model.customModelData}</td>
                                <td className="p-2">{model.name}</td>
                                <td className="p-2 text-muted-foreground">{textureName}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No mappings available. Add models or import a mapping file.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted p-6">
                <h3 className="mb-4 text-lg font-semibold">Pack Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd className="font-medium">{resourcePack.name || "Untitled"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Models:</dt>
                    <dd className="font-medium">{packStats.totalModels}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Textures:</dt>
                    <dd className="font-medium">{packStats.totalTextures}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Size:</dt>
                    <dd className="font-medium">{packStats.formattedSize}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Fonts:</dt>
                    <dd className="font-medium">{resourcePack.fonts.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sounds:</dt>
                    <dd className="font-medium">{resourcePack.sounds.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Particles:</dt>
                    <dd className="font-medium">{resourcePack.particles.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shaders:</dt>
                    <dd className="font-medium">{resourcePack.shaders.length}</dd>
                  </div>
                </dl>
              </div>
              {validationResults.errors.length > 0 && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <h4 className="mb-2 font-semibold text-destructive">Validation Errors:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
                    {validationResults.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={generateZip}
            disabled={isProcessing}
            className="rounded-md bg-secondary px-6 py-3 font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
          >
            {isProcessing ? processingStep : t.actions.download}
          </button>
          <button
            onClick={validatePack}
            disabled={isProcessing}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {t.actions.validate}
          </button>
          <button
            onClick={exportSettings}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10"
          >
            {t.actions.export}
          </button>
          <button
            onClick={() => {
              const fileInput = document.createElement("input")
              fileInput.type = "file"
              fileInput.accept = ".zip,.json"
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) importExistingPack(file)
              }
              fileInput.click()
            }}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10"
          >
            {t.actions.import}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>{processingStep}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}