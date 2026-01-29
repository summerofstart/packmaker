"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Type, MoveRight, Layers, Settings2, Layout, Smartphone, Sparkles, Eye, Copy, MessageSquare, FileText } from "lucide-react"
import { CustomFont, FontProvider } from "./types"
import { Badge } from "@/components/ui/badge"

interface FontManagerProps {
    fonts: CustomFont[]
    onAdd: (file: File) => void
    onImport: (font: CustomFont) => void
    onUpdate: (id: string, data: Partial<CustomFont>) => void
    onDelete: (id: string) => void
    t: any
}

// Font Presets based on Qiita article examples
const FONT_PRESETS = {
    gui_overlay: {
        name: "GUI Overlay",
        description: "Perfect for custom GUIs in containers (barrels, chests, etc.)",
        icon: Layout,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "space" as const,
                advances: { "\uE000": -8 }
            },
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 80,
                ascent: 10,
                chars: ["\uE001"]
            }
        ],
        usage: '/setblock ~ ~ ~ barrel{CustomName:\'{"color":"white","text":"\\\\uE000\\\\uE001"}\'}'
    },
    bleeding_effect: {
        name: "Bleeding/Screen Effect",
        description: "Full-screen overlay for bleeding, damage, or transition effects",
        icon: Eye,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 128,
                ascent: 64,
                chars: ["\uE002"]
            }
        ],
        usage: '/title @s title "\\uE002"'
    },
    icon_set: {
        name: "Icon Set",
        description: "Small icons for text (armor, hearts, custom symbols)",
        icon: Sparkles,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 9,
                ascent: 8,
                chars: ["\uE003"]
            }
        ],
        usage: '{"attribute.name.armor": "§f\\uE003§r防御力"}'
    },
    particle_display: {
        name: "Particle/Display Entity",
        description: "For text_display entities and custom particles",
        icon: Smartphone,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 16,
                ascent: 12,
                chars: ["\uE004"]
            }
        ],
        usage: 'summon text_display ~ ~ ~ {text:\'{"text":"\\uE004"}\'}'
    },
    damage_indicator: {
        name: "Damage Indicator",
        description: "Floating 'bounce' text style for damage numbers",
        icon: Sparkles,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 12,
                ascent: 10,
                chars: ["\uE005"]
            }
        ],
        usage: 'summon text_display ~ ~1 ~ {text:\'{"text":"§c12\\uE005","bold":true}\'}'
    },
    boss_bar_icons: {
        name: "Boss Bar Icons",
        description: "Custom symbols for boss bar overlays",
        icon: Layout,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 5,
                ascent: 4,
                chars: ["\uE006\uE007\uE008"]
            }
        ],
        usage: '{"text": "§f\\uE006 Boss Name"}'
    },
    status_effects: {
        name: "Status Effects",
        description: "Inline icons for custom potion/buff effects",
        icon: Smartphone,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 9,
                ascent: 8,
                chars: ["\uE009\uE00A"]
            }
        ],
        usage: '{"text": "§f\\uE009 Strength III"}'
    },
    custom_gui: {
        name: "Custom GUI Background",
        description: "Large textures for custom container GUIs (chests, barrels)",
        icon: Layout,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "space" as const,
                advances: { "\uF801": -1, "\uF808": -8, "\uF80A": -10, "\uF80C": -12 }
            },
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 80,
                ascent: 10,
                chars: ["\uE200"]
            }
        ],
        usage: '/give @p chest{display:{Name:\'[{"text":"\\uF808\\uE200\\uF80C\\uF80A\\uF808\\uF801","color":"white"},{"text":"Custom GUI","italic":false,"color":"#3F3F3F"}]\'}}'
    },
    speech_bubble: {
        name: "Speech Bubble",
        description: "Comic-style balloons for NPCs or dialogue systems",
        icon: MessageSquare,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 32,
                ascent: 0,
                chars: ["\uE003"]
            }
        ],
        usage: '/summon armor_stand ~ ~ ~ {CustomName:\'{"text":"\\uE003"}\', CustomNameVisible:1b}'
    },
    book_overlay: {
        name: "Book Overlay",
        description: "Full-page images or detailed layouts for written books",
        icon: FileText,
        providers: [
            {
                id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                type: "bitmap" as const,
                height: 135,
                ascent: 14,
                chars: ["\uE102"]
            }
        ],
        usage: '/give @p written_book{title:"",author:"",pages:[\'{"text":"\\uE102","color":"white"}\']}'
    }
}

// Unicode helper for generating safe unicode ranges
const UNICODE_RANGES = {
    private_use_area: { start: 0xE000, end: 0xF8FF, name: "Private Use Area (Recommended)" },
    supplementary_private: { start: 0xF0000, end: 0xFFFFD, name: "Supplementary Private Use Area-A" }
}

function FontPreview({ providers, text }: { providers: FontProvider[], text: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.imageSmoothingEnabled = false

        let cursorX = 10
        const centerY = canvas.height / 2

        // Parse unicode escape sequences in the text
        const processedText = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
            String.fromCodePoint(parseInt(hex, 16))
        )

        for (const char of processedText) {
            let handled = false

            // 1. Check Space Providers
            for (const provider of providers) {
                if (provider.type === "space" && provider.advances?.[char]) {
                    cursorX += provider.advances[char]
                    handled = true
                    break
                }
            }
            if (handled) continue

            // 2. Check Bitmap Providers
            for (const provider of providers) {
                if (provider.type === "bitmap" && provider.fileHandle && provider.chars) {
                    const rowIndex = provider.chars.findIndex(row => row.includes(char))
                    if (rowIndex !== -1) {
                        const colIndex = provider.chars[rowIndex].indexOf(char)
                        const height = provider.height || 8
                        const ascent = provider.ascent || 8

                        const img = new Image()
                        img.onload = () => {
                            const charWidth = img.width / provider.chars![rowIndex].length
                            const charHeight = img.height / provider.chars!.length

                            ctx.drawImage(
                                img,
                                colIndex * charWidth,
                                rowIndex * charHeight,
                                charWidth,
                                charHeight,
                                cursorX,
                                centerY - (ascent * 2), // Scale factor of 2 for visibility
                                (charWidth * (height / charHeight)) * 2,
                                height * 2
                            )
                            cursorX += (charWidth * (height / charHeight)) * 2 + 2
                        }
                        img.src = URL.createObjectURL(provider.fileHandle)
                        handled = true
                        break
                    }
                }
            }
            if (handled) continue

            // 3. Fallback to System Font
            ctx.font = "24px Inter, sans-serif"
            ctx.fillStyle = "rgba(0,0,0,0.5)"
            const metrics = ctx.measureText(char)
            ctx.fillText(char, cursorX, centerY)
            cursorX += metrics.width + 2
        }
    }, [providers, text])

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="max-w-full h-auto"
        />
    )
}

export function FontManager({ fonts, onAdd, onImport, onUpdate, onDelete, t }: FontManagerProps) {
    const [isImporting, setIsImporting] = useState(false)
    const [importJson, setImportJson] = useState("")
    const [importError, setImportError] = useState<string | null>(null)
    const [previewText, setPreviewText] = useState("\\uE000\\uE001\\uE002")
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [showUnicodeHelper, setShowUnicodeHelper] = useState(false)
    const [unicodeStart, setUnicodeStart] = useState("E000")

    const handleImportConfig = () => {
        try {
            const parsed = JSON.parse(importJson)
            if (!parsed.providers || !Array.isArray(parsed.providers)) {
                throw new Error("JSON must contain a 'providers' array")
            }

            const newFont: CustomFont = {
                id: `font_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: parsed.name || `imported_font_${fonts.length + 1}`,
                providers: parsed.providers.map((p: any) => ({
                    ...p,
                    id: `preset_${Math.random().toString(36).substring(2, 9)}`,
                    type: p.type || "bitmap"
                }))
            }

            onImport(newFont)
            setIsImporting(false)
            setImportJson("")
            setImportError(null)
        } catch (e: any) {
            setImportError(e.message)
        }
    }

    const createFromPreset = (presetKey: string) => {
        const preset = FONT_PRESETS[presetKey as keyof typeof FONT_PRESETS]
        if (!preset) return

        const newFont: CustomFont = {
            id: `font_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: `${presetKey}_${fonts.length + 1}`,
            providers: preset.providers.map(p => ({ ...p, id: `provider_${Math.random().toString(36).substring(2, 9)}` }))
        }

        onImport(newFont)
        setSelectedPreset(null)
    }

    const addProvider = (fontId: string, type: FontProvider["type"]) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return

        const newProvider: FontProvider = {
            id: `provider_${Math.random().toString(36).substring(2, 9)}`,
            type,
            ...(type === "space" ? { advances: {} } : {}),
            ...(type === "bitmap" ? { height: 8, ascent: 8, chars: [] } : {}),
            ...(type === "ttf" ? { size: 11, oversample: 1, shift: [0, 0], skip: [] } : {})
        }

        onUpdate(fontId, { providers: [...font.providers, newProvider] })
    }

    const removeProvider = (fontId: string, index: number) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return

        const newProviders = [...font.providers]
        newProviders.splice(index, 1)
        onUpdate(fontId, { providers: newProviders })
    }

    const updateProvider = (fontId: string, index: number, data: Partial<FontProvider>) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return

        const newProviders = [...font.providers]
        newProviders[index] = { ...newProviders[index], ...data }
        onUpdate(fontId, { providers: newProviders })
    }

    const updateSpaceAdvance = (fontId: string, providerIndex: number, char: string, advance: number) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return
        const provider = font.providers[providerIndex]
        if (!provider || provider.type !== "space") return

        const newAdvances = { ...provider.advances, [char]: advance }
        updateProvider(fontId, providerIndex, { advances: newAdvances })
    }

    const removeSpaceAdvance = (fontId: string, providerIndex: number, char: string) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return
        const provider = font.providers[providerIndex]
        if (!provider || provider.type !== "space") return

        const newAdvances = { ...provider.advances }
        delete newAdvances[char]
        updateProvider(fontId, providerIndex, { advances: newAdvances })
    }

    const generateUnicodeSequence = (start: number, count: number): string[] => {
        return Array.from({ length: count }, (_, i) =>
            String.fromCodePoint(start + i)
        )
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-2xl font-bold">Custom Fonts</h3>
                    <p className="text-muted-foreground">Create bitmap fonts, TTFs, and spacing for GUIs, effects, and icons.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowUnicodeHelper(!showUnicodeHelper)}>
                        <Type className="mr-2 h-4 w-4" />
                        Unicode Helper
                    </Button>
                    <Button variant="outline" onClick={() => setIsImporting(!isImporting)}>
                        {isImporting ? "Cancel Import" : "Import JSON"}
                    </Button>
                    <Button onClick={() => onAdd(undefined as any)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Font Definition
                    </Button>
                </div>
            </div>

            {/* Unicode Helper */}
            {showUnicodeHelper && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Unicode Character Helper</CardTitle>
                        <CardDescription>Generate safe unicode characters for your custom fonts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Hex (e.g., E000)</Label>
                                <Input
                                    value={unicodeStart}
                                    onChange={(e) => setUnicodeStart(e.target.value.toUpperCase())}
                                    placeholder="E000"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preview</Label>
                                <div className="p-2 border rounded bg-background font-mono text-sm">
                                    U+{unicodeStart} = \u{unicodeStart}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Common Ranges</Label>
                            <div className="grid gap-2">
                                {Object.entries(UNICODE_RANGES).map(([key, range]) => (
                                    <div key={key} className="p-3 border rounded bg-background">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">{range.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    U+{range.start.toString(16).toUpperCase()} - U+{range.end.toString(16).toUpperCase()}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setUnicodeStart(range.start.toString(16).toUpperCase())}
                                            >
                                                Use
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Font Presets */}
            <Card className="border-2 border-secondary/20 bg-secondary/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-secondary" />
                        Quick Start Presets
                    </CardTitle>
                    <CardDescription>Based on common Minecraft font use cases</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(FONT_PRESETS).map(([key, preset]) => {
                            const Icon = preset.icon
                            return (
                                <Card key={key} className="border hover:border-primary/50 transition-colors cursor-pointer group">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-base">{preset.name}</CardTitle>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => createFromPreset(key)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                        <CardDescription className="text-xs">{preset.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-muted-foreground">Usage Example:</Label>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-2"
                                                    onClick={() => copyToClipboard(preset.usage)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
                                                {preset.usage}
                                            </code>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {isImporting && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Import Font Configuration</CardTitle>
                        <CardDescription>Paste your font JSON configuration here. It must include a "providers" array.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                            className="font-mono text-xs min-h-[150px]"
                            placeholder='{ "providers": [ { "type": "bitmap", ... } ] }'
                        />
                        {importError && (
                            <p className="text-sm text-destructive font-medium">{importError}</p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsImporting(false)}>Cancel</Button>
                            <Button onClick={handleImportConfig}>Import Configuration</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6">
                {fonts.map((font) => (
                    <Card key={font.id} className="border-2">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Type className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle className="text-lg">{font.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs text-muted-foreground mt-1">
                                            namespace:font/{font.name.replace(/\.[^/.]+$/, "")}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete(font.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Font
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Font Preview Area */}
                            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Real-time Preview
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`preview-${font.id}`} className="text-xs text-muted-foreground whitespace-nowrap">Preview Text:</Label>
                                        <Input
                                            id={`preview-${font.id}`}
                                            value={previewText}
                                            onChange={(e) => setPreviewText(e.target.value)}
                                            className="h-7 w-32 font-mono text-xs"
                                            placeholder="\uE000"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center p-8 bg-black/5 rounded border-2 border-dashed border-muted min-h-[100px] items-center">
                                    <FontPreview providers={font.providers} text={previewText} />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic">
                                    Note: Preview uses canvas to simulate Minecraft rendering. TTF providers use system fonts.
                                </p>

                                {/* Command Snippets Section */}
                                <div className="pt-4 border-t border-border/50 space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                        <Copy className="h-3 w-3" />
                                        {t.fonts.commandSnippets}
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            {
                                                label: t.fonts.tellraw,
                                                command: `/tellraw @a {"text":"${previewText}"}`
                                            },
                                            {
                                                label: t.fonts.title,
                                                command: `/title @a title {"text":"${previewText}"}`
                                            },
                                            {
                                                label: t.fonts.rename,
                                                command: `'{"text":"${previewText}","italic":false,"color":"white"}'`
                                            },
                                            {
                                                label: t.fonts.generic,
                                                command: `{"text":"${previewText}"}`
                                            }
                                        ].map((snippet, idx) => (
                                            <div key={idx} className="space-y-1 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-medium text-muted-foreground">{snippet.label}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            const cmd = snippet.command.replace(/\\\\u/g, '\\u');
                                                            copyToClipboard(cmd);
                                                            // toast would be better but let's assume it works for now or add it if imported
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="p-2 bg-background rounded border text-[10px] font-mono break-all line-clamp-2">
                                                    {snippet.command}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {font.providers.map((provider, index) => (
                                <div key={index} className="rounded-lg border bg-card p-4 shadow-sm relative group">
                                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => removeProvider(font.id, index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            {provider.type}
                                        </span>
                                        <span className="text-sm text-muted-foreground">Provider #{index + 1}</span>
                                    </div>

                                    {provider.type === "bitmap" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Texture File {provider.fileHandle && <span className="text-xs text-muted-foreground font-normal">({provider.fileHandle.name})</span>}</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/png"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                updateProvider(font.id, index, { fileHandle: file })
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Custom Path <span className="text-xs text-muted-foreground">(optional, e.g., minecraft:font/icon.png)</span></Label>
                                                    <Input
                                                        type="text"
                                                        value={provider.file || ""}
                                                        onChange={(e) => updateProvider(font.id, index, { file: e.target.value })}
                                                        placeholder="minecraft:font/custom.png"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Height <span className="text-xs text-muted-foreground">(vertical size in pixels)</span></Label>
                                                    <Input
                                                        type="number"
                                                        value={provider.height || 8}
                                                        onChange={(e) => updateProvider(font.id, index, { height: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Ascent <span className="text-xs text-muted-foreground">(vertical position, must be &lt; height)</span></Label>
                                                    <Input
                                                        type="number"
                                                        value={provider.ascent || 8}
                                                        onChange={(e) => updateProvider(font.id, index, { ascent: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Characters Grid</Label>
                                                <Textarea
                                                    className="font-mono text-sm tracking-widest break-all"
                                                    rows={5}
                                                    placeholder="Enter characters row by row..."
                                                    value={provider.chars?.join("\n") || ""}
                                                    onChange={(e) => updateProvider(font.id, index, { chars: e.target.value.split("\n") })}
                                                />
                                                <p className="text-xs text-muted-foreground">Each line represents a row in the texture. Use Unicode characters like \uE000, \uE001, etc.</p>
                                            </div>
                                        </div>
                                    )}

                                    {provider.type === "ttf" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Font File {provider.fileHandle && <span className="text-xs text-muted-foreground font-normal">({provider.fileHandle.name})</span>}</Label>
                                                    <Input
                                                        type="file"
                                                        accept=".ttf,.otf"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                updateProvider(font.id, index, { fileHandle: file })
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Custom Path <span className="text-xs text-muted-foreground">(optional, e.g., minecraft:negative_spaces.ttf)</span></Label>
                                                    <Input
                                                        type="text"
                                                        value={provider.file || ""}
                                                        onChange={(e) => updateProvider(font.id, index, { file: e.target.value })}
                                                        placeholder="minecraft:font/custom.ttf"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Size</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={provider.size || 11}
                                                        onChange={(e) => updateProvider(font.id, index, { size: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Oversample</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={provider.oversample || 1.0}
                                                        onChange={(e) => updateProvider(font.id, index, { oversample: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Shift X</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={provider.shift?.[0] || 0}
                                                        onChange={(e) => updateProvider(font.id, index, { shift: [parseFloat(e.target.value), provider.shift?.[1] || 0] })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Shift Y</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={provider.shift?.[1] || 0}
                                                        onChange={(e) => updateProvider(font.id, index, { shift: [provider.shift?.[0] || 0, parseFloat(e.target.value)] })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Skip Characters</Label>
                                                <Input
                                                    value={provider.skip?.join("") || ""}
                                                    onChange={(e) => updateProvider(font.id, index, { skip: e.target.value.split("") })}
                                                    placeholder="e.g. abc"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {provider.type === "space" && (
                                        <div className="space-y-4">
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Character</TableHead>
                                                            <TableHead>Unicode</TableHead>
                                                            <TableHead>Advance (pixels)</TableHead>
                                                            <TableHead className="w-[50px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {Object.entries(provider.advances || {}).map(([char, advance]) => (
                                                            <TableRow key={char}>
                                                                <TableCell className="font-mono">{char}</TableCell>
                                                                <TableCell className="font-mono text-muted-foreground text-xs">
                                                                    U+{char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={advance < 0 ? "destructive" : "secondary"}>
                                                                        {advance > 0 ? `+${advance}` : advance}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 text-destructive"
                                                                        onClick={() => removeSpaceAdvance(font.id, index, char)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="p-2">
                                                                <form
                                                                    className="flex gap-2"
                                                                    onSubmit={(e) => {
                                                                        e.preventDefault()
                                                                        const form = e.target as HTMLFormElement
                                                                        const charInput = form.elements.namedItem("char") as HTMLInputElement
                                                                        const advanceInput = form.elements.namedItem("advance") as HTMLInputElement
                                                                        if (charInput.value && advanceInput.value) {
                                                                            updateSpaceAdvance(font.id, index, charInput.value, parseFloat(advanceInput.value))
                                                                            charInput.value = ""
                                                                            advanceInput.value = ""
                                                                            charInput.focus()
                                                                        }
                                                                    }}
                                                                >
                                                                    <Input name="char" placeholder="Char (e.g., \uE000)" className="w-32 font-mono" maxLength={1} />
                                                                    <Input name="advance" type="number" placeholder="Pixels (negative to shift left)" className="flex-1" />
                                                                    <Button type="submit" size="sm" variant="secondary">Add</Button>
                                                                </form>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                💡 Tip: Use negative values to shift text left (perfect for GUI overlays). Example: -8 pixels
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => addProvider(font.id, "space")}>
                                    <MoveRight className="mr-2 h-4 w-4" />
                                    Add Space Provider
                                </Button>
                                <Button variant="outline" onClick={() => addProvider(font.id, "bitmap")}>
                                    <Layers className="mr-2 h-4 w-4" />
                                    Add Bitmap Provider
                                </Button>
                                <Button variant="outline" onClick={() => addProvider(font.id, "ttf")}>
                                    <Type className="mr-2 h-4 w-4" />
                                    Add TTF Provider
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {fonts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                    <p>No custom fonts defined.</p>
                    <p className="text-sm">Try a preset above or start fresh to begin.</p>
                </div>
            )}
        </div>
    )
}
