"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Film, Trash2, Upload, Folder } from "lucide-react"
import { TextureData } from "./types"

interface TextureManagerProps {
    textures: TextureData[]
    onAdd: (file: File, category: string) => void
    onDelete: (id: string) => void
    onUpdate: (id: string, data: Partial<TextureData>) => void
    onOptimize: (id: string) => void
    onOptimizeAll: () => void
}

const TEXTURE_CATEGORIES = [
    { id: "item", name: "Items", path: "textures/item" },
    { id: "block", name: "Blocks", path: "textures/block" },
    { id: "entity", name: "Entities", path: "textures/entity" },
    { id: "particle", name: "Particles", path: "textures/particle" },
    { id: "gui", name: "GUI", path: "textures/gui" },
    { id: "mob_effect", name: "Mob Effects", path: "textures/mob_effect" },
    { id: "painting", name: "Paintings", path: "textures/painting" },
    { id: "environment", name: "Environment", path: "textures/environment" },
    { id: "font", name: "Font", path: "textures/font" },
    { id: "map", name: "Map", path: "textures/map" },
    { id: "misc", name: "Misc", path: "textures/misc" },
]

export function TextureManager({
    textures,
    onAdd,
    onDelete,
    onUpdate,
    onOptimize,
    onOptimizeAll,
}: TextureManagerProps) {
    const [selectedCategory, setSelectedCategory] = useState("item")
    const [editingAnimation, setEditingAnimation] = useState<string | null>(null)

    const filteredTextures = textures.filter((t) =>
        t.path.startsWith(`textures/${selectedCategory}/`) ||
        t.path === `textures/${selectedCategory}`
    )

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        files.forEach((file) => onAdd(file, selectedCategory))
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {TEXTURE_CATEGORIES.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <input
                            type="file"
                            accept="image/png"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                        />
                        <Button variant="secondary">
                            <Upload className="mr-2 h-4 w-4" />
                            Add Texture
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {textures.some((t) => !t.isOptimized) && (
                        <Button onClick={onOptimizeAll} variant="outline">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Optimize All
                        </Button>
                    )}
                </div>
            </div>

            {filteredTextures.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Folder className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No textures in this category</h3>
                    <p className="text-sm text-muted-foreground">
                        Upload PNG files to add them to {TEXTURE_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTextures.map((texture) => (
                        <div key={texture.id} className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted/50">
                                        {/* We would ideally show a preview here, but we need URL.createObjectURL which might be tricky if we don't have the file object persisted or if it's just in memory. 
                        Assuming 'file' is a File object, we can use URL.createObjectURL. 
                        However, for this component, we might need to handle object URLs carefully to avoid leaks.
                        For now, I'll skip the image preview or just try to use it if available.
                    */}
                                        <img
                                            src={URL.createObjectURL(texture.file)}
                                            alt={texture.name}
                                            className="h-full w-full object-contain pixelated"
                                            onLoad={(e) => {
                                                // Optional: Only revoke if you manage a registry of URLs
                                                // For now, keeping it alive for the session is safer than revoking on every mount
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-medium leading-none truncate max-w-[150px]" title={texture.name}>{texture.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {texture.width}x{texture.height} • {formatFileSize(texture.size || 0)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                                    onClick={() => onDelete(texture.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={texture.animation?.enabled ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 flex-1"
                                    onClick={() => setEditingAnimation(editingAnimation === texture.id ? null : texture.id)}
                                >
                                    <Film className="mr-2 h-3 w-3" />
                                    {texture.animation?.enabled ? "Animated" : "Animate"}
                                </Button>

                                {!texture.isOptimized && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 px-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                        onClick={() => onOptimize(texture.id)}
                                        title="Optimize Texture"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            {editingAnimation === texture.id && (
                                <div className="mt-4 space-y-4 rounded-md border bg-muted/50 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={`anim-${texture.id}`} className="text-xs font-medium">Enable Animation</Label>
                                        <input
                                            type="checkbox"
                                            id={`anim-${texture.id}`}
                                            checked={texture.animation?.enabled || false}
                                            onChange={(e) => {
                                                onUpdate(texture.id, {
                                                    animation: {
                                                        ...texture.animation,
                                                        enabled: e.target.checked,
                                                        frametime: texture.animation?.frametime || 1,
                                                        interpolate: texture.animation?.interpolate || false,
                                                        frames: texture.animation?.frames || []
                                                    } as any
                                                })
                                            }}
                                            className="h-4 w-4"
                                        />
                                    </div>

                                    {texture.animation?.enabled && (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Frametime (ticks)</Label>
                                                <Input
                                                    type="number"
                                                    value={texture.animation.frametime}
                                                    onChange={(e) => onUpdate(texture.id, {
                                                        animation: { ...texture.animation!, frametime: parseInt(e.target.value) || 1 }
                                                    })}
                                                    className="h-8"
                                                    min={1}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Interpolate</Label>
                                                <input
                                                    type="checkbox"
                                                    checked={texture.animation.interpolate}
                                                    onChange={(e) => onUpdate(texture.id, {
                                                        animation: { ...texture.animation!, interpolate: e.target.checked }
                                                    })}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
