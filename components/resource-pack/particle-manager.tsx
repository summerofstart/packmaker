"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Snowflake } from "lucide-react"
import { CustomParticle, TextureData } from "./types"

interface ParticleManagerProps {
    particles: CustomParticle[]
    textures: TextureData[]
    onAdd: () => void
    onUpdate: (id: string, data: Partial<CustomParticle>) => void
    onDelete: (id: string) => void
}

export function ParticleManager({ particles, textures, onAdd, onUpdate, onDelete }: ParticleManagerProps) {
    const particleTextures = textures.filter((t) => t.path.startsWith("textures/particle"))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Particles</h3>
                <Button onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Particle
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {particles.map((particle) => (
                    <Card key={particle.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Snowflake className="h-4 w-4" />
                                    {particle.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => onDelete(particle.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Particle Name</Label>
                                <Input
                                    value={particle.name}
                                    onChange={(e) => onUpdate(particle.id, { name: e.target.value })}
                                    placeholder="custom_particle"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Textures (one per line)</Label>
                                <Textarea
                                    value={particle.textures.join("\n")}
                                    onChange={(e) =>
                                        onUpdate(particle.id, {
                                            textures: e.target.value.split("\n").filter((t) => t.trim()),
                                        })
                                    }
                                    placeholder="minecraft:custom/particle_0"
                                    className="font-mono text-sm"
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Available textures in textures/particle:
                                </p>
                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-muted rounded">
                                    {particleTextures.length === 0 ? (
                                        <span className="text-xs text-muted-foreground italic">No particle textures uploaded</span>
                                    ) : (
                                        particleTextures.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    const texturePath = t.path.replace("textures/", "").replace(".png", "")
                                                    const newTextures = [...particle.textures, `minecraft:${texturePath}`]
                                                    onUpdate(particle.id, { textures: newTextures })
                                                }}
                                                className="text-xs bg-background border px-1 rounded hover:bg-accent"
                                            >
                                                {t.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-md bg-muted p-3">
                                <Label className="mb-2 block text-xs font-medium text-muted-foreground">
                                    Generated particles/{particle.name}.json:
                                </Label>
                                <pre className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                                    {JSON.stringify(
                                        {
                                            textures: particle.textures,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {particles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    No particles added yet.
                </div>
            )}
        </div>
    )
}
