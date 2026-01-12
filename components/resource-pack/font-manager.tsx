"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Type, MoveRight, Layers, Settings2, Layout, Smartphone } from "lucide-react"
import { CustomFont, FontProvider } from "./types"

interface FontManagerProps {
    fonts: CustomFont[]
    onAdd: (file: File) => void
    onImport: (font: CustomFont) => void
    onUpdate: (id: string, data: Partial<CustomFont>) => void
    onDelete: (id: string) => void
}

export function FontManager({ fonts, onAdd, onImport, onUpdate, onDelete }: FontManagerProps) {
    const [isImporting, setIsImporting] = useState(false)
    const [importJson, setImportJson] = useState("")
    const [importError, setImportError] = useState<string | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onAdd(file)
        }
    }

    const handleImportConfig = () => {
        try {
            const parsed = JSON.parse(importJson)
            if (!parsed.providers || !Array.isArray(parsed.providers)) {
                throw new Error("JSON must contain a 'providers' array")
            }

            // Generate a valid CustomFont object
            const newFont: CustomFont = {
                id: `font_${Date.now()}`,
                name: parsed.name || `imported_font_${fonts.length + 1}`,
                providers: parsed.providers.map((p: any) => ({
                    ...p,
                    id: crypto.randomUUID(), // Ensure internal IDs exist
                    // Ensure types are valid, default to bitmap if missing
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

    const addProvider = (fontId: string, type: FontProvider["type"]) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return

        const newProvider: FontProvider = {
            id: crypto.randomUUID(),
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-2xl font-bold">Custom Fonts</h3>
                    <p className="text-muted-foreground">Manage bitmaps, TTFs, and spacing adjustments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsImporting(!isImporting)}>
                        {isImporting ? "Cancel Import" : "Import JSON"}
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".png"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    // Create a "Perfect GUI" preset: Bitmap + Negative Space
                                    // Use distinct unicodes: \uE000 for space shift, \uE001 for the image
                                    const newFont: CustomFont = {
                                        id: `font_${Date.now()}`,
                                        name: "gui_" + file.name.replace(/\.[^/.]+$/, ""),
                                        file: file,
                                        providers: [
                                            {
                                                id: crypto.randomUUID(),
                                                type: "space",
                                                advances: { "\uE000": -8 }
                                            },
                                            {
                                                id: crypto.randomUUID(),
                                                type: "bitmap",
                                                height: 80,
                                                ascent: 10,
                                                chars: ["\uE001"]
                                            }
                                        ]
                                    }
                                    onImport(newFont)
                                    // Reset input so same file can be selected again
                                    e.target.value = ""
                                }
                            }}
                        />
                        <Button variant="secondary">
                            <Layout className="mr-2 h-4 w-4" />
                            Add GUI Overlay
                        </Button>
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".ttf,.otf,.png"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                        />
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Font Definition
                        </Button>
                    </div>
                </div>
            </div>

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
                                        <CardDescription className="font-mono text-xs text-muted-foreground mt-1">namespace:font/{font.name.replace(/\.[^/.]+$/, "")}</CardDescription>
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
                                                    <Label>Height</Label>
                                                    <Input
                                                        type="number"
                                                        value={provider.height || 8}
                                                        onChange={(e) => updateProvider(font.id, index, { height: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label>Ascent</Label>
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
                                                <p className="text-xs text-muted-foreground">Each line represents a row in the texture.</p>
                                            </div>
                                        </div>
                                    )}

                                    {provider.type === "ttf" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
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
                                                                <TableCell>{advance}</TableCell>
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
                                                                    <Input name="char" placeholder="Char" className="w-20 font-mono" maxLength={1} />
                                                                    <Input name="advance" type="number" placeholder="Pixels" className="flex-1" />
                                                                    <Button type="submit" size="sm" variant="secondary">Add</Button>
                                                                </form>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
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
                    <p className="text-sm">Upload a font file or start fresh to begin.</p>
                </div>
            )}
        </div>
    )
}
