"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Music } from "lucide-react"
import { CustomSound } from "./types"

interface SoundManagerProps {
    sounds: CustomSound[]
    onAdd: (file: File) => void
    onUpdate: (id: string, data: Partial<CustomSound>) => void
    onDelete: (id: string) => void
}

const SOUND_CATEGORIES = [
    "master",
    "music",
    "record",
    "weather",
    "block",
    "hostile",
    "neutral",
    "player",
    "ambient",
    "voice",
]

export function SoundManager({ sounds, onAdd, onUpdate, onDelete }: SoundManagerProps) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onAdd(file)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Sounds</h3>
                <div className="relative">
                    <input
                        type="file"
                        accept=".ogg"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sound (.ogg)
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {sounds.map((sound) => (
                    <Card key={sound.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Music className="h-4 w-4" />
                                    {sound.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => onDelete(sound.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Sound Event Name</Label>
                                <Input
                                    value={sound.name}
                                    onChange={(e) => onUpdate(sound.id, { name: e.target.value })}
                                    placeholder="custom.sound.event"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={sound.category}
                                    onValueChange={(value: any) => onUpdate(sound.id, { category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOUND_CATEGORIES.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={`replace-${sound.id}`}
                                    checked={sound.replace || false}
                                    onChange={(e) => onUpdate(sound.id, { replace: e.target.checked })}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor={`replace-${sound.id}`}>Replace default sounds</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Subtitle</Label>
                                <Input
                                    value={sound.subtitle || ""}
                                    onChange={(e) => onUpdate(sound.id, { subtitle: e.target.value })}
                                    placeholder="subtitles.custom.sound"
                                />
                            </div>

                            <div className="text-xs text-muted-foreground">
                                File: {sound.file?.name}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {sounds.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    No sounds added yet. Upload .ogg files to create custom sound events.
                </div>
            )}
        </div>
    )
}
