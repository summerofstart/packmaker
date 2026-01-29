"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Snowflake, Upload, X, Search, ImageIcon, GripVertical } from "lucide-react"
import { CustomParticle, TextureData } from "./types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ParticleManagerProps {
    particles: CustomParticle[]
    textures: TextureData[]
    onAdd: () => void
    onUpdate: (id: string, data: Partial<CustomParticle>) => void
    onDelete: (id: string) => void
    onUploadTexture?: (file: File, category: string) => Promise<void>
    t: any
}

export function ParticleManager({ particles, textures, onAdd, onUpdate, onDelete, onUploadTexture, t }: ParticleManagerProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingTo, setUploadingTo] = useState<string | null>(null)

    const particleTextures = textures.filter((t) =>
        t.path.startsWith("textures/particle") || t.baseCategory === "particle"
    )

    const filteredParticleTextures = particleTextures.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, particleId: string) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0 && onUploadTexture) {
            for (const file of files) {
                await onUploadTexture(file, "particle")
                const fileName = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, "_")
                const textureRef = `minecraft:particle/${fileName}`

                const particle = particles.find(p => p.id === particleId)
                if (particle) {
                    const newTextures = [...particle.textures, textureRef]
                    onUpdate(particleId, { textures: newTextures })
                }
            }
        }
    }

    const removeTexture = (particleId: string, index: number) => {
        const particle = particles.find(p => p.id === particleId)
        if (particle) {
            const newTextures = [...particle.textures]
            newTextures.splice(index, 1)
            onUpdate(particleId, { textures: newTextures })
        }
    }

    const addExistingTexture = (particleId: string, texturePath: string) => {
        const particle = particles.find(p => p.id === particleId)
        if (particle) {
            // Clean path to minecraft format if needed
            const cleanPath = texturePath.startsWith("textures/")
                ? texturePath.replace("textures/", "minecraft:")
                : texturePath.startsWith("minecraft:") ? texturePath : `minecraft:${texturePath}`

            if (!particle.textures.includes(cleanPath)) {
                onUpdate(particleId, { textures: [...particle.textures, cleanPath] })
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold tracking-tight">Custom Particles</h3>
                    <p className="text-sm text-muted-foreground">
                        Create and manage custom particle effects for your resource pack.
                    </p>
                </div>
                <Button onClick={onAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t?.particles?.addParticle || "Add Particle"}
                </Button>
            </div>

            <div className="grid gap-6">
                {particles.map((particle) => (
                    <Card key={particle.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Snowflake className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            value={particle.name}
                                            onChange={(e) => onUpdate(particle.id, { name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                            className="h-8 w-64 font-mono text-sm font-bold bg-transparent border-none focus-visible:ring-1"
                                            placeholder="particle_name"
                                        />
                                        <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-wider font-semibold">
                                            Particle Identifier
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2"
                                        onClick={() => {
                                            setUploadingTo(particle.id)
                                            fileInputRef.current?.click()
                                        }}
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => onDelete(particle.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-[1fr_300px] divide-x border-t">
                                <div className="p-6">
                                    <Label className="mb-4 block text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Texture Sequence
                                    </Label>

                                    {particle.textures.length === 0 ? (
                                        <div
                                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors hover:bg-muted/50 cursor-pointer"
                                            onClick={() => {
                                                setUploadingTo(particle.id)
                                                fileInputRef.current?.click()
                                            }}
                                        >
                                            <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-sm text-muted-foreground">No textures added to this particle</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">Upload images or select from the library</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {particle.textures.map((textureRef, index) => {
                                                const textureName = textureRef.replace("minecraft:particle/", "").replace("minecraft:", "")
                                                const textureData = textures.find(t =>
                                                    t.name === textureName &&
                                                    (t.path.includes("particle") || t.baseCategory === "particle")
                                                )

                                                return (
                                                    <div
                                                        key={`${textureRef}-${index}`}
                                                        className="group relative rounded-lg border bg-card p-2 transition-all hover:ring-2 hover:ring-primary/20"
                                                    >
                                                        <div className="relative aspect-square overflow-hidden rounded bg-muted/50 flex items-center justify-center">
                                                            {textureData ? (
                                                                <img
                                                                    src={URL.createObjectURL(textureData.file)}
                                                                    alt={textureName}
                                                                    className="h-full w-full object-contain pixelated"
                                                                />
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground">Missing</span>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="h-6 w-6 rounded-full"
                                                                    onClick={() => removeTexture(particle.id, index)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between gap-1 overflow-hidden">
                                                            <p className="truncate text-[10px] font-medium leading-none">
                                                                {textureName}
                                                            </p>
                                                            <Badge variant="outline" className="h-3.5 px-1 py-0 text-[8px]">
                                                                #{index}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <button
                                                onClick={() => {
                                                    setUploadingTo(particle.id)
                                                    fileInputRef.current?.click()
                                                }}
                                                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 text-muted-foreground hover:text-primary"
                                            >
                                                <Plus className="h-6 w-6" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="mt-6 rounded-xl bg-muted/50 p-4">
                                        <Label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            JSON Definition
                                        </Label>
                                        <pre className="text-xs font-mono bg-background/50 p-3 rounded-lg overflow-x-auto border">
                                            {JSON.stringify({ textures: particle.textures }, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="bg-muted/10 p-4">
                                    <div className="sticky top-4 space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search library..."
                                                className="pl-8 h-9 text-xs"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <Label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            Particle Library
                                        </Label>

                                        <ScrollArea className="h-[300px]">
                                            <div className="space-y-1.5 pr-3">
                                                {filteredParticleTextures.length === 0 ? (
                                                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                                                        No textures found
                                                    </div>
                                                ) : (
                                                    filteredParticleTextures.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => addExistingTexture(particle.id, t.path.replace("textures/", ""))}
                                                            className="flex w-full items-center gap-2 rounded-md border bg-card p-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground group"
                                                        >
                                                            <div className="h-8 w-8 flex-shrink-0 rounded bg-muted overflow-hidden">
                                                                <img
                                                                    src={URL.createObjectURL(t.file)}
                                                                    alt={t.name}
                                                                    className="h-full w-full object-contain pixelated"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate font-medium leading-none mb-1">{t.name}</p>
                                                                <p className="text-[9px] text-muted-foreground">
                                                                    {t.width}x{t.height}
                                                                </p>
                                                            </div>
                                                            <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {particles.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 bg-muted/10">
                    <Snowflake className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                        {t?.particles?.noParticles || "No particles added yet."}
                    </h3>
                    <p className="text-sm text-muted-foreground/70 mb-6">
                        Start by creating your first custom particle effect.
                    </p>
                    <Button onClick={onAdd} variant="outline" size="lg">
                        Create Particle
                    </Button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png"
                multiple
                onChange={(e) => {
                    if (uploadingTo) {
                        handleFileUpload(e, uploadingTo)
                        setUploadingTo(null)
                    }
                }}
            />
        </div>
    )
}
