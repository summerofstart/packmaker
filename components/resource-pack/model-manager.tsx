"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ModelDataEditor } from "../model-data-editor"
import { ModelData, TextureData } from "./types"

interface ModelManagerProps {
    models: ModelData[]
    textures: TextureData[]
    onAdd: () => void
    onUpdate: (id: string, data: Partial<ModelData>) => void
    onDelete: (id: string) => void
}

export function ModelManager({ models, textures, onAdd, onUpdate, onDelete }: ModelManagerProps) {
    const [searchQuery, setSearchQuery] = useState("")

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
                <Button onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Model
                </Button>
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
