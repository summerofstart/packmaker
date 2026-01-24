"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Upload } from "lucide-react"
import { ModelDataEditor } from "../model-data-editor"
import { ModelData, TextureData } from "./types"
import { MINECRAFT_ITEMS } from "./constants"

interface ModelManagerProps {
    models: ModelData[]
    textures: TextureData[]
    onAdd: () => void
    onImport?: (model: ModelData, textures: TextureData[]) => void
    onUpdate: (id: string, data: Partial<ModelData>) => void
    onDelete: (id: string) => void
}

export function ModelManager({ models, textures, onAdd, onImport, onUpdate, onDelete }: ModelManagerProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const handleBbmodelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onImport) return

        try {
            setIsProcessing(true)
            const text = await file.text()
            const parsedData = JSON.parse(text)

            console.log("BBModel import started:", file.name)

            const modelName = (parsedData.name || file.name.replace(".bbmodel", "")).toLowerCase().replace(/\s+/g, "_")

            // Auto-detection logic
            let targetItem = (parsedData.meta?.model_identifier || "stick").toLowerCase()
            let detectedCmd: number | undefined = undefined

            const nameMatch = file.name.replace(".bbmodel", "").match(/^(.+?)(?:_(\d+))?$/)
            if (nameMatch) {
                const potentialItem = nameMatch[1].toLowerCase()
                const potentialCmd = nameMatch[2] ? parseInt(nameMatch[2]) : undefined

                if (MINECRAFT_ITEMS.includes(potentialItem)) {
                    targetItem = potentialItem
                    if (potentialCmd) detectedCmd = potentialCmd
                }
            }

            const existingCustomModelData = models.map((m) => m.customModelData)
            let customModelData = detectedCmd || 1

            if (detectedCmd) {
                // Use detected CMD even if conflict, assuming update or intentional
            } else {
                while (existingCustomModelData.includes(customModelData)) {
                    customModelData++
                }
            }

            // Process textures
            const textureMap: Record<string, string> = {}
            const textureFiles: TextureData[] = []
            const is3DModel = !!(parsedData.elements && parsedData.elements.length > 0)

            if (parsedData.textures && Array.isArray(parsedData.textures)) {
                for (let i = 0; i < parsedData.textures.length; i++) {
                    const texture = parsedData.textures[i]
                    if (texture.source && texture.source.startsWith("data:image")) {
                        const base64Data = texture.source.split(",")[1]
                        const binaryData = atob(base64Data)
                        const arrayBuffer = new Uint8Array(binaryData.length)
                        for (let j = 0; j < binaryData.length; j++) {
                            arrayBuffer[j] = binaryData.charCodeAt(j)
                        }
                        const blob = new Blob([arrayBuffer], { type: "image/png" })
                        const rawTextureName = texture.name || `texture_${i}`
                        const textureName = rawTextureName.toLowerCase().replace(/\s+/g, "_")
                        const textureFile = new File([blob], `${textureName}.png`, { type: "image/png" })

                        textureFiles.push({
                            id: `texture_${Date.now()}_${i}`,
                            name: textureName,
                            file: textureFile,
                            path: `textures/item/${textureName}.png`,
                            size: textureFile.size,
                            isOptimized: false
                        })

                        // Use numeric keys for 3D models (0, 1, 2...) or layerX for flat items
                        const textureKey = is3DModel ? i.toString() : `layer${i}`
                        textureMap[textureKey] = textureName
                    }
                }
            }

            // Clean elements to refer to numeric texture keys properly (#0, #1, ...)
            const cleanedElements = is3DModel ? parsedData.elements.map((el: any) => {
                const newEl = { ...el }
                if (newEl.faces) {
                    Object.keys(newEl.faces).forEach(faceKey => {
                        const face = newEl.faces[faceKey]
                        if (typeof face.texture === 'number') {
                            face.texture = `#${face.texture}`
                        } else if (typeof face.texture === 'string' && !face.texture.startsWith('#')) {
                            face.texture = `#${face.texture}`
                        }
                    })
                }
                return newEl
            }) : undefined

            // Create Model
            const newModel: ModelData = {
                id: `model_${Date.now()}`,
                name: modelName,
                customModelData,
                parent: is3DModel ? undefined : "item/generated",
                textures: textureMap,
                targetItem,
                customModelDataFloats: [customModelData],
                customModelDataFlags: [],
                customModelDataStrings: [],
                customModelDataColors: [],
                elements: cleanedElements,
                display: parsedData.display,
            }

            onImport(newModel, textureFiles)

        } catch (error) {
            console.error("Import error:", error)
            alert("Failed to import BBModel")
        } finally {
            setIsProcessing(false)
            // Reset input
            e.target.value = ""
        }
    }

    const filteredModels = models.filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.targetItem.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <label className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        <Upload className="mr-2 h-4 w-4" />
                        Import BBModel
                        <Input
                            type="file"
                            accept=".bbmodel,.json"
                            className="hidden"
                            disabled={isProcessing}
                            onChange={handleBbmodelUpload}
                        />
                    </label>
                    <Button onClick={onAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Model
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredModels.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "No models found matching your search" : "No models created yet. Click 'Add Model' to start."}
                    </div>
                ) : (
                    filteredModels.map((model) => (
                        <ModelDataEditor
                            key={model.id}
                            model={model}
                            availableTextures={textures}
                            onUpdate={(data) => onUpdate(model.id, data)}
                            onRemove={() => onDelete(model.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
